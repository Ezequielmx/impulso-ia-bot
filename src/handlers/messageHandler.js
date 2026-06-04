const config = require('../config');
const repoTools = require('../tools/repoTools');
const openai = require('../services/openai.service');
const wassenger = require('../services/wassenger.service');
const memory = require('../utils/conversationMemory');

function getPayloadData(payload) {
  return payload?.data || payload;
}

function extractText(payload) {
  const data = getPayloadData(payload);
  return data?.body || data?.text || data?.message || '';
}

function extractSender(payload) {
  const data = getPayloadData(payload);
  return data?.from || data?.senderName || data?.author || data?.number || 'desconocido';
}

function getBotWaId(payload) {
  // En mensajes inbound de Wassenger, data.to es siempre el WA ID del bot
  const data = getPayloadData(payload);
  return data?.to || '';
}

function isBotMentioned(payload) {
  const data = getPayloadData(payload);
  const textRaw = extractText(payload);

  // Trigger por texto (@bot u otro BOT_TRIGGER configurado)
  if (textRaw?.includes(config.BOT_TRIGGER)) return true;

  // El WA ID del bot en este contexto es data.to (ej: "5491154257750@c.us")
  const botWaId = getBotWaId(payload);

  // Menciones estructuradas: Wassenger manda data.mentions con id = WA ID del mencionado
  const mentionCandidates = [
    ...(data?.mentions || []),
    ...(data?.mentioned || []),
  ];

  if (mentionCandidates.length > 0) {
    const hasBotMention = mentionCandidates.some(m => {
      const mId = String(m?.id || m?.jid || m?.phone || '');
      if (botWaId && mId === botWaId) return true;
      // Fallback: comparar solo dígitos
      const mDigits = mId.replace(/\D/g, '');
      const botDigits = botWaId.replace(/\D/g, '');
      return botDigits && mDigits === botDigits;
    });
    if (hasBotMention) return true;
  }

  if (botWaId) {
    if (data?.mentionedIds?.includes(botWaId)) return true;
    if (data?.mentionedJids?.includes(botWaId)) return true;
  }

  return false;
}

function normalizeGroupId(rawId) {
  if (!rawId || typeof rawId !== 'string') return '';
  return rawId.replace(/[^0-9]/g, '');
}

async function handleWassengerWebhook(payload) {
  const data = getPayloadData(payload);
  const groupId = data?.chat?.id || data?.from || payload?.group?.id || payload?.group_id || payload?.chatId;
  const normalizedGroupId = normalizeGroupId(groupId);
  const normalizedAllowed = normalizeGroupId(config.AUTHORIZED_GROUP_ID);
  const textRaw = extractText(payload);
  const sender = extractSender(payload);

  if (!groupId || (normalizedAllowed && normalizedGroupId !== normalizedAllowed)) {
    console.log('webhook debug: group not authorized', { groupId, normalizedGroupId, authorized: config.AUTHORIZED_GROUP_ID, normalizedAllowed });
    return { ok: true, reason: 'group_not_authorized' };
  }

  if (!textRaw || !isBotMentioned(payload)) {
    console.log('webhook debug: no trigger', {
      groupId,
      textRaw,
      botWaId: getBotWaId(payload),
      mentions: data?.mentions,
      expectedTrigger: config.BOT_TRIGGER,
    });
    return { ok: true, reason: 'no_trigger' };
  }

  // Sacar todas las @menciones del texto preservando el resto del mensaje
  const text = textRaw.replace(/@\S+/g, '').replace(/\s+/g, ' ').trim();

  const tools = {
    listar_archivos: {
      description: 'Lista archivos y carpetas dentro de una ruta del repositorio',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Ruta a listar, ej: notas/bot. Dejá vacío para ver carpetas raíz.' } },
        required: [],
      },
      fn: async (args) => repoTools.listar_archivos(args.path || ''),
    },
    buscar_en_repo: {
      description: 'Busca texto en todos los archivos del repositorio (recursivo)',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Texto a buscar' } },
        required: ['query'],
      },
      fn: async (args) => repoTools.buscar_en_repo(args.query || ''),
    },
    leer_archivo: {
      description: 'Lee el contenido completo de un archivo del repositorio',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Ruta exacta del archivo, ej: notas/bot/2025-01-01-titulo.md' } },
        required: ['path'],
      },
      fn: async (args) => repoTools.leer_archivo(args.path || ''),
    },
    agregar_nota: {
      description: 'Crea una nota nueva en el repositorio dentro de notas/bot/',
      parameters: {
        type: 'object',
        properties: {
          titulo: { type: 'string', description: 'Título de la nota' },
          contenido: { type: 'string', description: 'Contenido completo de la nota' },
        },
        required: ['titulo', 'contenido'],
      },
      fn: async (args) => {
        const res = await repoTools.agregar_nota(args.titulo, args.contenido, sender);
        const path = res?.content?.path || 'notas/bot/??';
        return { ok: true, path, mensaje: `Nota creada en /${path}` };
      },
    },
  };

  const history = memory.getHistory(groupId);
  memory.addMessage(groupId, 'user', text, sender);

  const answer = await openai.callWithToolLoop({ userInput: text, tools, sender, history });

  memory.addMessage(groupId, 'assistant', answer);
  await wassenger.sendMessage({ groupId, text: answer });
  return { ok: true, action: 'answered' };
}

module.exports = { handleWassengerWebhook };
