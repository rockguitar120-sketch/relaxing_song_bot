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

// --- Telegram Listener ကို စတင်နှိုးခြင်း ---
// ဒါမှ GitHub Action run နေတုန်း Telegram ကနေ လှမ်းပို့ရင် လက်ခံနိုင်မှာပါ
setupTelegramListener();

async function getScheduledTime() {
  const now = new Date();
  const scheduled = new Date();
  scheduled.setUTCHours(23, 0, 0, 0); // 7 PM EST
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled;
}

async function main() {
  console.log("🚀 YouTube Auto-Upload Bot Starting...");
  console.log(`📅 ${new Date().toISOString()}`);

  const required = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET",
    "YOUTUBE_REFRESH_TOKEN", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  const videoCount = parseInt(process.env.VIDEO_COUNT || "0");
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  try {
    // --- STEP 1: GENERATE AUDIO FROM ASSETS ---
    // assets/music ထဲက ဖိုင်ကိုယူမယ်၊ ဖိုင်နာမည်ကိုပါ သိမ်းခဲ့မယ်
    const shortAudioPath = path.join(TEMP_DIR, "short_audio.wav");
    const audioData = await generateAudio(shortAudioPath); 
    
    // --- STEP 2: METADATA PREPARATION ---
    // audioData.trackTitle (ဖိုင်နာမည်) ကို Title မှာ ထည့်သုံးမယ်
    const metadata = generateMetadata(videoCount);
    metadata.title = `${audioData.trackTitle} | Deep Relaxing Piano & Strings`;
    
    console.log(`\n📋 Processing Track: ${audioData.trackTitle}`);
    console.log(`📝 YouTube Title: ${metadata.title}`);

    await sendNotification(`🎬 Starting video generation...\n🎵 <b>${metadata.title}</b>`);

    // --- STEP 3: LOOP AUDIO ---
    const longAudioPath = path.join(TEMP_DIR, "long_audio.mp3");
    await loopAudio(audioData.path, longAudioPath, VIDEO_DURATION);

    // --- STEP 4: GENERATE VIDEO FRAME ---
    // metadata ထဲက category ကိုယူသုံးမယ်
    await generateVideoFrame(path.join(TEMP_DIR, "short_video.mp4"), metadata.videoCategory);

    // --- STEP 5: CREATE FULL VIDEO ---
    const finalVideoPath = path.join(TEMP_DIR, "final_video.mp4");
    await createLongVideo(path.join(TEMP_DIR, "short_video.mp4"), longAudioPath, finalVideoPath, VIDEO_DURATION);

    // --- STEP 6: UPLOAD & PLAYLIST ---
    const scheduledTime = await getScheduledTime();
    const { videoId } = await uploadToYouTube(finalVideoPath, metadata, scheduledTime);

    const auth = await getAuthClient();
    const playlistManager = new PlaylistManager(auth);
    const playlistId = await playlistManager.getOrCreatePlaylist(metadata.playlistName);
    await playlistManager.addToPlaylist(playlistId, videoId);

    // --- STEP 7: CLEANUP ORIGINAL FILE & NOTIFY ---
    // တင်ပြီးသွားပြီဖြစ်လို့ assets ထဲက မူရင်း MP3 ကို ဖျက်မယ်
    if (fs.existsSync(audioData.originalFile)) {
        fs.unlinkSync(audioData.originalFile);
        console.log(`🗑️ Deleted source file: ${audioData.originalFile}`);
    }

    await sendSuccess(videoId, metadata.title, scheduledTime, metadata.playlistName);

    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    console.log(`\n🎉 Process Complete! File deleted and Video scheduled.`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    await sendNotification(`❌ <b>Upload Failed!</b>\n\nError: ${error.message}`, true);
    process.exit(1);
  }
}

main();