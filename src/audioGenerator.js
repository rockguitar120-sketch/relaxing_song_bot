import { exec } from "yt-dlp-exec";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function generateAudio(outputPath) {
    // ၁။ Relaxing, Sleeping, Meditation ထဲက ကျပန်းရွေးမယ်
    const categories = ["relaxing", "sleeping", "meditation"];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    
    console.log(`🔍 Randomly selected category: ${selectedCategory}`);
    console.log(`🔍 Searching for ${selectedCategory} music...`);

    const tempMusic = "temp/downloaded_music.mp3";
    fs.mkdirSync("temp", { recursive: true });

    // No Copyright Music ကိုပဲ ရှာမယ်
    const query = `${selectedCategory} music no copyright instrumental relaxing`;

    try {
        // ၂။ YouTube ကနေ အသံဖိုင်ကို ဒေါင်းမယ်
        await exec(`ytsearch1:${query}`, {
            extractAudio: true,
            audioFormat: "mp3",
            output: tempMusic,
            noPlaylist: true,
        });

        console.log("📥 Music downloaded successfully!");

        // ၃။ သီချင်းကို ၁၀ စက္ကန့်စာ အတိုလေး ဖြတ်ယူမယ် (Loop ပတ်ဖို့အတွက်)
        const ffmpegCmd = `ffmpeg -y -i "${tempMusic}" -t 10 -acodec copy "${outputPath}" 2>/dev/null`;
        execSync(ffmpegCmd);
        
        return { path: outputPath, category: selectedCategory };
    } catch (error) {
        console.error("❌ Audio Download Failed:", error);
        throw error;
    }
}

export async function loopAudio(inputPath, outputPath, targetDuration = 3660) {
    console.log(`🔄 Looping to ${Math.floor(targetDuration / 60)} minutes...`);
    
    // ၁၀ စက္ကန့်ဖိုင်ကို ၁ နာရီကျော်အောင် loop ပတ်မယ့် အရေအတွက်
    const loopCount = Math.ceil(targetDuration / 10) + 10;
    const fadeOutStart = targetDuration - 10;

    const ffmpegCmd = `ffmpeg -y -stream_loop ${loopCount} -i "${inputPath}" \
        -t ${targetDuration} \
        -af "afade=t=in:st=0:d=5,afade=t=out:st=${fadeOutStart}:d=10" \
        -acodec libmp3lame -ab 128k \
        "${outputPath}" 2>/dev/null`;

    execSync(ffmpegCmd);
    console.log(`✅ Final 61-minute audio prepared`);
    return outputPath;
}