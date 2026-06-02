const github = require('../services/github.service');
const pathGuard = require('../utils/pathGuard');
const { slugify } = require('../utils/text');

async function listar_archivos(path) {
  if (!pathGuard.isPathAllowed(path)) throw new Error('ruta no permitida');
  return github.listDir(path);
}

async function buscar_en_repo(query) {
  // Simple approach: list allowed folders and search client-side
  const allowed = pathGuard.allowedPaths();
  const results = [];
  for (const p of allowed) {
    try {
      const items = await github.listDir(p);
      for (const it of items) {
        if (it.type === 'file') {
          const content = await github.readFile(it.path);
          if (content && content.toLowerCase().includes(query.toLowerCase())) {
            results.push({ path: it.path, snippet: content.slice(0, 300) });
          }
        }
      }
    } catch (e) {
      // ignore per-folder errors
    }
  }
  return results;
}

async function leer_archivo(path) {
  if (!pathGuard.isPathAllowed(path)) throw new Error('ruta no permitida');
  return github.readFile(path);
}

async function agregar_nota(titulo, contenido, autor = 'desconocido') {
  const fecha = new Date().toISOString().slice(0, 10);
  const slug = slugify(titulo).slice(0, 60);
  const path = `notas/bot/${fecha}-${slug}.md`;
  const md = `---\nfecha: ${fecha}\nautor: ${autor}\ntitulo: ${titulo}\n---\n\n${contenido}\n`;
  return github.createFile(path, md, `docs(bot): agregar nota ${titulo}`);
}

module.exports = { listar_archivos, buscar_en_repo, leer_archivo, agregar_nota };
