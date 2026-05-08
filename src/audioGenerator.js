import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function generateAudio(outputPath, durationSeconds = 10) {
  console.log("🎵 Generating ambient audio...");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // ✅ FIX: NO afade:out on short clip - fade-out causes silence every loop!
  const ffmpegCmd = `ffmpeg -y \
    -f lavfi -i "sine=frequency=174:sample_rate=44100" \
    -f lavfi -i "sine=frequency=285:sample_rate=44100" \
    -f lavfi -i "sine=frequency=396:sample_rate=44100" \
    -f lavfi -i "sine=frequency=432:sample_rate=44100" \
    -f lavfi -i "sine=frequency=528:sample_rate=44100" \
    -filter_complex "\
      [0]volume=0.15[s1];\
      [1]volume=0.12[s2];\
      [2]volume=0.10[s3];\
      [3]volume=0.08[s4];\
      [4]volume=0.06[s5];\
      [s1][s2][s3][s4][s5]amix=inputs=5:duration=longest[aout]" \
    -map "[aout]" \
    -t ${durationSeconds} \
    -ar 44100 -ac 2 \
    "${outputPath}" 2>/dev/null`;

  execSync(ffmpegCmd, { stdio: "pipe" });
  console.log(`✅ Audio generated: ${outputPath}`);
  return outputPath;
}

export async function loopAudio(inputPath, outputPath, targetDuration = 3660) {
  console.log(`🔄 Looping audio to ${Math.floor(targetDuration / 60)} minutes...`);

  // ✅ FIX: Correct loop count based on actual clip duration
  const clipDuration = 10; // short audio is 10 seconds
  const loopCount = Math.ceil(targetDuration / clipDuration) + 10;

  // ✅ FIX: Fade-in/out applied HERE on the final long audio (not on short clip)
  const fadeOutStart = targetDuration - 10;
  const ffmpegCmd = `ffmpeg -y \
    -stream_loop ${loopCount} -i "${inputPath}" \
    -t ${targetDuration} \
    -af "afade=t=in:st=0:d=8,afade=t=out:st=${fadeOutStart}:d=10" \
    -acodec libmp3lame -ab 128k \
    "${outputPath}" 2>/dev/null`;

  execSync(ffmpegCmd, { stdio: "pipe" });
  console.log(`✅ Audio looped: ${outputPath}`);
  return outputPath;
}