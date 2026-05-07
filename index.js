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
  // US Eastern 7 PM = UTC 23:00 (winter) or 00:00 next day (summer)
  const now = new Date();
  const scheduled = new Date();

  // Set to today's 7 PM ET (UTC-5 in winter, UTC-4 in summer)
  // GitHub Action runs ~8 hours early, so schedule for same day 7PM ET
  scheduled.setUTCHours(23, 0, 0, 0); // 7 PM EST

  // If that time has already passed today, schedule for tomorrow
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled;
}

async function main() {
  console.log("🚀 YouTube Auto-Upload Bot Starting...");
  console.log(`📅 ${new Date().toISOString()}`);

  // Validate environment variables
  const required = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET",
    "YOUTUBE_REFRESH_TOKEN", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  // Track video count for metadata rotation
  const videoCount = parseInt(process.env.VIDEO_COUNT || "0");

  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const metadata = generateMetadata(videoCount);
  console.log(`\n📋 Category: ${metadata.videoCategory}`);
  console.log(`📝 Title: ${metadata.title}`);

  await sendNotification(`🎬 Starting video generation...\n📋 <b>${metadata.title}</b>`);

  try {
    // Step 1: Generate short audio (8 sec base)
    const shortAudioPath = path.join(TEMP_DIR, "short_audio.wav");
    await generateAudio(shortAudioPath, 10);

    // Step 2: Loop audio to 61+ minutes
    const longAudioPath = path.join(TEMP_DIR, "long_audio.mp3");
    await loopAudio(shortAudioPath, longAudioPath, VIDEO_DURATION);

    // Step 3: Generate video frame (8 sec)
    const shortVideoPath = path.join(TEMP_DIR, "short_video.mp4");
    await generateVideoFrame(shortVideoPath, metadata.videoCategory);

    // Step 4: Create full-length video
    const finalVideoPath = path.join(TEMP_DIR, "final_video.mp4");
    await createLongVideo(shortVideoPath, longAudioPath, finalVideoPath, VIDEO_DURATION);

    // Step 5: Get scheduled publish time (7 PM US ET)
    const scheduledTime = await getScheduledTime();

    // Step 6: Upload to YouTube
    const { videoId, videoUrl } = await uploadToYouTube(finalVideoPath, metadata, scheduledTime);

    // Step 7: Add to playlist
    const auth = await getAuthClient();
    const playlistManager = new PlaylistManager(auth);
    const playlistId = await playlistManager.getOrCreatePlaylist(metadata.playlistName);
    await playlistManager.addToPlaylist(playlistId, videoId);

    // Step 8: Send success notification
    await sendSuccess(videoId, metadata.title, scheduledTime, metadata.playlistName);

    // Cleanup temp files to save space
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    console.log("\n🎉 All done! Video scheduled for 7 PM ET");

  } catch (error) {
    console.error("❌ Error:", error.message);
    await sendNotification(`❌ <b>Upload Failed!</b>\n\nError: ${error.message}\n\nStack: ${error.stack?.slice(0, 500)}`, true);
    process.exit(1);
  }
}

main();