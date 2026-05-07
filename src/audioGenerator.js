import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Generate ambient audio using ffmpeg (completely free)
export async function generateAudio(outputPath, durationSeconds = 10) {
  console.log("🎵 Generating ambient audio...");

  // Ensure temp directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Generate multi-layered ambient sound using ffmpeg sine waves
  // Creates a soothing, professional-sounding ambient track
  const ffmpegCmd = `ffmpeg -y \
    -f lavfi -i "sine=frequency=174:sample_rate=44100" \
    -f lavfi -i "sine=frequency=285:sample_rate=44100" \
    -f lavfi -i "sine=frequency=396:sample_rate=44100" \
    -f lavfi -i "sine=frequency=432:sample_rate=44100" \
    -f lavfi -i "sine=frequency=528:sample_rate=44100" \
    -filter_complex "\
      [0]volume=0.15,afade=t=in:st=0:d=3,afade=t=out:st=${durationSeconds - 3}:d=3[s1];\
      [1]volume=0.12,afade=t=in:st=1:d=3,afade=t=out:st=${durationSeconds - 3}:d=3[s2];\
      [2]volume=0.10,afade=t=in:st=2:d=3,afade=t=out:st=${durationSeconds - 3}:d=3[s3];\
      [3]volume=0.08,afade=t=in:st=0:d=3,afade=t=out:st=${durationSeconds - 3}:d=3[s4];\
      [4]volume=0.06,afade=t=in:st=1:d=3,afade=t=out:st=${durationSeconds - 3}:d=3[s5];\
      [s1][s2][s3][s4][s5]amix=inputs=5:duration=longest[aout]" \
    -map "[aout]" \
    -t ${durationSeconds} \
    -ar 44100 -ac 2 \
    "${outputPath}" 2>/dev/null`;

  execSync(ffmpegCmd, { stdio: "pipe" });
  console.log(`✅ Audio generated: ${outputPath}`);
  return outputPath;
}

// Loop short audio to target duration
export async function loopAudio(inputPath, outputPath, targetDuration = 3660) {
  console.log(`🔄 Looping audio to ${targetDuration / 60} minutes...`);

  const loopCount = Math.ceil(targetDuration / 10) + 5;

  const ffmpegCmd = `ffmpeg -y \
    -stream_loop ${loopCount} -i "${inputPath}" \
    -t ${targetDuration} \
    -acodec libmp3lame -ab 128k \
    "${outputPath}" 2>/dev/null`;

  execSync(ffmpegCmd, { stdio: "pipe" });
  console.log(`✅ Audio looped successfully`);
  return outputPath;
}