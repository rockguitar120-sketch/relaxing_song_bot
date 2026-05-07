import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Generate gradient video frame with text using ffmpeg
export async function generateVideoFrame(outputPath, category = "sleeping") {
  console.log("🎨 Generating video frame...");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const themes = {
    sleeping: {
      colors: ["0a0a2e", "1a1a4e", "0d0d3b"],
      text: "Deep Sleep Music",
      emoji: "🌙",
      textColor: "8888ff",
      accentColor: "6666cc",
    },
    meditation: {
      colors: ["0a2e0a", "1a4e2e", "0d3b1a"],
      text: "Meditation Music",
      emoji: "🧘",
      textColor: "88ff88",
      accentColor: "66cc88",
    },
    relaxing: {
      colors: ["1a0a2e", "2e1a4e", "1a0d3b"],
      text: "Relaxing Music",
      emoji: "🌿",
      textColor: "aa88ff",
      accentColor: "8866cc",
    },
  };

  const theme = themes[category] || themes.sleeping;

  // Create gradient background with animated text using ffmpeg drawtext
  const videoCmd = `ffmpeg -y \
    -f lavfi -i "color=c=#${theme.colors[0]}:size=1920x1080:rate=24" \
    -vf "\
      drawbox=x=0:y=0:w=1920:h=1080:color=#${theme.colors[1]}@0.5:t=fill,\
      drawtext=text='${theme.text}':fontsize=80:fontcolor=#${theme.textColor}:x=(w-text_w)/2:y=(h-text_h)/2-60:font=Sans:shadowcolor=black:shadowx=3:shadowy=3,\
      drawtext=text='Relax • Sleep • Heal':fontsize=36:fontcolor=#${theme.textColor}@0.7:x=(w-text_w)/2:y=(h-text_h)/2+60:font=Sans,\
      drawtext=text='${theme.emoji}':fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2-200,\
      drawtext=text='👍 LIKE  🔔 SUBSCRIBE':fontsize=22:fontcolor=white@0.9:x=w-text_w-30:y=30:font=Sans:box=1:boxcolor=#00000088:boxborderw=10\
    " \
    -t 8 \
    -pix_fmt yuv420p \
    "${outputPath}" 2>/dev/null`;

  execSync(videoCmd, { stdio: "pipe" });
  console.log(`✅ Video frame generated`);
  return outputPath;
}

// Loop video to 1 hour+
export async function createLongVideo(videoPath, audioPath, outputPath, targetDuration = 3660) {
  console.log(`🎬 Creating ${Math.floor(targetDuration / 60)}-minute final video...`);

  const loopCount = Math.ceil(targetDuration / 8) + 10;

  const ffmpegCmd = `ffmpeg -y \
    -stream_loop ${loopCount} -i "${videoPath}" \
    -i "${audioPath}" \
    -map 0:v -map 1:a \
    -t ${targetDuration} \
    -c:v libx264 -preset ultrafast -crf 28 \
    -c:a aac -b:a 128k \
    -shortest \
    -pix_fmt yuv420p \
    "${outputPath}" 2>/dev/null`;

  console.log("⏳ This may take 5-15 minutes...");
  execSync(ffmpegCmd, { stdio: "pipe", timeout: 1800000 }); // 30 min timeout
  console.log(`✅ Final video created: ${outputPath}`);
  return outputPath;
}