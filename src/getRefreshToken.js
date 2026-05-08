import { google } from "googleapis";
import readline from "readline";
import dotenv from "dotenv";
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  "http://localhost"
);

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"],
  prompt: "consent",
});

console.log("\n🔗 Open this URL in browser:\n");
console.log(url);
console.log("\n✅ After approving, paste the code below:\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Code: ", async (code) => {
  const { tokens } = await oauth2Client.getToken(code.trim());
  console.log("\n🔑 Your Refresh Token:");
  console.log(tokens.refresh_token);
  console.log("\n📋 Copy this to GitHub Secrets as YOUTUBE_REFRESH_TOKEN");
  rl.close();
});