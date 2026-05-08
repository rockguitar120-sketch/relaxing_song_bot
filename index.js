import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { generateAudio, loopAudio } from "./src/audioGenerator.js";
import { generateVideoFrame, createLongVideo } from "./src/videoGenerator.js";
import { uploadToYouTube, getAuthClient } from "./src/youtubeUploader.js";
import { generateMetadata } from "./src/metadataGenerator.js";
import { PlaylistManager } from "./src/playlistManager.js";
import { sendSuccess, sendNotification, setupTelegramListener } from "./src/telegramBot.js";

dotenv.config();

const TEMP_DIR = "./temp";
const VIDEO_DURATION = 3660; // 61 minutes

setupTelegramListener();

// YouTube မှာ တကယ် Video ပေါ်မယ့်အချိန်ကို တွက်ချက်ခြင်း
async function getScheduledTime() {
  const now = new Date();
  const scheduled = new Date();
  
  const currentHourUTC = now.getUTCHours();

  // မနက်ပိုင်း Run တဲ့အခါ (UTC 3:00 ဝန်းကျင်) -> ညနေ ၇ နာရီ ET (UTC 23:00) အတွက် Schedule လုပ်မယ်
  if (currentHourUTC < 12) {
    scheduled.setUTCHours(23, 0, 0, 0); 
  } 
  // ညပိုင်း Run တဲ့အခါ (UTC 15:00 ဝန်းကျင်) -> နောက်တစ်နေ့ မနက် ၇ နာရီ ET (UTC 11:00) အတွက် Schedule လုပ်မယ်
  else {
    scheduled.setUTCHours(11, 0, 0, 0); 
    if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled;
}

async function main() {
  console.log("🚀 YouTube Auto-Upload Bot Starting (Twice Daily Mode)...");
  console.log(`📅 ${new Date().toISOString()}`);

  const required = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET",
    "YOUTUBE_REFRESH_TOKEN", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);

  const videoCount = parseInt(process.env.VIDEO_COUNT || "0");
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  let currentAudioData = null;

  try {
    // STEP 1: Assets ထဲက အပေါ်ဆုံး သီချင်းဖိုင်ကို ယူမယ်
    const shortAudioPath = path.join(TEMP_DIR, "short_audio.wav");
    currentAudioData = await generateAudio(shortAudioPath); 
    
    // STEP 2: ဖိုင်နာမည်ကို အခြေခံပြီး Title ပေးမယ်
    const metadata = generateMetadata(videoCount);
    metadata.title = `${currentAudioData.trackTitle} | Deep Relaxing Piano & Strings`;
    
    console.log(`\n📋 Track: ${currentAudioData.trackTitle}`);
    await sendNotification(`🎬 Starting video generation...\n🎵 <b>${metadata.title}</b>`);

    // STEP 3: Loop Audio (Full Track)
    const longAudioPath = path.join(TEMP_DIR, "long_audio.mp3");
    await loopAudio(currentAudioData.path, longAudioPath, VIDEO_DURATION);

    // STEP 4 & 5: Video Creating
    const shortVideoPath = path.join(TEMP_DIR, "short_video.mp4");
    await generateVideoFrame(shortVideoPath, metadata.videoCategory);
    const finalVideoPath = path.join(TEMP_DIR, "final_video.mp4");
    await createLongVideo(shortVideoPath, longAudioPath, finalVideoPath, VIDEO_DURATION);

    // STEP 6: Upload to YouTube
    const scheduledTime = await getScheduledTime();
    const { videoId } = await uploadToYouTube(finalVideoPath, metadata, scheduledTime);

    const auth = await getAuthClient();
    const playlistManager = new PlaylistManager(auth);
    const playlistId = await playlistManager.getOrCreatePlaylist(metadata.playlistName);
    await playlistManager.addToPlaylist(playlistId, videoId);

    // STEP 7: AUTO-DELETE Source Music (သေချာဖျက်ရန်)
    const sourceFile = path.resolve(currentAudioData.originalFile);
    if (fs.existsSync(sourceFile)) {
        fs.unlinkSync(sourceFile);
        console.log(`🗑️ Deleted: ${sourceFile}`);
    }

    await sendSuccess(videoId, metadata.title, scheduledTime, metadata.playlistName);

    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    console.log(`\n🎉 Success! Next run will use the next song in assets.`);
    
    // Force exit to stop GitHub Action
    setTimeout(() => { process.exit(0); }, 5000);

  } catch (error) {
    console.error("❌ Error:", error.message);
    await sendNotification(`❌ <b>Upload Failed!</b>\n\nError: ${error.message}`, true);
    setTimeout(() => { process.exit(1); }, 5000);
  }
}

main();