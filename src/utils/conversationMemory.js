const config = require('../config');

// Map<groupId, Array<{role, content, senderName}>>
const histories = new Map();

function getHistory(groupId) {
  return histories.get(groupId) || [];
}

function addMessage(groupId, role, content, senderName = null) {
  const history = histories.get(groupId) || [];
  history.push({ role, content, senderName });
  const limit = config.CONVERSATION_HISTORY_SIZE;
  if (history.length > limit) {
    history.splice(0, history.length - limit);
  }
  histories.set(groupId, history);
}

function clearHistory(groupId) {
  histories.delete(groupId);
}

module.exports = { getHistory, addMessage, clearHistory };
