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
        // Pixabay Music API endpoint
        const response = await axios.get(`https://pixabay.com/api/music/search/`, {
            params: {
                key: PIXABAY_API_KEY,
                q: query,
                order: "popular",
                duration_min: 60, // Try to find longer tracks if possible
            }
        });

        if (response.data.hits && response.data.hits.length > 0) {
            const track = response.data.hits[Math.floor(Math.random() * response.data.hits.length)];
            const musicUrl = track.download;
            const fileName = `${track.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
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
        throw new Error("❌ No music files found and auto-download failed.");
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