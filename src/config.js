require('dotenv').config();

module.exports = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',

  WASSENGER_TOKEN: process.env.WASSENGER_TOKEN,
  WASSENGER_DEVICE_ID: process.env.WASSENGER_DEVICE_ID,

  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_OWNER: process.env.GITHUB_OWNER,
  GITHUB_REPO: process.env.GITHUB_REPO,
  GITHUB_BRANCH: process.env.GITHUB_BRANCH || 'main',

  AUTHORIZED_GROUP_ID: process.env.AUTHORIZED_GROUP_ID,
  BOT_TRIGGER: process.env.BOT_TRIGGER || '@bot',

  PORT: process.env.PORT || 3000,
};
