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

// --- ၁။ Telegram Listener ကို စတင်နှိုးခြင်း ---
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
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  let currentAudioData = null; // Cleanup အတွက် အပြင်မှာ ကြေညာထားမယ်

  try {
    // --- STEP 1: GENERATE AUDIO FROM ASSETS ---
    const shortAudioPath = path.join(TEMP_DIR, "short_audio.wav");
    currentAudioData = await generateAudio(shortAudioPath); 
    
    // --- STEP 2: METADATA PREPARATION ---
    const metadata = generateMetadata(videoCount);
    // ဖိုင်နာမည်ကို Title အဖြစ် သုံးခြင်း
    metadata.title = `${currentAudioData.trackTitle} | Deep Relaxing Piano & Strings`;
    
    console.log(`\n📋 Processing Track: ${currentAudioData.trackTitle}`);
    await sendNotification(`🎬 Starting video generation...\n🎵 <b>${metadata.title}</b>`);

    // --- STEP 3: LOOP AUDIO (သီချင်းတစ်ပုဒ်လုံးကို Loop ပတ်ခြင်း) ---
    const longAudioPath = path.join(TEMP_DIR, "long_audio.mp3");
    await loopAudio(currentAudioData.path, longAudioPath, VIDEO_DURATION);

    // --- STEP 4: GENERATE VIDEO FRAME ---
    const shortVideoPath = path.join(TEMP_DIR, "short_video.mp4");
    await generateVideoFrame(shortVideoPath, metadata.videoCategory);

    // --- STEP 5: CREATE FULL VIDEO ---
    const finalVideoPath = path.join(TEMP_DIR, "final_video.mp4");
    await createLongVideo(shortVideoPath, longAudioPath, finalVideoPath, VIDEO_DURATION);

    // --- STEP 6: UPLOAD & PLAYLIST ---
    const scheduledTime = await getScheduledTime();
    const { videoId } = await uploadToYouTube(finalVideoPath, metadata, scheduledTime);

    const auth = await getAuthClient();
    const playlistManager = new PlaylistManager(auth);
    const playlistId = await playlistManager.getOrCreatePlaylist(metadata.playlistName);
    await playlistManager.addToPlaylist(playlistId, videoId);

    // --- STEP 7: CLEANUP & AUTO-DELETE ---
    // ဗီဒီယိုတင်လို့ အောင်မြင်မှ Assets ထဲက မူရင်းဖိုင်ကို ဖျက်မယ်
    const sourceFile = path.resolve(currentAudioData.originalFile);
    if (fs.existsSync(sourceFile)) {
        fs.unlinkSync(sourceFile);
        console.log(`🗑️ Successfully deleted source: ${sourceFile}`);
    }

    await sendSuccess(videoId, metadata.title, scheduledTime, metadata.playlistName);

    // Temporary ဖိုင်များ ဖျက်ခြင်း
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    console.log(`\n🎉 Process Complete! Bot will exit in 5 seconds...`);
    
    // 🔥 GitHub Actions ရပ်သွားအောင် ပရိုဂရမ်ကို အတင်းပိတ်ချခြင်း
    setTimeout(() => {
        process.exit(0);
    }, 5000);

  } catch (error) {
    console.error("❌ Error:", error.message);
    await sendNotification(`❌ <b>Upload Failed!</b>\n\nError: ${error.message}`, true);
    
    // Error တက်ရင်လည်း ပိတ်မယ်
    setTimeout(() => {
        process.exit(1);
    }, 5000);
  }
}

main();