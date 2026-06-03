const axios = require('axios');
const config = require('../config');

async function sendMessage({ groupId, text }) {
  try {
    if (!config.WASSENGER_TOKEN || !config.WASSENGER_DEVICE_ID) {
      console.warn('Wassenger not configured (WASSENGER_TOKEN or WASSENGER_DEVICE_ID missing), skipping sendMessage');
      return null;
    }

    // Wassenger API endpoint: send message to a chat
    const url = `https://api.wassenger.com/v1/device/${config.WASSENGER_DEVICE_ID}/message`;
    const payload = {
      to: groupId,
      message: text,
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.WASSENGER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Message sent to Wassenger:', res.status);
    return res.data;
  } catch (err) {
    console.warn('Wassenger sendMessage failed (continuing anyway):', err?.message || err?.response?.data?.message || err?.response?.status || 'unknown error');
    // Don't throw — allow webhook to continue even if Wassenger fails
    return null;
  }
}

module.exports = { sendMessage };
