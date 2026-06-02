function slugify(text) {
  return text
    .toString()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function summarize(text, max = 300) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

module.exports = { slugify, summarize };
