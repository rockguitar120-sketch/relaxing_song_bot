import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import fs from "fs";
import path from "path";

let bot = null;

function getBot() {
  if (!bot) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  }
  return bot;
}

// Telegram ကနေ MP3 ပို့ရင် သိမ်းပေးမယ့် Logic
export function setupTelegramListener() {
  const b = getBot();
  console.log("👂 Bot is listening for Music on Telegram...");

  b.on('audio', async (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) return;

    try {
      const fileId = msg.audio.file_id;
      const fileName = msg.audio.file_name || `Track_${Date.now()}.mp3`;
      const fileLink = await b.getFileLink(fileId);
      
      const dir = path.join(process.cwd(), "assets", "music");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const savePath = path.join(dir, fileName);
      const response = await axios({ url: fileLink, method: 'GET', responseType: 'stream' });
      response.data.pipe(fs.createWriteStream(savePath));

      await b.sendMessage(chatId, `✅ <b>Music Saved!</b>\nName: ${fileName}\nYouTube တင်တဲ့အခါ ဒီဖိုင်ကို ဦးစားပေးသုံးသွားပါမယ်။`, { parse_mode: "HTML" });
    } catch (err) {
      await b.sendMessage(chatId, `❌ Error downloading: ${err.message}`);
    }
  });
}

export async function sendNotification(message, isError = false) {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const prefix = isError ? "❌ ERROR\n" : "";
    await getBot().sendMessage(chatId, prefix + message, { parse_mode: "HTML" });
    console.log("📱 Telegram notification sent");
  } catch (err) {
    console.error("Telegram error:", err.message);
  }
}

export async function sendSuccess(details) {
  const { videoId, title, scheduledTime, playlistName, duration, tags, aiDisclosed } = details;
  const message = `
✅ <b>YouTube Upload Successful!</b>

🎵 <b>Title:</b> ${title}
🔗 <b>URL:</b> https://youtube.com/watch?v=${videoId}
📋 <b>Playlist:</b> ${playlistName}
⏰ <b>Scheduled for:</b> ${scheduledTime.toLocaleString()}
⏱️ <b>Process Time:</b> ${duration} minutes
🏷️ <b>Tags:</b> ${tags.slice(0, 5).join(", ")}...
🤖 <b>AI Disclosure:</b> ${aiDisclosed ? "Enabled ✅" : "Disabled ❌"}

<i>Your video is now in the YouTube queue and will be published automatically.</i>
`;
  await sendNotification(message);
}