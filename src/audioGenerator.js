import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";

const PIXABAY_API_KEY = process.env.PEXELS_API_KEY; // Using Pexels key as it often works for Pixabay or user might have both

async function downloadRoyaltyFreeMusic() {
    const musicDir = path.join(process.cwd(), "assets", "music");
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

    // List of direct download links for high-quality royalty-free relaxing music
    // Sources: Incompetech (Kevin MacLeod), SoundHelix, etc.
    const musicSources = [
        { title: "Peaceful Meditation", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
        { title: "Gentle Piano", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
        { title: "Soft Ambient", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
        { title: "Deep Sleep Journey", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
        { title: "Morning Calm", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
        { title: "Zen Garden", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" }
    ];

    const track = musicSources[Math.floor(Math.random() * musicSources.length)];
    const fileName = `${track.title.replace(/\s+/g, '_').toLowerCase()}.mp3`;
    const filePath = path.join(musicDir, fileName);

    if (fs.existsSync(filePath)) {
        console.log(`⏭️ Music already exists: ${fileName}`);
        return;
    }

    console.log(`🎵 Downloading Royalty-Free Music: ${track.title}...`);

    try {
        const writer = fs.createWriteStream(filePath);
        const response = await axios({
            url: track.url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error("❌ Error downloading music:", error.message);
    }
}

export async function generateAudio(outputPath) {
    const musicDir = path.join(process.cwd(), "assets", "music");
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

    // Auto-download music if folder is empty or randomly
    let files = fs.readdirSync(musicDir).filter(f => f.endsWith(".mp3"));
    if (files.length === 0 || Math.random() > 0.5) {
        await downloadRoyaltyFreeMusic();
        files = fs.readdirSync(musicDir).filter(f => f.endsWith(".mp3"));
    }

    if (files.length === 0) {
        console.log("⚠️ No music found, using emergency fallback music...");
        const fallbackUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
        const fallbackPath = path.join(musicDir, "fallback_relaxing_music.mp3");
        
        const writer = fs.createWriteStream(fallbackPath);
        const response = await axios({
            url: fallbackUrl,
            method: 'GET',
            responseType: 'stream'
        });
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        files = ["fallback_relaxing_music.mp3"];
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