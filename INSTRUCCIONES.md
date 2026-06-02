# impulso-ia-bot — Contexto de desarrollo

## Qué es este proyecto

Bot de WhatsApp grupal para consultar un repo privado de GitHub.
Backend Node.js + Express, deployable en Railway.

Integraciones: Wassenger + OpenAI API + GitHub API.

---

## Estado actual

Carpeta recién creada. Hay que construir todo el proyecto desde cero siguiendo la especificación de abajo.

---

## Especificación completa

### Objetivo
MVP de bot que:
1. Lee archivos del repo.
2. Busca información dentro del repo.
3. Responde preguntas sobre el proyecto.
4. Agrega notas nuevas en una carpeta permitida.

NO programa ni modifica código fuente.

---

### Arquitectura

```
WhatsApp grupo
→ Wassenger webhook
→ Backend Node.js + Express
→ OpenAI Responses API con tools/function calling
→ GitHub API
→ Respuesta por Wassenger
```

---

### Repo objetivo

El bot trabaja sobre el repo `impulso-ia` (repo privado de GitHub).

Carpetas del repo:
- /clientes
- /docs
- /notas
- /prompts
- /recursos
- /web

**Lectura permitida:** /clientes, /docs, /notas, /prompts, /recursos, /web

**Escritura permitida:** SOLO /notas/bot/

**Prohibido:**
- No modificar código fuente
- No editar archivos dentro de /web
- No tocar .env, claves, tokens, backups, vendor, node_modules ni archivos sensibles
- No ejecutar comandos del sistema
- No hacer commits sobre archivos fuera de /notas/bot/
- No abrir Pull Requests por ahora

---

### Endpoints

1. `GET /health` → devuelve OK
2. `POST /webhook/wassenger` → recibe mensajes de Wassenger

---

### Flujo del webhook

1. Recibir payload de Wassenger
2. Validar que el mensaje venga del grupo autorizado
3. Ignorar mensajes sin el trigger del bot (`@bot`)
4. Extraer texto, nombre/número del remitente, id del grupo
5. Enviar consulta a OpenAI
6. OpenAI usa tools para consultar GitHub
7. Generar respuesta final
8. Enviar respuesta al grupo por Wassenger

---

### Variables de entorno

```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

WASSENGER_TOKEN=
WASSENGER_DEVICE_ID=

GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
GITHUB_BRANCH=main

AUTHORIZED_GROUP_ID=
BOT_TRIGGER=@bot

PORT=3000
```

---

### Estructura del proyecto

```
/src
  index.js
  config.js

  /services
    openai.service.js
    github.service.js
    wassenger.service.js

  /tools
    repoTools.js

  /utils
    pathGuard.js
    text.js

package.json
README.md
.env.example
```

---

### Tools para OpenAI (function calling)

**1. listar_archivos(path)**
Lista archivos y carpetas dentro de una ruta permitida del repo.

**2. buscar_en_repo(query)**
Busca texto en archivos permitidos.
Solo dentro de: /clientes, /docs, /notas, /prompts, /recursos, /web

**3. leer_archivo(path)**
Lee el contenido de un archivo permitido.
Bloquea: .env, archivos con token/secret/key/password, node_modules, vendor, backups, binarios.

**4. agregar_nota(titulo, contenido)**
Crea un archivo Markdown nuevo en `/notas/bot/YYYY-MM-DD-slug-del-titulo.md`
Incluye: fecha, autor/remitente, título, contenido.
La ruta de escritura está hardcodeada. No acepta path custom.

---

### Comportamiento del bot

- Responde en español rioplatense, claro y directo.
- Si no encuentra info, lo dice explícitamente.
- Menciona las rutas consultadas al responder.
- Confirma creación de notas mostrando la ruta generada.
- Si le piden modificar código, rechaza y explica que en esta etapa solo puede leer y agregar notas.

---

### Ejemplos de uso

**Consulta:**
> @bot qué tenemos definido sobre el cliente X?

Bot busca en /clientes, /docs y /notas, lee archivos relevantes, responde con resumen y rutas fuente.

**Agregar nota:**
> @bot agregá nota: En la reunión se definió que el MVP tendrá panel de clientes.

Bot crea: `/notas/bot/2026-06-02-mvp-panel-clientes.md`

**Modificar código:**
> @bot revisá el código del sitio y corregilo

Bot responde: "Por ahora no tengo permiso para modificar código. Puedo leer archivos y ayudarte a detectar o documentar observaciones, pero no aplicar cambios."

---

### Implementación GitHub

Usar GitHub REST API.
- Lectura: listar contenido de directorios, leer contenido de archivos
- Escritura: crear archivo en /notas/bot/ con commit message: `docs(bot): agregar nota <titulo>`

---

### No implementar todavía

- Base de datos
- Login / panel web
- Embeddings / vector store
- Pull requests
- Modificación de código
- Ejecución de comandos
- Sincronización local del repo

---

### Primera entrega esperada

1. Proyecto Node + Express funcionando local
2. Endpoint /health
3. Endpoint /webhook/wassenger
4. Integración básica con OpenAI
5. Tools para leer/buscar/listar repo
6. Tool para agregar nota en /notas/bot/
7. Servicio para responder por Wassenger
8. README con setup local y deploy en Railway
9. .env.example

---

## Cómo retomar esta conversación

Abrí esta carpeta (`impulso-ia-bot`) en VSCode con Claude Code y decile:

> "Leé INSTRUCCIONES.md y arrancá a construir el proyecto completo desde cero."
