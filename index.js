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

// Telegram Listener ကို စတင်နှိုးခြင်း
setupTelegramListener();

async function getScheduledTime() {
  const now = new Date();
  const scheduled = new Date();
  const currentHour = now.getUTCHours();

  if (currentHour < 12) {
    scheduled.setUTCHours(12, 0, 0, 0); // ပထမအသုတ်
  } else {
    scheduled.setUTCHours(23, 0, 0, 0); // ဒုတိယအသုတ်
  }

  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled;
}

async function main() {
  console.log("🚀 YouTube Auto-Upload Bot Starting...");
  const videoCount = parseInt(process.env.VIDEO_COUNT || "0");
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  let currentAudioData = null;

  try {
    const shortAudioPath = path.join(TEMP_DIR, "short_audio.wav");
    currentAudioData = await generateAudio(shortAudioPath); 
    
    const metadata = await generateMetadata(videoCount, currentAudioData.trackTitle);
    
    await sendNotification(`🎬 Starting video generation...\n🎵 <b>${metadata.title}</b>`);

    const longAudioPath = path.join(TEMP_DIR, "long_audio.mp3");
    await loopAudio(currentAudioData.path, longAudioPath, VIDEO_DURATION);

    const videoFramePath = await generateVideoFrame(path.join(TEMP_DIR, "short_video.mp4"), metadata.videoCategory);
    const finalVideoPath = path.join(TEMP_DIR, "final_video.mp4");
    await createLongVideo(videoFramePath, longAudioPath, finalVideoPath, VIDEO_DURATION);

    const scheduledTime = await getScheduledTime();
    const { videoId } = await uploadToYouTube(finalVideoPath, metadata, scheduledTime);

    const auth = await getAuthClient();
    const playlistManager = new PlaylistManager(auth);
    const playlistId = await playlistManager.getOrCreatePlaylist(metadata.playlistName);
    await playlistManager.addToPlaylist(playlistId, videoId);

    // --- CLEANUP & AUTO-DELETE SECTION ---
    console.log("🛠️ Attempting to delete source file...");
    const sourceFile = path.resolve(currentAudioData.originalFile);

    await sendSuccess(videoId, metadata.title, scheduledTime, metadata.playlistName);

    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    if (fs.existsSync(sourceFile)) {
        // File Lock ကင်းအောင် ၃ စက္ကန့်စောင့်ပြီးမှ ဖျက်မယ်
        await new Promise(resolve => setTimeout(resolve, 3000));
        fs.unlinkSync(sourceFile);
        console.log(`🗑️ Source file deleted: ${sourceFile}`);
    }

    console.log(`\n🎉 Process Complete! System exiting...`);
    process.exit(0); 

  } catch (error) {
    console.error("❌ Error:", error.message);
    await sendNotification(`❌ <b>Upload Failed!</b>\nError: ${error.message}`, true);
    process.exit(1);
  }
}

main();