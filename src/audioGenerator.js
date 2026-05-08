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

    // Wikimedia Commons က တိုက်ရိုက်ဒေါင်းလို့ရတဲ့ Stable Link များ
    const musicLibrary = {
        relaxing: "https://upload.wikimedia.org/wikipedia/commons/2/23/Nocturne_op._9_no._2_in_E-flat_major.mp3",
        sleeping: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Rain_on_a_tin_roof.mp3",
        meditation: "https://upload.wikimedia.org/wikipedia/commons/b/be/Soft_piano_and_wind.mp3"
    };

    const targetUrl = musicLibrary[selectedCategory];

    try {
        console.log(`📥 Downloading from Wikimedia Commons (Very Stable)...`);
        
        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: 'stream',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'audio/mpeg'
            }
        });

        const writer = fs.createWriteStream(tempMusic);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log("✅ Music downloaded from Commons!");

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