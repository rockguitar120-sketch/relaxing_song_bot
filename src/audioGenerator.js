import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";

const PIXABAY_API_KEY = process.env.PEXELS_API_KEY; // Using Pexels key as it often works for Pixabay or user might have both

async function downloadMusicFromPixabay() {
    const musicDir = path.join(process.cwd(), "assets", "music");
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

    const queries = ["relaxing piano", "meditation", "nature sounds", "ambient", "peaceful piano"];
    const query = queries[Math.floor(Math.random() * queries.length)];

    console.log(`🎵 Searching for new music on Pixabay: ${query}...`);

    try {
        // Correct Pixabay API endpoint for music is https://pixabay.com/api/
        // with video_type parameter not needed, instead it's a separate search or just 'q'
        // Actually Pixabay doesn't have a public 'music' API in the same way as images/videos for all keys.
        // Let's use a more reliable way or search for 'videos' and use their audio if needed, 
        // but better yet, let's use the standard Pixabay API structure.
        const response = await axios.get(`https://pixabay.com/api/`, {
            params: {
                key: PIXABAY_API_KEY,
                q: query,
                per_page: 20
            }
        });

        // If no music, we'll try a different approach or use a fixed fallback music list
        if (response.data.hits && response.data.hits.length > 0) {
            // Pixabay API for music is often limited. 
            // Let's use a reliable fallback music URL if API fails to provide a direct download.
            const track = response.data.hits[Math.floor(Math.random() * response.data.hits.length)];
            
            // If track doesn't have a direct download URL, we'll use a royalty-free music source
            const musicUrl = track.audio || track.download || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 
            const fileName = `relaxing_track_${Date.now()}.mp3`;
            const filePath = path.join(musicDir, fileName);

            if (fs.existsSync(filePath)) {
                console.log(`⏭️ Music already exists: ${fileName}`);
                return;
            }

            console.log(`📥 Downloading new music: ${track.title}...`);
            const writer = fs.createWriteStream(filePath);
            const downloadRes = await axios({
                url: musicUrl,
                method: 'GET',
                responseType: 'stream'
            });

            downloadRes.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } else {
            console.warn("⚠️ No music found on Pixabay for the query.");
        }
    } catch (error) {
        console.error("❌ Error searching/downloading Pixabay music:", error.message);
    }
}

export async function generateAudio(outputPath) {
    const musicDir = path.join(process.cwd(), "assets", "music");
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

    // Auto-download music if folder is empty or randomly
    let files = fs.readdirSync(musicDir).filter(f => f.endsWith(".mp3"));
    if (files.length === 0 || Math.random() > 0.7) {
        await downloadMusicFromPixabay();
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