import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { generateAudio, loopAudio } from "./src/audioGenerator.js";
import { generateVideoFrame, createLongVideo } from "./src/videoGenerator.js";
import { uploadToYouTube, getAuthClient } from "./src/youtubeUploader.js";
import { generateMetadata } from "./src/metadataGenerator.js";
import { PlaylistManager } from "./src/playlistManager.js";
import { sendSuccess, sendNotification } from "./src/telegramBot.js";

dotenv.config();

const TEMP_DIR = "./temp";
const VIDEO_DURATION = 3660; // 61 minutes

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
    // --- STEP 1: GENERATE AUDIO & GET RANDOM CATEGORY ---
    // audioGenerator ထဲမှာ random category ရွေးပြီး audio ဒေါင်းမယ်
    const shortAudioPath = path.join(TEMP_DIR, "short_audio.wav");
    const audioData = await generateAudio(shortAudioPath); 
    const selectedCategory = audioData.category; // 'relaxing', 'sleeping' or 'meditation'

    // --- STEP 2: GENERATE METADATA BASED ON CATEGORY ---
    // ရလာတဲ့ category နဲ့ လိုက်ဖက်တဲ့ Title/Tags တွေကို generate လုပ်မယ်
    const metadata = generateMetadata(videoCount, selectedCategory);
    console.log(`\n📋 Category: ${selectedCategory}`);
    console.log(`📝 Title: ${metadata.title}`);

    await sendNotification(`🎬 Starting video generation...\n📋 <b>${metadata.title}</b>`);

    // --- STEP 3: LOOP AUDIO ---
    const longAudioPath = path.join(TEMP_DIR, "long_audio.mp3");
    await loopAudio(shortAudioPath, longAudioPath, VIDEO_DURATION);

    // --- STEP 4: GENERATE VIDEO FRAME ---
    const shortVideoPath = path.join(TEMP_DIR, "short_video.mp4");
    await generateVideoFrame(shortVideoPath, selectedCategory);

    // --- STEP 5: CREATE FULL VIDEO ---
    const finalVideoPath = path.join(TEMP_DIR, "final_video.mp4");
    await createLongVideo(shortVideoPath, longAudioPath, finalVideoPath, VIDEO_DURATION);

    // --- STEP 6: UPLOAD & PLAYLIST ---
    const scheduledTime = await getScheduledTime();
    const { videoId, videoUrl } = await uploadToYouTube(finalVideoPath, metadata, scheduledTime);

    const auth = await getAuthClient();
    const playlistManager = new PlaylistManager(auth);
    const playlistId = await playlistManager.getOrCreatePlaylist(metadata.playlistName);
    await playlistManager.addToPlaylist(playlistId, videoId);

    // --- STEP 7: NOTIFY ---
    await sendSuccess(videoId, metadata.title, scheduledTime, metadata.playlistName);

    // Cleanup
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    console.log(`\n🎉 All done! Video [${selectedCategory}] scheduled for 7 PM ET`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    await sendNotification(`❌ <b>Upload Failed!</b>\n\nError: ${error.message}\n\nStack: ${error.stack?.slice(0, 500)}`, true);
    process.exit(1);
  }
}

main();