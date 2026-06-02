const axios = require('axios');
const config = require('../config');

const OPENAI_URL = 'https://api.openai.com/v1/responses';


async function rawPrompt(text) {
  try {
    if (!config.OPENAI_API_KEY) return 'OpenAI no está configurado. Definí OPENAI_API_KEY en .env para habilitar respuestas.';
    const resp = await axios.post(OPENAI_URL, {
      model: config.OPENAI_MODEL,
      input: text,
      max_output_tokens: 800,
    }, {
      headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
    });
    const data = resp.data;
    const out = data.output && data.output[0] && data.output[0].content
      ? data.output[0].content.map(c => c.text || c).join('')
      : JSON.stringify(data);
    return out;
  } catch (err) {
    console.error('OpenAI rawPrompt error', err?.message || err?.response?.data || err);
    throw err;
  }
}

async function callWithToolLoop({ userInput, tools = {} }) {
  // tools: { name: { description, fn } }
  const toolList = Object.keys(tools).map(n => `- ${n}: ${tools[n].description}`).join('\n');

  const system = `Sos un asistente que responde en español rioplatense. Disponés de estas herramientas:\n${toolList}\n\nCuando necesites usar una herramienta, responde SOLO con un JSON en una línea con la forma: {"action":"tool","tool":"tool_name","args":{...}}.\nCuando quieras dar la respuesta final, responde SOLO con un JSON: {"action":"final","response":"..."}.`;

  // First call
  const prompt = system + '\nUsuario: ' + userInput;
  const first = await rawPrompt(prompt);

  try {
    const parsed = JSON.parse(first.trim());
    if (parsed.action === 'tool' && parsed.tool && tools[parsed.tool]) {
      const args = parsed.args || {};
      const toolResult = await tools[parsed.tool].fn(args);
      // send tool result back for finalization
      const follow = system + '\nUsuario: ' + userInput + '\nToolResult for ' + parsed.tool + ': ' + JSON.stringify(toolResult) + '\nPor favor, responde ahora el resultado final en JSON.';
      const finalResp = await rawPrompt(follow);
      try {
        const parsedFinal = JSON.parse(finalResp.trim());
        if (parsedFinal.action === 'final') return parsedFinal.response;
      } catch (_) {
        return finalResp;
      }
    }
    // If model returned final directly or unstructured, try parse final
    if (parsed.action === 'final') return parsed.response;
  } catch (e) {
    // Not JSON — treat as final text
    return first;
  }

  return first;
}

module.exports = { callWithToolLoop, rawPrompt };
