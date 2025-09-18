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
