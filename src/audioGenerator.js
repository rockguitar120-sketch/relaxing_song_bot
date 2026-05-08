import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function generateAudio(outputPath) {
    const categories = ["relaxing", "sleeping", "meditation"];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    
    console.log(`🔍 Category: ${selectedCategory}`);
    if (!fs.existsSync("temp")) fs.mkdirSync("temp", { recursive: true });

    try {
        console.log(`🎵 Synthesizing error-free ambient audio...`);
        
        let filter = "";
        if (selectedCategory === "sleeping") {
            // Brown noise (Deep rain-like sound)
            filter = "anoisesrc=d=10:c=brown:a=0.1,lowpass=f=500";
        } else if (selectedCategory === "meditation") {
            // Pink noise (Soft wind/waves)
            filter = "anoisesrc=d=10:c=pink:a=0.05,tremolo=f=0.1:d=0.5";
        } else {
            // White noise (Soft static)
            filter = "anoisesrc=d=10:c=white:a=0.02,lowpass=f=1000";
        }

        // Command ကို ပိုရှင်းအောင် ပြင်ထားပါတယ်
        const ffmpegCmd = `ffmpeg -y -f lavfi -i "${filter}" -ar 44100 -ac 2 "${outputPath}"`;
        
        execSync(ffmpegCmd, { stdio: "inherit" }); // Error ဘာတက်လဲ မြင်ရအောင် inherit သုံးမယ်
        console.log("✅ Audio synthesized successfully!");
        
        return { path: outputPath, category: selectedCategory };
    } catch (error) {
        console.error("❌ Synthesis Failed:", error.message);
        throw error;
    }
}

export async function loopAudio(inputPath, outputPath, targetDuration = 3660) {
    console.log(`🔄 Looping music to 61 minutes...`);
    const loopCount = Math.ceil(targetDuration / 10) + 5;
    const fadeOutStart = targetDuration - 10;

    const ffmpegCmd = `ffmpeg -y -stream_loop ${loopCount} -i "${inputPath}" \
        -t ${targetDuration} \
        -af "afade=t=in:st=0:d=5,afade=t=out:st=${fadeOutStart}:d=10" \
        -acodec libmp3lame -ab 128k \
        "${outputPath}"`;

    execSync(ffmpegCmd, { stdio: "inherit" });
    return outputPath;
}
