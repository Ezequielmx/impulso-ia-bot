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
    const payload = {
      chat: groupId,
      message: text,
    };

    const res = await postToWassenger(url, payload);
    console.log('Message sent to Wassenger:', res.status, payload);
    return res.data;
  } catch (err) {
    console.warn('Wassenger sendMessage failed (continuing anyway):', err?.message || err?.response?.data || err?.response?.status || 'unknown error');
    return null;
  }
}

module.exports = { sendMessage };
