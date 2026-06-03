const axios = require('axios');
const config = require('../config');

const CHAT_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `Sos un asistente del equipo que vive en un grupo de WhatsApp. Respondés en español rioplatense, de forma concisa y natural, sin markdown complejo (nada de ** ni ##, sí podés usar emojis y listas simples con guiones).

Tenés acceso a un repositorio privado con esta estructura:
- notas/      → notas del equipo generadas por vos o por los usuarios
- docs/       → documentación interna
- clientes/   → información de clientes
- prompts/    → prompts guardados
- recursos/   → recursos varios
- sitio_web/  → contenido y modificaciones del sitio web

Herramientas disponibles:
- listar_archivos: para explorar carpetas del repo
- buscar_en_repo: para encontrar información por texto (búsqueda recursiva)
- leer_archivo: para leer el contenido completo de un archivo
- agregar_nota: para crear una nota nueva en notas/bot/

Cuándo usar cada una:
- Si preguntan por algo concreto → buscá con buscar_en_repo primero
- Si preguntan qué hay en una carpeta → usá listar_archivos
- Si encontrás un archivo relevante → leelo con leer_archivo para dar la respuesta completa
- Si te piden guardar o anotar algo → usá agregar_nota con un título claro y el contenido completo
- Si no encontrás nada, o las herramientas devuelven vacío o "no existe" → respondé directamente al usuario diciendo que no hay información y ofrecé crear una nota. No sigas llamando herramientas si ya probaste las opciones relevantes.

Cuando creás una nota, confirmá con el path donde quedó guardada.

Tu único rol es ayudar con información del repositorio y el proyecto. Si alguien pregunta algo que no tiene nada que ver (chistes, recetas, noticias, temas generales, etc.), respondé brevemente que no podés ayudar con eso y recordá para qué estás.`;

async function chatCompletion(messages, toolDefs = []) {
  const isNewModel = /^(gpt-5|o\d)/i.test(config.OPENAI_MODEL);
  const body = {
    model: config.OPENAI_MODEL,
    messages,
    ...(isNewModel ? { max_completion_tokens: 2000 } : { max_tokens: 2000 }),
    ...(toolDefs.length > 0 ? { tools: toolDefs, tool_choice: 'auto' } : {}),
  };

  const resp = await axios.post(CHAT_URL, body, {
    headers: {
      Authorization: `Bearer ${config.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return resp.data.choices[0].message;
}

async function callWithToolLoop({ userInput, tools = {}, sender = 'desconocido' }) {
  if (!config.OPENAI_API_KEY) {
    return 'OpenAI no está configurado. Definí OPENAI_API_KEY en .env para habilitar respuestas.';
  }

  // Convert tools map to OpenAI function definitions
  const toolDefs = Object.keys(tools).map(name => ({
    type: 'function',
    function: {
      name,
      description: tools[name].description,
      parameters: tools[name].parameters || { type: 'object', properties: {}, additionalProperties: true },
    },
  }));

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userInput },
  ];

  // Tool loop — max 8 rounds to avoid infinite loops
  for (let i = 0; i < 8; i++) {
    let assistantMsg;
    try {
      assistantMsg = await chatCompletion(messages, toolDefs);
    } catch (err) {
      console.error('OpenAI chatCompletion error', err?.response?.data || err?.message || err);
      throw err;
    }

    console.log(`[openai] ronda ${i + 1} — tool_calls: ${assistantMsg.tool_calls?.length || 0}, content: ${assistantMsg.content?.slice(0, 80) || '(vacío)'}`);
    messages.push(assistantMsg);

    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      return assistantMsg.content || '';
    }

    // Execute each tool call and append results
    for (const tc of assistantMsg.tool_calls) {
      const fnName = tc.function.name;
      let args = {};
      try {
        args = JSON.parse(tc.function.arguments || '{}');
      } catch (_) {}

      console.log(`[openai] tool call: ${fnName}`, args);

      let result;
      if (tools[fnName]) {
        try {
          result = await tools[fnName].fn(args);
          console.log(`[openai] tool result: ${fnName} →`, JSON.stringify(result).slice(0, 200));
        } catch (err) {
          result = { error: err?.message || 'error al ejecutar la herramienta' };
          console.warn(`[openai] tool error: ${fnName} →`, err?.message);
        }
      } else {
        result = { error: `herramienta desconocida: ${fnName}` };
        console.warn(`[openai] tool desconocida: ${fnName}`);
      }

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }
  }

  console.warn('[openai] loop agotado sin respuesta final');
  return 'No pude obtener una respuesta. Intentá de nuevo.';
}

module.exports = { callWithToolLoop };
