# Resumen de desarrollo - impulso-ia-bot

## Visión general

Este proyecto es un bot de WhatsApp grupal diseñado para reaccionar a menciones reales en grupos, consultar un repositorio privado de GitHub y responder usando Wassenger.

El flujo principal actual cubre:
- Recepción de webhooks de Wassenger
- Detección de menciones reales (@menciones) en grupos de WhatsApp
- Verificación de grupo autorizado
- Consulta de contenido en un repo privado de GitHub
- Envío de respuestas al grupo usando Wassenger
- Inclusión del device ID correcto en el payload de envío

## Integraciones implementadas

- Wassenger
  - Endpoint de envío: `https://api.wassenger.com/v1/messages`
  - Header `Token` para autenticación
  - Payload con `chat`, `message` y `device`
  - Validación de group ID y mensaje de grupo
- GitHub
  - Autenticación con `GITHUB_TOKEN`
  - Lectura y escritura de archivos en el repo privado configurado
- OpenAI
  - Uso de `OPENAI_API_KEY`
  - Modelo por defecto: `gpt-4o`
  - Generación de respuestas y herramientas para consultar el repo

## Estructura actual del proyecto

- `src/index.js`
  - Servidor Express
  - Webhook `POST /webhook/wassenger`
  - Ruta `GET /health`
- `src/config.js`
  - Carga de variables de entorno
- `src/handlers/messageHandler.js`
  - Manejo de payload Wassenger
  - Extracción de texto, remitente y grupo
  - Detección de menciones reales y triggers
  - Respuestas a comandos de nota y consultas generales
- `src/services/wassenger.service.js`
  - Envío de mensajes al grupo por Wassenger
  - Inclusión de `device` cuando está configurado
- `src/services/openai.service.js`
  - Lógica de llamadas a OpenAI y loop con herramientas
- `src/tools/repoTools.js`
  - Listar, buscar, leer y crear notas en GitHub

## Variables de entorno clave

```env
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

## Histórico de commits recientes

- `3fc72b3` - fix: include Wassenger device id in message payload
- `4a39d78` - fix: send group message with Wassenger chat/message payload
- `fe824f8` - fix: use Wassenger /v1/messages endpoint with Token header
- `7e43e13` - fix: support Wassenger payload.data chat id and group authorization
- `590bc3c` - fix: normalize group ID for WhatsApp mention authorization
- `563486d` - add: Procfile for Railway deployment
- `9751f0b` - feat: detect real mentions in WhatsApp messages
- `310acdb` - docs(bot): agregar nota agregá nota
- `e74aaaf` - Initial commit

## Pasos realizados hasta el momento

1. Configuración inicial del repositorio y dependencias Node.js
2. Creación de router Express y webhook Wassenger
3. Implementación de detección de triggers y menciones reales en grupos
4. Validación del grupo autorizado con `AUTHORIZED_GROUP_ID`
5. Desarrollo de la capa de servicios Wassenger y mensaje directo al grupo
6. Corrección de payload Wassenger para usar `chat` + `message`
7. Ajuste final para incluir `device` en la petición cuando se define `WASSENGER_DEVICE_ID`
8. Prueba exitosa de envío directo al grupo con `201 queued`

## Estado actual

- El bot ya puede enviar mensajes directos al grupo autorizado usando Wassenger
- La integración del device id está funcionando
- El cambio fue commiteado y pusheado a `origin/main`

## Próximos pasos sugeridos

- Probar el webhook en producción / Railway con un mensaje real de grupo
- Ajustar la lógica de detección de texto si el payload Wassenger cambia
- Añadir logs más precisos para `mentions` y payload recibidos
- Agregar un archivo de ejemplo `.env.example`
- Añadir pruebas unitarias para `messageHandler` y `wassenger.service`
