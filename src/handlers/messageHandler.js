const config = require('../config');
const repoTools = require('../tools/repoTools');
const openai = require('../services/openai.service');
const wassenger = require('../services/wassenger.service');

function extractText(payload) {
  return payload?.text || payload?.message || payload?.body || '';
}

function extractSender(payload) {
  return payload?.from || payload?.senderName || payload?.author || payload?.number || 'desconocido';
}

async function handleWassengerWebhook(payload) {
  const groupId = payload?.group?.id || payload?.group_id || payload?.chatId;
  const textRaw = extractText(payload);
  const sender = extractSender(payload);

  if (!groupId || (config.AUTHORIZED_GROUP_ID && groupId !== config.AUTHORIZED_GROUP_ID)) {
    return { ok: true, reason: 'group_not_authorized' };
  }

  if (!textRaw || !textRaw.includes(config.BOT_TRIGGER)) {
    return { ok: true, reason: 'no_trigger' };
  }

  const text = textRaw.replace(config.BOT_TRIGGER, '').trim();

  // Shortcut: agregar nota commands
  const lower = text.toLowerCase();
  if (lower.startsWith('agreg') || lower.startsWith('agregá') || lower.startsWith('agrega')) {
    // Expected format: "agregá nota: Título. Contenido..." or "agregá nota: contenido"
    const parts = text.split(':');
    let title = 'nota';
    let content = text;
    if (parts.length >= 2) {
      title = parts[0].replace(/agreg\w* nota/i, '').trim() || 'nota';
      content = parts.slice(1).join(':').trim();
    }

    const res = await repoTools.agregar_nota(title, content, sender);
    const path = res && res.content && res.content.path ? res.content.path : 'notas/bot/??';
    const reply = `Nota creada en /${path}`;
    await wassenger.sendMessage({ groupId, text: reply });
    return { ok: true, action: 'agregar_nota', path };
  }

  // General query: use OpenAI with tools
  const tools = {
    listar_archivos: { description: 'Lista archivos y carpetas dentro de una ruta permitida', fn: async (args) => repoTools.listar_archivos(args.path || '') },
    buscar_en_repo: { description: 'Busca texto en archivos permitidos', fn: async (args) => repoTools.buscar_en_repo(args.query || '') },
    leer_archivo: { description: 'Lee el contenido de un archivo permitido', fn: async (args) => repoTools.leer_archivo(args.path || '') },
  };

  const answer = await openai.callWithToolLoop({ userInput: text, tools });
  await wassenger.sendMessage({ groupId, text: answer });
  return { ok: true, action: 'answered' };
}

module.exports = { handleWassengerWebhook };
