import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

async function generateMetadataWithAI(category, trackTitle) {
  if (!genAI) {
    console.warn("Gemini API key not set. Using default metadata templates.");
    return null;
  }

  // Use Gemini 2.5 Flash - The most stable free model in 2026
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Act as an expert YouTube growth hacker and SEO specialist for top relaxation and meditation channels. Generate a highly engaging, click-worthy YouTube video title, an immersive description with timestamps (0:00 Intro, 15:00 Deep Relaxation, 30:00 Peace & Calm, 45:00 Restful State), and 12 high-performing SEO tags for a 61-minute ${category} music video. Track title: "${trackTitle}". 
Tone: Professional, calming, natural, and human-like (avoid robotic AI phrasing). 
IMPORTANT: Provide ONLY the raw JSON output without any markdown formatting, backticks, or extra text. Format: {"title": "Your Title", "description": "Your Description", "tags": ["tag1", "tag2"]}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating metadata with AI:", error.message);
    return null;
  }
}

export async function generateMetadata(videoCount = 0, trackTitle = "Relaxing Music") {
  const categories = {
    sleeping: {
      titles: [
        `Deep Sleep Music 😴 Calm Your Mind | Featuring "${trackTitle}"`,
        `Sleep Fast & Easy 🌙 Gentle Music to Drift Off | 1 Hour Sleep Aid`,
        `Peaceful Night Music 🌟 Soothing Melodies for Deep Sleep`,
        `Fall Asleep in Minutes 💤 Soft Sleep Music | "${trackTitle}"`,
        `Relaxing Sleep Sounds 🌙 Calm Music for Insomnia Relief | 1 Hour`,
        `Healing Sleep Music 🎵 Delta Waves for Deep Rest | Sleep Better Tonight`,
      ],
      descriptions: [
        `🌙 Welcome to our Relaxing Sleep Music channel! Today's session features "${trackTitle}", a 1-hour composition designed to help you fall asleep fast and enjoy deep, restful sleep.\n\n✨ Benefits:\n• Reduces stress and anxiety\n• Promotes deep sleep naturally\n• Calms the mind and body\n• Perfect for insomnia relief\n\n🎵 Best experienced with headphones at low volume.\n\n⏰ Timestamps:\n0:00 - Gentle Introduction: ${trackTitle}\n15:00 - Deep Sleep Phase\n30:00 - Delta Wave Relaxation\n45:00 - Peaceful Slumber\n\n💬 Comment below how this music helped you!\n👍 Like and Subscribe for daily sleep music!\n\n#SleepMusic #RelaxingMusic #DeepSleep`,
        `😴 Struggling to sleep? Let the soothing sounds of "${trackTitle}" guide you into deep, restorative sleep. Perfect for bedtime relaxation and stress relief.\n\n🌟 Why This Works:\n• Specially composed calming frequencies\n• Gentle melodies that slow brainwaves\n• No jarring sounds or sudden changes\n• Continuous loop for all-night use\n\n🎧 Tips for Best Experience:\n• Use headphones or speakers at low volume\n• Dim your lights 30 minutes before bed\n• Practice deep breathing as music plays\n\n👍 If this helped you sleep, please LIKE and SUBSCRIBE!\n\n#DeepSleepMusic #SleepAid #CalmMusic`,
      ],
      tags: [
        ["sleep music", "relaxing music", "deep sleep", "calm music", "insomnia relief", "sleep aid", "peaceful music", "meditation music", "stress relief", "sleep sounds"],
        ["sleeping music", "soft music", "bedtime music", "sleep fast", "relaxation music", "anxiety relief", "delta waves", "healing music", "sleep therapy", "night music"],
      ],
      playlistName: "Deep Sleep Music 😴",
    },
    meditation: {
      titles: [
        `5-Minute Meditation Music 🧘 Clear Your Mind | "${trackTitle}"`,
        `Deep Meditation Music 🕉️ Zen Sound Journey | Inner Peace & Calm`,
        `Morning Meditation 🌅 Start Your Day Right | Featuring "${trackTitle}"`,
        `Stress Relief Meditation 🌿 Let Go of Anxiety | Healing Frequencies`,
        `Chakra Healing Music 🌈 Balance Your Energy | 1 Hour Meditation`,
        `Guided Relaxation Music 🎵 Release Tension | Mind Body Healing`,
      ],
      descriptions: [
        `🧘 Find your inner peace with this powerful meditation music featuring "${trackTitle}". Designed for mindfulness practice, yoga, and deep relaxation.\n\n✨ Perfect For:\n• Morning meditation\n• Yoga sessions\n• Stress and anxiety relief\n• Mindfulness practice\n• Study and focus\n\n🎵 Features:\n• Binaural-inspired tones\n• Peaceful ambient soundscapes\n• No lyrics to distract\n• Seamless loop\n\n⏰ Timestamps:\n0:00 - Centering: ${trackTitle}\n20:00 - Deep Meditation\n40:00 - Expansion\n55:00 - Return\n\n#MeditationMusic #Mindfulness #ZenMusic`,
        `🌿 This peaceful meditation music ("${trackTitle}") will help you achieve a calm, focused state of mind. Perfect for beginners and experienced meditators alike.\n\n🕉️ Benefits:\n• Reduces cortisol (stress hormone)\n• Improves focus and clarity\n• Promotes emotional balance\n• Deepens meditation practice\n\n💡 How to Use:\n1. Find a comfortable seated position\n2. Close your eyes\n3. Focus on your breath\n4. Let the music guide you\n\n#DeepMeditation #InnerPeace #RelaxingMusic`,
      ],
      tags: [
        ["meditation music", "zen music", "mindfulness", "relaxing music", "inner peace", "yoga music", "stress relief", "healing music", "chakra music", "ambient music"],
        ["meditation", "calm music", "peaceful music", "anxiety relief", "focus music", "spiritual music", "binaural beats", "nature sounds", "relaxation", "mindful music"],
      ],
      playlistName: "Meditation & Mindfulness 🧘",
    },
    relaxing: {
      titles: [
        `Relaxing Music for Stress Relief 🌿 Featuring "${trackTitle}"`,
        `Peaceful Piano Music 🎹 Relax Your Mind | 1 Hour Ambient Sounds`,
        `Nature & Music Blend 🌊 "${trackTitle}" & Soft Piano | Ultimate Relaxation`,
        `Anti-Stress Music 🌸 Instant Calm | Perfect for Anxiety Relief`,
        `Chill Ambient Music 🎵 Unwind After Work | Peaceful Evening Vibes`,
        `Spa & Wellness Music 🌺 Total Body Relaxation | Healing Sounds`,
      ],
      descriptions: [
        `🌿 Unwind and de-stress with this beautiful relaxing music featuring "${trackTitle}". Whether you're working, studying, or just need to relax, this music creates the perfect peaceful atmosphere.\n\n✨ Ideal For:\n• Work from home background music\n• Study sessions\n• Evening wind-down\n• Spa and self-care\n• Reading and journaling\n\n🎵 Music Style:\n• Soft ambient melodies\n• Calming harmonies\n• Gentle rhythms\n• Peaceful soundscapes\n\n#RelaxingMusic #StressRelief #CalmMusic`,
        `🌊 Let this serene music ("${trackTitle}") wash away your stress and worries. Perfect background music for any relaxing activity.\n\n🌸 Why People Love This:\n• Instantly calming\n• Non-intrusive background sound\n• Helps with focus and creativity\n• Reduces workplace stress\n\n💆 Perfect For:\n• Remote work\n• Studying for exams\n• Creative projects\n• Evening relaxation\n\n#AmbientMusic #RelaxationMusic #ChillMusic`,
      ],
      tags: [
        ["relaxing music", "stress relief", "calm music", "ambient music", "background music", "study music", "work music", "chill music", "peaceful music", "anti-stress"],
        ["relaxation music", "spa music", "wellness music", "nature sounds", "piano music", "soft music", "healing music", "focus music", "tranquil music", "zen music"],
      ],
      playlistName: "Relaxing & Chill Music 🌿",
    },
  };

  const categoryKeys = Object.keys(categories);
  const categoryKey = categoryKeys[videoCount % categoryKeys.length];
  const category = categories[categoryKey];

  const aiMetadata = await generateMetadataWithAI(categoryKey, trackTitle);

  const aiNotice = `\n\n🤖 Note: This video incorporates AI-assisted tools for content structuring, metadata optimization, and visual composition to provide a seamless relaxation experience.`;

  if (aiMetadata) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const cta = `\n\n✨ If you enjoyed this journey, please LIKE, COMMENT, and SUBSCRIBE for daily peaceful music! ✨\n🔔 Turn on notifications to never miss a moment of calm.`;
    return {
      title: aiMetadata.title,
      description: aiMetadata.description + cta + aiNotice + `\n\n📅 Published: ${dateStr}\n© Relaxing Sounds Channel`,
      tags: aiMetadata.tags,
      categoryId: "10", // Music category on YouTube
      playlistName: category.playlistName,
      videoCategory: categoryKey,
    };
  }

  // Fallback logic
  const titleIndex = Math.floor(Math.random() * category.titles.length);
  const descIndex = Math.floor(Math.random() * category.descriptions.length);
  const tagIndex = Math.floor(Math.random() * category.tags.length);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return {
    title: category.titles[titleIndex],
    description: category.descriptions[descIndex] + aiNotice + `\n\n📅 Published: ${dateStr}\n© Relaxing Sounds Channel`,
    tags: category.tags[tagIndex],
    categoryId: "10", // Music category on YouTube
    playlistName: category.playlistName,
    videoCategory: categoryKey,
  };
}
