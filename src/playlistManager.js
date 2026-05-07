import { google } from "googleapis";

export class PlaylistManager {
  constructor(auth) {
    this.youtube = google.youtube({ version: "v3", auth });
    this.playlists = {};
  }

  async getOrCreatePlaylist(playlistName) {
    if (this.playlists[playlistName]) {
      return this.playlists[playlistName];
    }

    // Search existing playlists
    const response = await this.youtube.playlists.list({
      part: ["snippet"],
      mine: true,
      maxResults: 50,
    });

    const existing = response.data.items?.find(
      (p) => p.snippet.title === playlistName
    );

    if (existing) {
      this.playlists[playlistName] = existing.id;
      console.log(`📋 Found playlist: ${playlistName}`);
      return existing.id;
    }

    // Create new playlist
    const newPlaylist = await this.youtube.playlists.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: playlistName,
          description: `${playlistName} - Relaxing music for sleep, meditation, and relaxation. New videos added regularly!`,
          defaultLanguage: "en",
        },
        status: { privacyStatus: "public" },
      },
    });

    const newId = newPlaylist.data.id;
    this.playlists[playlistName] = newId;
    console.log(`✅ Created playlist: ${playlistName}`);
    return newId;
  }

  async addToPlaylist(playlistId, videoId) {
    await this.youtube.playlistItems.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: { kind: "youtube#video", videoId },
        },
      },
    });
    console.log(`✅ Added video to playlist`);
  }
}