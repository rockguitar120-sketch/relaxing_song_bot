import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { createClient } from "pexels";
import fetch from "node-fetch";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const pexelsClient = PEXELS_API_KEY ? createClient(PEXELS_API_KEY) : null;

async function getRandomPexelsVideo(query) {
  if (!pexelsClient) {
    console.warn("Pexels API key not set. Using default video frame.");
    return null;
  }
  try {
    const response = await pexelsClient.videos.search({ query, per_page: 15 });
    if (response && response.videos && response.videos.length > 0) {
      const suitableVideos = response.videos.filter(video => video.duration >= 60 && video.width >= 1920 && video.height >= 1080);
      if (suitableVideos.length > 0) {
        const randomIndex = Math.floor(Math.random() * suitableVideos.length);
        const selectedVideo = suitableVideos[randomIndex];
        const videoFile = selectedVideo.video_files.find(file => file.quality === "hd" || file.quality === "sd");
        if (videoFile) {
          return { url: videoFile.link, duration: selectedVideo.duration };
        }
      }
    }
    console.warn(`No suitable Pexels video found for query: ${query}. Using default video frame.`);
    return null;
  } catch (error) {
    console.error("Error fetching Pexels video:", error.message);
    return null;
  }
}

async function downloadVideo(url, outputPath) {
  const response = await fetch(url);
  const fileStream = fs.createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
  return outputPath;
}

const VIDEO_CLIP_DURATION = 8; // seconds per short clip

export async function generateVideoFrame(outputPath, category = "sleeping") {
  console.log("🎨 Generating video frame...");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const pexelsQueryMap = {
    sleeping: "cinematic dark night nature forest moon aesthetic",
    meditation: "aesthetic zen meditation water ripples mountain mist",
    relaxing: "cinematic aesthetic nature landscape slow motion calm",
  };
  const pexelsQuery = pexelsQueryMap[category] || pexelsQueryMap.relaxing;

  const pexelsVideo = await getRandomPexelsVideo(pexelsQuery);

  if (pexelsVideo) {
    console.log(`Downloading Pexels video: ${pexelsVideo.url}`);
    const downloadedPath = path.join(path.dirname(outputPath), `pexels_${category}.mp4`);
    await downloadVideo(pexelsVideo.url, downloadedPath);
    console.log(`✅ Pexels video downloaded to ${downloadedPath}`);
    return downloadedPath; // Return the path to the downloaded video
  }

  // Fallback to static frame generation if no Pexels video is found or API key is missing
  console.log("🎨 Generating video frame...");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const themes = {
    sleeping: {
      bg: "0a0a2e",
      text: "Deep Sleep Music",
      sub: "Relax  \u2022  Sleep  \u2022  Heal",
      color: "8888ff",
    },
    meditation: {
      bg: "0a2e0a",
      text: "Meditation Music",
      sub: "Breathe  \u2022  Focus  \u2022  Peace",
      color: "88ff88",
    },
    relaxing: {
      bg: "1a0a2e",
      text: "Relaxing Music",
      sub: "Unwind  \u2022  Calm  \u2022  Restore",
      color: "aa88ff",
    },
  };

  const t = themes[category] || themes.sleeping;

  const videoCmd = `ffmpeg -y \
    -f lavfi -i "color=c=#${t.bg}:size=1920x1080:rate=24" \
    -vf "\
      drawtext=text='${t.text}':fontsize=80:fontcolor=#${t.color}:\
        x=(w-text_w)/2:y=(h-text_h)/2-60:\
        shadowcolor=black:shadowx=3:shadowy=3,\
      drawtext=text='${t.sub}':fontsize=36:\
        fontcolor=#${t.color}@0.7:x=(w-text_w)/2:y=(h-text_h)/2+60,\
      drawtext=text='👍 LIKE   🔔 SUBSCRIBE':fontsize=22:\
        fontcolor=white@0.9:x=w-text_w-30:y=30:\
        box=1:boxcolor=#00000099:boxborderw=12\
    " \
    -t ${VIDEO_CLIP_DURATION} \
    -pix_fmt yuv420p \
    "${outputPath}" 2>/dev/null`;

  execSync(videoCmd, { stdio: "pipe" });
  console.log(`✅ Video frame generated`);
  return outputPath;
}

export async function createLongVideo(videoPath, audioPath, outputPath, targetDuration = 3660) {
  console.log(`🎬 Creating ${Math.floor(targetDuration / 60)}-minute final video...`);

  let videoInputCmd;
  const isPexelsVideo = videoPath.includes("pexels_"); // Simple check if it's a downloaded Pexels video

  if (isPexelsVideo) {
    // Get actual duration of the Pexels video
    const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const pexelsVideoDuration = parseFloat(execSync(durationCmd).toString());

    // Loop Pexels video if it's shorter than targetDuration, otherwise trim
    const loopCount = Math.ceil(targetDuration / pexelsVideoDuration);
    videoInputCmd = `-stream_loop ${loopCount} -i "${videoPath}"`;
  } else {
    // Original logic for static frame
    const loopCount = Math.ceil(targetDuration / VIDEO_CLIP_DURATION) + 20;
    videoInputCmd = `-stream_loop ${loopCount} -i "${videoPath}"`;
  }

  const ffmpegCmd = `ffmpeg -y \
    ${videoInputCmd} \
    -i "${audioPath}" \
    -map 0:v \
    -map 1:a \
    -t ${targetDuration} \
    -c:v libx264 -preset ultrafast -crf 28 \
    -c:a aac -b:a 128k \
    -pix_fmt yuv420p \
    "${outputPath}" 2>/dev/null`;

  console.log("⏳ Processing... (5-15 minutes)");
  execSync(ffmpegCmd, { stdio: "pipe", timeout: 1800000 });
  console.log(`✅ Final video created: ${outputPath}`);

  // ✅ Verify both streams exist after creation
  const checkCmd = `ffprobe -v quiet -show_streams "${outputPath}" 2>/dev/null | grep codec_type`;
  const result = execSync(checkCmd).toString();
  if (!result.includes("audio")) {
    throw new Error("CRITICAL: Output video has no audio stream!");
  }
  if (!result.includes("video")) {
    throw new Error("CRITICAL: Output video has no video stream!");
  }
  console.log("✅ Verified: Audio + Video streams both present");

  return outputPath;
}