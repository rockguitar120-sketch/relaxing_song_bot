import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";

export async function generateAudio(outputPath) {
    const categories = ["relaxing", "sleeping", "meditation"];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    
    console.log(`🔍 Category: ${selectedCategory}`);
    const tempMusic = "temp/downloaded_music.mp3";
    fs.mkdirSync("temp", { recursive: true });

    // ဒီ link တွေက Bot တွေ ဒေါင်းလို့ရတဲ့ Direct Links တွေပါ
    const musicLibrary = {
        relaxing: "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/Xm7Ym8e5H9L1vPz4/Ketsa_-_08_-_Flowing.mp3",
        sleeping: "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/7X9a1v5B2m8Qk4Pz/Podington_Bear_-_Light_As_A_Feather.mp3",
        meditation: "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/9w5m2n8P1vQ7zL4X/Kai_Engel_-_04_-_Daylight.mp3"
    };

    const targetUrl = musicLibrary[selectedCategory];

    try {
        console.log(`📥 Downloading directly from Free Music Archive...`);
        
        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' } // Browser အယောင်ဆောင်ပြီး ဒေါင်းမယ်
        });

        const writer = fs.createWriteStream(tempMusic);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log("✅ Music downloaded successfully!");

        // ၁၀ စက္ကန့်စာ ဖြတ်မယ်
        const ffmpegCmd = `ffmpeg -y -i "${tempMusic}" -t 10 -acodec copy "${outputPath}" 2>/dev/null`;
        execSync(ffmpegCmd);
        
        return { path: outputPath, category: selectedCategory };
    } catch (error) {
        console.error("❌ Audio Download Failed. Trying backup link...");
        // Backup အနေနဲ့ တခြား link တစ်ခုကို ထပ်စမ်းမယ်
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