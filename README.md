# KOKOK Telegram Bot

This minimal Node.js bot responds to `/game` and sends a promotional image and message about the KOKOK games.

Prerequisites:
- Node.js 16+ installed
- A Telegram bot token from `@BotFather`

Quick start (PowerShell):

1. Install dependencies
```
npm install
```

2. Create `.env` based on `.env.example` and set your token and target chat id (optional). Example `.env`:
```
BOT_TOKEN=7666259492:AAHYLa8zjUqZy40U1dcQv9Lw_4ieP4myzZg
TARGET_CHAT_ID=-2292947821
```

3. Place the promotional image `bot.jpg` in the project root (already attached).

4. Run the bot
```
npm start
```

Now send `/game` to the bot or to the chat where the bot is present. It will reply with the image and message, and also post to `TARGET_CHAT_ID` if set.

## Deploy en Render

Recomendado: usar **Background Worker** para bots que usan polling.

Background Worker (recomendado):

1. En Render, crea un nuevo servicio de tipo **Background Worker**.
2. Conecta el repo y selecciona la rama `main`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Agrega las Environment Variables: `BOT_TOKEN`, `MONGODB_URI`, `MONGODB_DBNAME`, `TARGET_CHAT_ID`.

Web Service: si prefieres usar Web Service, la app ahora abre un puerto y expone `/health` para que Render detecte un puerto abierto.

1. En Render, crea un **Web Service**.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Asegúrate de agregar las mismas Environment Variables.
5. Verifica en los logs: `HTTP server listening on port <PORT>` y accede a `https://<tu-servicio>.onrender.com/health` que debería devolver `{ "status": "ok" }`.

Notas:
- `Background Worker` evita la necesidad de exponer un puerto público y suele ser la mejor opción para bots que usan polling.
- No subir `.env` al repo; configura las variables en el panel de Render.
