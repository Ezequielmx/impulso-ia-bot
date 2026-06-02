# impulso-ia-bot

Bot de WhatsApp grupal para consultar un repo privado de GitHub.

Setup local rápido:

1. Copiar `.env.example` a `.env` y completar variables.

2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar en desarrollo:

```bash
npm run dev
```

Endpoints:

- `GET /health` → estado
- `POST /webhook/wassenger` → webhook de Wassenger

Estructura principal en `src/` con servicios para OpenAI, GitHub y Wassenger, y tools para que OpenAI pueda listar, buscar, leer y agregar notas.

Cómo generar un `GITHUB_TOKEN` (rápido):

1. Entrá a https://github.com/settings/tokens → "Generate new token" (recomiendo Classic o Fine-grained según políticas).
2. Para acceso a repos privados y poder leer/crear archivos, asigná **repo** (o en fine-grained: seleccionar el repo `impulso-ia` y dar permisos `Contents: Read & Write`).
3. Generá el token y copialo inmediatamente. Pegalo en `.env` como `GITHUB_TOKEN=ghp_xxx...`.

Alternativa con `gh` (CLI):

```powershell
gh auth login
gh auth refresh -h github.com -s repo
```

Reiniciá el servidor después de cambiar `.env`:

```bash
npm run dev
```
