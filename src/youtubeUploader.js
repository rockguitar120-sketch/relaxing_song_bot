import { google } from "googleapis";
import fs from "fs";

export async function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

export async function uploadToYouTube(videoPath, metadata, scheduledTime) {
  const auth = await getAuthClient();
  const youtube = google.youtube({ version: "v3", auth });

  console.log("📤 Uploading to YouTube...");

  const videoSize = fs.statSync(videoPath).size;
  console.log(`📊 Video size: ${(videoSize / 1024 / 1024).toFixed(1)} MB`);

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: metadata.categoryId,
        defaultLanguage: "en",
        defaultAudioLanguage: "en",
      },
      status: {
        privacyStatus: "private", // Will be scheduled
        publishAt: scheduledTime.toISOString(),
        selfDeclaredMadeForKids: false,
        madeForKids: false,
      },
    },
    media: {
      mimeType: "video/mp4",
      body: fs.createReadStream(videoPath),
    },
  }, {
    // Resumable upload settings
      onUploadProgress: evt => {
      const progress = (evt.bytesRead / videoSize) * 100;
      if (process.stdout.isTTY) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`📤 Upload Progress: ${progress.toFixed(2)}%`);
      } else {
        // Fallback for non-TTY environments like GitHub Actions
        if (Math.round(progress) % 10 === 0) {
           console.log(`📤 Upload Progress: ${progress.toFixed(2)}%`);
        }
      }
    },
  });

  const videoId = response.data.id;
  console.log(`✅ Video uploaded! ID: ${videoId}`);
  console.log(`🔗 URL: https://youtube.com/watch?v=${videoId}`);
  console.log(`⏰ Scheduled: ${scheduledTime.toLocaleString("en-US", { timeZone: "America/New_York" })} ET`);

  return { videoId, videoUrl: `https://youtube.com/watch?v=${videoId}` };
}