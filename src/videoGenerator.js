import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const VIDEO_CLIP_DURATION = 8; // seconds per short clip

export async function generateVideoFrame(outputPath, category = "sleeping") {
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

  // ✅ FIX: Loop count based on actual clip duration (8 sec)
  const loopCount = Math.ceil(targetDuration / VIDEO_CLIP_DURATION) + 20;

  // ✅ FIX: Removed -shortest flag — use -t instead to avoid audio cutoff
  const ffmpegCmd = `ffmpeg -y \
    -stream_loop ${loopCount} -i "${videoPath}" \
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