import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function generateAudio(outputPath) {
    const categories = ["relaxing", "sleeping", "meditation"];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    
    console.log(`🔍 Selected Category: ${selectedCategory}`);
    
    // မင်းထည့်ထားတဲ့ သီချင်းဖိုင်လမ်းကြောင်း
    const musicPath = path.join(process.cwd(), "assets", "music", `${selectedCategory}.mp3`);

    // ဖိုင်ရှိမရှိ စစ်မယ်
    if (!fs.existsSync(musicPath)) {
        throw new Error(`Critical: Music file not found at ${musicPath}. Please add it to assets/music/`);
    }

    fs.mkdirSync("temp", { recursive: true });

    try {
        console.log(`🎵 Preparing audio from local assets...`);
        
        // သီချင်းကို ၁၀ စက္ကန့်စာ ဖြတ်ယူမယ်
        const ffmpegCmd = `ffmpeg -y -i "${musicPath}" -t 10 -acodec copy "${outputPath}" 2>/dev/null`;
        execSync(ffmpegCmd);
        
        return { path: outputPath, category: selectedCategory };
    } catch (error) {
        console.error("❌ Audio Preparation Failed:", error.message);
        throw error;
    }
}

export async function loopAudio(inputPath, outputPath, targetDuration = 3660) {
    console.log(`🔄 Looping music to 61 minutes...`);
    const loopCount = Math.ceil(targetDuration / 10) + 10;
    const fadeOutStart = targetDuration - 10;

    const ffmpegCmd = `ffmpeg -y -stream_loop ${loopCount} -i "${inputPath}" \
        -t ${targetDuration} \
        -af "afade=t=in:st=0:d=5,afade=t=out:st=${fadeOutStart}:d=10" \
        -acodec libmp3lame -ab 128k \
        "${outputPath}" 2>/dev/null`;

    execSync(ffmpegCmd);
    return outputPath;
}