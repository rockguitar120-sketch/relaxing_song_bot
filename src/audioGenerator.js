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
        { title: "Deep Zen Meditation", url: "https://audionautix.com/Music/Namaste.mp3" },
        { title: "Celestial Sleep Aid", url: "https://audionautix.com/Music/NavajoNight.mp3" },
        { title: "Ethereal Relaxation", url: "https://audionautix.com/Music/Ohm.mp3" },
        { title: "Peaceful Healing Sounds", url: "https://audionautix.com/Music/RunningWaters.mp3" },
        { title: "Zen Garden Piano", url: "https://archive.org/download/ZenMeditationMusicSoothingMusicRelaxingMusicMeditationZenBinauralBeats3236/3%20HOURS%20The%20Best%20Relaxing%20Piano%20Flute%20Music%20Ever.mp3" },
        { title: "Spiritual Guitar Journey", url: "https://archive.org/download/ZenMeditationMusicSoothingMusicRelaxingMusicMeditationZenBinauralBeats3236/3%20Hour%20Relaxing%20Guitar%20Music%20Meditation%20Music%2C%20Instrumental%20Music%2C%20Calming%20Music%2C%20Soft%20Music%2C%20%E2%98%AF2432.mp3" },
        { title: "Deep Sleep Sanctuary", url: "https://archive.org/download/ZenMeditationMusicSoothingMusicRelaxingMusicMeditationZenBinauralBeats3236/30%20Minute%20Relaxing%20Sleep%20Music%2C%20Calm%20Music%2C%20Soft%20Music%2C%20Instrumental%20Music%2C%20Sleep%20Meditation%2C%20%E2%98%AF3241B.mp3" }
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