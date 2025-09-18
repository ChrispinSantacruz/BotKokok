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

const imagePath = path.join(__dirname, 'bot.jpg');

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
