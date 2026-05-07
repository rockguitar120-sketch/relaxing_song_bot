import TelegramBot from "node-telegram-bot-api";

let bot = null;

function getBot() {
  if (!bot) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return bot;
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

export async function sendSuccess(videoId, title, scheduledTime, playlistName) {
  const message = `
✅ <b>Video Uploaded Successfully!</b>

🎵 <b>Title:</b> ${title}
🔗 <b>URL:</b> https://youtube.com/watch?v=${videoId}
📋 <b>Playlist:</b> ${playlistName}
⏰ <b>Publish:</b> ${scheduledTime.toLocaleString("en-US", { timeZone: "America/New_York" })} ET
🇺🇸 <b>Target:</b> US Audience 7 PM ET

<i>Video will go live automatically!</i>
`;
  await sendNotification(message);
}