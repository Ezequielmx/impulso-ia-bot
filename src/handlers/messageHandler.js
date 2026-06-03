const config = require('../config');
const repoTools = require('../tools/repoTools');
const openai = require('../services/openai.service');
const wassenger = require('../services/wassenger.service');

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

function isBotMentioned(payload) {
  // Detectar si el bot fue mencionado (arrobado) de cualquier forma
  const data = getPayloadData(payload);
  const textRaw = extractText(payload);

  const mentionCandidates = [
    ...(data?.mentions || []),
    ...(data?.mentioned || []),
  ];

  if (Array.isArray(mentionCandidates) && mentionCandidates.length > 0) {
    const hasBotMention = mentionCandidates.some(m => {
      const id = String(m?.id || m?.jid || m?.user || m?.phone || '');
      const name = String(m?.name || m?.displayName || m?.pushname || '');
      return id === config.WASSENGER_DEVICE_ID || id.includes('bot') || name.toLowerCase().includes('bot');
    });
    if (hasBotMention) return true;
  }

  if (data?.mentionedIds && Array.isArray(data.mentionedIds) && data.mentionedIds.includes(config.WASSENGER_DEVICE_ID)) {
    return true;
  }

  if (data?.mentionedJids && Array.isArray(data.mentionedJids) && data.mentionedJids.includes(config.WASSENGER_DEVICE_ID)) {
    return true;
  }

  if (textRaw?.includes(config.BOT_TRIGGER)) {
    return true;
  }

  if (textRaw?.trim().startsWith('@')) {
    return true;
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
      normalizedGroupId,
      textRaw,
      payloadKeys: Object.keys(payload || {}),
      mentions: payload?.mentions || payload?.mentioned || payload?.mentionedIds || payload?.mentionedJids,
      isBotMentioned: false,
      expectedTrigger: config.BOT_TRIGGER,
      deviceId: config.WASSENGER_DEVICE_ID,
    });
    return { ok: true, reason: 'no_trigger' };
  }

  // Limpiar el texto de menciones (@bot, @nombre, etc)
  const text = textRaw.replace(/^@[\w\s]*/i, '').trim();

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

    try {
      const res = await repoTools.agregar_nota(title, content, sender);
      const path = res && res.content && res.content.path ? res.content.path : 'notas/bot/??';
      const reply = `Nota creada en /${path}`;
      await wassenger.sendMessage({ groupId, text: reply });
      return { ok: true, action: 'agregar_nota', path };
    } catch (err) {
      console.warn('agregar_nota error (continuing)', err?.message || err);
      const reply = `No pude crear la nota. Error: ${err?.message || 'error desconocido'}. Probá más tarde.`;
      await wassenger.sendMessage({ groupId, text: reply });
      return { ok: true, action: 'agregar_nota_error', error: err?.message };
    }
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
