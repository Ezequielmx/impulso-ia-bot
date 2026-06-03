const github = require('../services/github.service');
const pathGuard = require('../utils/pathGuard');
const { slugify } = require('../utils/text');

async function listar_archivos(path) {
  if (!path) {
    // Sin path: devolver lista de carpetas permitidas
    return pathGuard.allowedPaths().map(p => ({ name: p, type: 'dir', path: p }));
  }
  if (!pathGuard.isPathAllowed(path)) throw new Error('ruta no permitida');
  return github.listDir(path);
}

async function buscar_en_repo(query) {
  const allowed = pathGuard.allowedPaths();
  const results = [];

  async function searchDir(dirPath) {
    try {
      const items = await github.listDir(dirPath);
      for (const it of items) {
        if (it.type === 'file') {
          const content = await github.readFile(it.path);
          if (content && content.toLowerCase().includes(query.toLowerCase())) {
            results.push({ path: it.path, snippet: content.slice(0, 300) });
          }
        } else if (it.type === 'dir') {
          await searchDir(it.path);
        }
      }
    } catch (_) {}
  }

  for (const p of allowed) {
    await searchDir(p);
  }
  return results;
}

async function leer_archivo(path) {
  if (!pathGuard.isPathAllowed(path)) throw new Error('ruta no permitida');
  return github.readFile(path);
}

async function agregar_nota(titulo, contenido, autor = 'desconocido') {
  const fecha = new Date().toISOString().slice(0, 10);
  const slug = slugify(titulo).slice(0, 40);
  const random = Math.random().toString(36).slice(2, 8);
  const path = `notas/bot/${fecha}-${slug}-${random}.md`;
  const md = `---\nfecha: ${fecha}\nautor: ${autor}\ntitulo: ${titulo}\n---\n\n${contenido}\n`;
  return github.createFile(path, md, `docs(bot): agregar nota ${titulo}`);
}

module.exports = { listar_archivos, buscar_en_repo, leer_archivo, agregar_nota };
