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

    // Public Domain Music URLs (ဥပမာအနေနဲ့ အေးချမ်းတဲ့ သီချင်းအချို့)
    const musicLibrary = {
        relaxing: "https://www.chosic.com/wp-content/uploads/2021/07/The-Garden-Of-The-Mind.mp3",
        sleeping: "https://www.chosic.com/wp-content/uploads/2020/06/Rain-on-Windows-Relaxing-Rain.mp3",
        meditation: "https://www.chosic.com/wp-content/uploads/2021/04/Deep-Meditation.mp3"
    };

    const targetUrl = musicLibrary[selectedCategory];

    try {
        console.log(`📥 Downloading free music from archive...`);
        
        // သီချင်းကို URL ကနေ တိုက်ရိုက်ဒေါင်းမယ်
        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(tempMusic);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log("✅ Music downloaded from archive!");

        // ၁၀ စက္ကန့်စာ ဖြတ်မယ်
        const ffmpegCmd = `ffmpeg -y -i "${tempMusic}" -t 10 -acodec copy "${outputPath}" 2>/dev/null`;
        execSync(ffmpegCmd);
        
        return { path: outputPath, category: selectedCategory };
    } catch (error) {
        console.error("❌ Audio Download Failed:", error.message);
        throw error;
    }
}

export async function loopAudio(inputPath, outputPath, targetDuration = 3660) {
    console.log(`🔄 Looping music...`);
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