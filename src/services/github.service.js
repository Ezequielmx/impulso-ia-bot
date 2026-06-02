const axios = require('axios');
const config = require('../config');

if (!config.GITHUB_TOKEN) {
  // Fail fast but don't crash on require; functions will throw when invoked.
  console.warn('GITHUB_TOKEN no configurado. Configurá GITHUB_TOKEN en .env para usar el repo online. El servicio lanzará errores si se invoca sin token.');
}

const api = axios.create({ baseURL: 'https://api.github.com', headers: { Authorization: `token ${config.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } });

async function listDir(p) {
  if (!config.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN no configurado. No se puede listar directorios sin acceso a GitHub.');
  const rel = p ? String(p).replace(/^\/+/, '') : '';
  const repoPath = `/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/contents/${rel}`;
  const res = await api.get(repoPath, { params: { ref: config.GITHUB_BRANCH } });
  return res.data;
}

async function readFile(p) {
  if (!config.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN no configurado. No se puede leer archivos sin acceso a GitHub.');
  const rel = String(p).replace(/^\/+/, '');
  const repoPath = `/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/contents/${rel}`;
  const res = await api.get(repoPath, { params: { ref: config.GITHUB_BRANCH } });
  if (res.data && res.data.content) return Buffer.from(res.data.content, 'base64').toString('utf8');
  return null;
}

async function createFile(p, content, message) {
  if (!config.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN no configurado. No se puede crear archivos sin acceso a GitHub.');
  const rel = String(p).replace(/^\/+/, '');
  const repoPath = `/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/contents/${rel}`;
  const res = await api.put(repoPath, {
    message: message || `docs(bot): agregar nota ${rel}`,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: config.GITHUB_BRANCH,
  });
  return res.data;
}

module.exports = { listDir, readFile, createFile };
