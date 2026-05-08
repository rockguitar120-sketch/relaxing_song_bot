import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function generateAudio(outputPath) {
    const categories = ["relaxing", "sleeping", "meditation"];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    
    console.log(`🔍 Category: ${selectedCategory}`);
    fs.mkdirSync("temp", { recursive: true });

    try {
        console.log(`🎵 Synthesizing original ambient audio (No Download Needed)...`);
        
        // category အလိုက် မတူညီတဲ့ အသံလှိုင်းတွေကို ပေါင်းစပ်ပြီး တီးခိုင်းမယ်
        let audioFilter = "";
        if (selectedCategory === "sleeping") {
            // မိုးရွာသံ (Brown Noise)
            audioFilter = "anoisesrc=d=10:c=brown:amp=0.1, lowpass=f=500";
        } else if (selectedCategory === "meditation") {
            // ပင်လယ်လှိုင်းသံ (Pink Noise)
            audioFilter = "anoisesrc=d=10:c=pink:amp=0.05, tremolo=f=0.1:d=0.5";
        } else {
            // Relaxing (White Noise + Soft Sine)
            audioFilter = "anoisesrc=d=10:c=white:amp=0.02, lowpass=f=1000";
        }

        const ffmpegCmd = `ffmpeg -y -f lavfi -i "${audioFilter}" -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;
        
        execSync(ffmpegCmd);
        console.log("✅ Original audio synthesized locally!");
        
        return { path: outputPath, category: selectedCategory };
    } catch (error) {
        console.error("❌ Audio Synthesis Failed:", error.message);
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