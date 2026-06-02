const axios = require('axios');
const config = require('../config');

async function sendMessage({ groupId, text }) {
  // Minimal wrapper: sends a message via Wassenger API.
  // Implementation depends on Wassenger HTTP API; this is a placeholder.
  try {
    if (!config.WASSENGER_TOKEN || !config.WASSENGER_DEVICE_ID) {
      console.warn('Wassenger not configured, skipping sendMessage');
      return null;
    }

    const url = `https://api.wassenger.com/v1/${config.WASSENGER_DEVICE_ID}/messages`;
    const payload = {
      to: groupId,
      type: 'text',
      text,
    };

    const res = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${config.WASSENGER_TOKEN}` },
    });
    return res.data;
  } catch (err) {
    console.error('Wassenger sendMessage error', err?.message || err);
    throw err;
  }
}

module.exports = { sendMessage };
