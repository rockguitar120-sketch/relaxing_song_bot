import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function generateAudio(outputPath) {
    const musicDir = path.join(process.cwd(), "assets", "music");
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

    const files = fs.readdirSync(musicDir).filter(f => f.endsWith(".mp3"));

    if (files.length === 0) {
        throw new Error("❌ Assets/music ထဲမှာ သီချင်းဖိုင်မရှိပါ။ Telegram ကနေ အရင်ပို့ပါ။");
    }

    // အပေါ်ဆုံးဖိုင်ကို ရွေးမယ်
    const selectedFile = files[0];
    const musicPath = path.join(musicDir, selectedFile);
    const trackTitle = path.parse(selectedFile).name; // ဖိုင်နာမည်ကို ယူမယ်

    console.log(`🎵 Processing Track: ${selectedFile}`);
    if (!fs.existsSync("temp")) fs.mkdirSync("temp", { recursive: true });

    try {
        // ၁၀ စက္ကန့်စာ ဖြတ်ယူမယ်
        execSync(`ffmpeg -y -i "${musicPath}" -t 10 -acodec copy "${outputPath}"`);
        
        return { 
            path: outputPath, 
            originalFile: musicPath, 
            trackTitle: trackTitle 
        };
    } catch (error) {
        throw new Error(`Audio Prep Failed: ${error.message}`);
    }
}

export async function loopAudio(inputPath, outputPath, targetDuration = 3660) {
    console.log(`🔄 Looping music...`);
    const loopCount = Math.ceil(targetDuration / 10) + 5;
    const fadeOutStart = targetDuration - 10;

    execSync(`ffmpeg -y -stream_loop ${loopCount} -i "${inputPath}" -t ${targetDuration} -af "afade=t=in:st=0:d=5,afade=t=out:st=${fadeOutStart}:d=10" -acodec libmp3lame -ab 128k "${outputPath}"`);
    return outputPath;
}