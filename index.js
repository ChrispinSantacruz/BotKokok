require('dotenv').config();
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.BOT_TOKEN;
const TARGET_CHAT_ID = process.env.TARGET_CHAT_ID;

if (!TOKEN) {
  console.error('Error: BOT_TOKEN is not set in environment.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DBNAME = process.env.MONGODB_DBNAME || 'botdb';

const imagePath = path.join(__dirname, 'bot.jpg');

let mongoClient;
let mongoDb;
let httpServer;

async function connectToMongo() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set, skipping MongoDB connection.');
    return;
  }

  try {
  mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DBNAME);
    console.log('Connected to MongoDB:', MONGODB_DBNAME);

    // Ensure heartbeat document exists
    const col = mongoDb.collection('bot_meta');
    await col.updateOne(
      { _id: 'bot_heartbeat' },
      { $set: { startedAt: new Date(), lastSeen: new Date(), bot: 'BotKokok' } },
      { upsert: true }
    );
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    // keep running even if Mongo connection fails
  }
}

async function updateHeartbeat() {
  if (!mongoDb) return;
  try {
    const col = mongoDb.collection('bot_meta');
    await col.updateOne(
      { _id: 'bot_heartbeat' },
      { $set: { lastSeen: new Date() }, $inc: { ticks: 1 } },
      { upsert: true }
    );
    console.log('Heartbeat updated at', new Date().toISOString());
  } catch (err) {
    console.error('Heartbeat update failed:', err);
  }
}

async function closeMongo() {
  try {
    if (mongoClient) {
      await mongoClient.close();
      console.log('MongoDB connection closed.');
    }
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
}

const messageText = `🪳 Welcome to KOKOK THE ROACH! 🪳

🎮 Game 1: https://www.kokoktheroach.fun/
You're a cockroach shooting stacks of cash to defeat outrageous bosses like Trump and Elon.

✨ Features:
• Personalized login with your name
• Unique bosses: Trump (bombs) & Elon (rockets)
• Special power-ups: shield & sugar
• Share your score anytime
• Optimized controls for mobile & PC

🚀 Game 2: https://www.kokokspace.fun/
Take your roach adventure to the next level — travel through the city and outer space, dodge unique obstacles, and climb the ranks!

✨ Features:
• Unique obstacles in different environments
• Travel across the city and space
• Real-time leaderboards
• Optimized controls for mobile & PC

🎯 Click to start the chaos and prove you're the ultimate roach champion!`;

// Match /game and /game@BotUsername (case-insensitive)
bot.onText(/\/game(@\w+)?(?:\s|$)/i, async (msg) => {
  const chatId = msg.chat.id;
  try {
    console.log('Received /game from', chatId, 'user:', msg.from && msg.from.username);

    const CAPTION_LIMIT = 1024; // Telegram limit for photo captions

    if (fs.existsSync(imagePath)) {
      // If messageText fits within caption limit, send as single message
      if (messageText.length <= CAPTION_LIMIT) {
        await bot.sendPhoto(chatId, imagePath, { caption: messageText }).catch((e) => console.error('sendPhoto error:', e));
      } else {
        // send first chunk as caption, remainder as follow-up message
        const first = messageText.slice(0, CAPTION_LIMIT);
        const rest = messageText.slice(CAPTION_LIMIT);
        await bot.sendPhoto(chatId, imagePath, { caption: first }).catch((e) => console.error('sendPhoto error:', e));
        await bot.sendMessage(chatId, rest).catch((e) => console.error('sendMessage error for rest:', e));
      }
    } else {
      // fallback: no image, send text only
      await bot.sendMessage(chatId, messageText).catch((e) => console.error('sendMessage error:', e));
    }

    // Also post to TARGET_CHAT_ID if specified (apply same caption logic)
    if (TARGET_CHAT_ID) {
      try {
        if (fs.existsSync(imagePath)) {
          if (messageText.length <= CAPTION_LIMIT) {
            await bot.sendPhoto(TARGET_CHAT_ID, imagePath, { caption: messageText });
          } else {
            const first = messageText.slice(0, CAPTION_LIMIT);
            const rest = messageText.slice(CAPTION_LIMIT);
            await bot.sendPhoto(TARGET_CHAT_ID, imagePath, { caption: first });
            await bot.sendMessage(TARGET_CHAT_ID, rest);
          }
        } else {
          await bot.sendMessage(TARGET_CHAT_ID, messageText);
        }
      } catch (e) {
        console.error('Error posting to TARGET_CHAT_ID:', e);
      }
    }
  } catch (err) {
    console.error('Failed to handle /game:', err);
  }
});

bot.on('polling_error', (err) => {
  console.error('Polling error', err);
});

console.log('Bot started. Listening for /game commands...');

// Start Mongo connection and heartbeat
(async () => {
  await connectToMongo();

  // update heartbeat immediately then every 5 minutes
  await updateHeartbeat();
  const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const heartbeatTimer = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);

  // Minimal HTTP server so Render sees an open port
  const PORT = process.env.PORT || 3000;
  const http = require('http');
  httpServer = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('BotKokok running');
    }
  });

  httpServer.listen(PORT, () => {
    console.log('HTTP server listening on port', PORT);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log('Received', signal, 'shutting down...');
    clearInterval(heartbeatTimer);
    if (httpServer) {
      try {
        await new Promise((resolve, reject) => httpServer.close((err) => (err ? reject(err) : resolve())));
        console.log('HTTP server closed.');
      } catch (err) {
        console.error('Error closing HTTP server:', err);
      }
    }
    await closeMongo();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
