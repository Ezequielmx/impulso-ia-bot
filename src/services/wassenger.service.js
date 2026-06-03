const axios = require('axios');
const config = require('../config');

async function postToWassenger(url, payload) {
  return axios.post(url, payload, {
    headers: {
      Token: config.WASSENGER_TOKEN,
      'Content-Type': 'application/json',
    },
  });
}

async function sendMessage({ groupId, text }) {
  try {
    if (!config.WASSENGER_TOKEN) {
      console.warn('Wassenger not configured (WASSENGER_TOKEN missing), skipping sendMessage');
      return null;
    }

    const url = 'https://api.wassenger.com/v1/messages';
    const candidates = [
      { to: groupId, message: text, type: 'text' },
      { chat: groupId, message: text, type: 'text' },
      { chatId: groupId, message: text, type: 'text' },
      { to: groupId, body: text, type: 'text' },
    ];

    for (const payload of candidates) {
      try {
        const res = await postToWassenger(url, payload);
        console.log('Message sent to Wassenger:', res.status, payload);
        return res.data;
      } catch (err) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        console.warn('Wassenger attempt failed:', status, data || err?.message, payload);
        if (status !== 404 && status !== 400) {
          break;
        }
      }
    }

    console.warn('Wassenger sendMessage all payload attempts failed.');
    return null;
  } catch (err) {
    console.warn('Wassenger sendMessage failed (continuing anyway):', err?.message || err?.response?.data || err?.response?.status || 'unknown error');
    return null;
  }
}

module.exports = { sendMessage };
