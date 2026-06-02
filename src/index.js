const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const config = require('./config');
const wassenger = require('./services/wassenger.service');
const handler = require('./handlers/messageHandler');

const app = express();
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.post('/webhook/wassenger', async (req, res) => {
  try {
    const payload = req.body;
    const result = await handler.handleWassengerWebhook(payload);
    res.status(200).json(result || { ok: true });
  } catch (err) {
    console.error('Webhook error', err);
    res.status(500).json({ ok: false });
  }
});

const port = config.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
