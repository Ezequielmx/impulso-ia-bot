const ALLOWED = [
  'clientes',
  'docs',
  'notas',
  'prompts',
  'recursos',
  'web',
];

function allowedPaths() {
  return ALLOWED;
}

function isPathAllowed(path) {
  if (!path) return false;
  const p = path.replace(/^\/+/, '');
  return ALLOWED.some(a => p === a || p.startsWith(`${a}/`) );
}

function isWriteAllowed(path) {
  if (!path) return false;
  const p = path.replace(/^\/+/, '');
  return p.startsWith('notas/bot/');
}

module.exports = { allowedPaths, isPathAllowed, isWriteAllowed };
