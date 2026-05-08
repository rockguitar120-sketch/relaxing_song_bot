import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function generateAudio(outputPath) {
    const musicDir = path.join(process.cwd(), "assets", "music");
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

    const files = fs.readdirSync(musicDir).filter(f => f.endsWith(".mp3"));

    if (files.length === 0) {
        throw new Error("❌ No music files found in assets/music");
    }

    const selectedFile = files[0]; // Queue အတိုင်း ပထမဆုံးဖိုင်ကို ယူမယ်
    const musicPath = path.join(musicDir, selectedFile);
    const trackTitle = path.parse(selectedFile).name;

    fs.copyFileSync(musicPath, outputPath);
    
    return { 
        path: outputPath, 
        originalFile: musicPath, 
        trackTitle: trackTitle 
    };
}

export async function loopAudio(inputPath, outputPath, targetDuration = 3660) {
    console.log(`🔄 Looping music to 61 minutes...`);
    
    const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
    const trackDuration = parseFloat(execSync(durationCmd).toString());
    
    const loopCount = Math.ceil(targetDuration / trackDuration);
    const fadeOutStart = targetDuration - 10;

    const ffmpegCmd = `ffmpeg -y -stream_loop ${loopCount} -i "${inputPath}" -t ${targetDuration} -af "afade=t=in:st=0:d=5,afade=t=out:st=${fadeOutStart}:d=10" -acodec libmp3lame -ab 128k "${outputPath}"`;

    execSync(ffmpegCmd);
    return outputPath;
}