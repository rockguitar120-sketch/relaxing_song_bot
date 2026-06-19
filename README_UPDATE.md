# `relaxing_song_bot` အဆင့်မြှင့်တင်မှုနှင့် အသုံးပြုပုံလမ်းညွှန်

ဗီဒီယိုများ၏ အရည်အသွေးကို မြှင့်တင်ရန်နှင့် YouTube တွင် ငွေရှာနိုင်သော (Monetizable) အဆင့်သို့ ရောက်ရှိစေရန် အောက်ပါ အဆင့်မြှင့်တင်မှုများကို ပြုလုပ်ထားပါသည်။

## ၁။ အဓိက ပြောင်းလဲမှုများ (Key Updates)

*   **Pexels Video Integration**: ယခင်က ရိုးရှင်းသော အရောင်နောက်ခံများအစား Pexels API ကို အသုံးပြု၍ သဘာဝရှုခင်း (Stock Videos) များကို အလိုအလျောက် ဒေါင်းလုဒ်ဆွဲပြီး နောက်ခံအဖြစ် အသုံးပြုပေးပါသည်။
*   **AI-Powered Metadata**: Google Gemini AI ကို အသုံးပြု၍ ဗီဒီယိုတစ်ခုချင်းစီအတွက် SEO ကောင်းမွန်သော Title, Description နှင့် Tags များကို အလိုအလျောက် ဖန်တီးပေးပါသည်။
*   **Resumable YouTube Upload**: ဗီဒီယိုဖိုင်ကြီးများကို Upload တင်ရာတွင် ပိုမိုတည်ငြိမ်စေရန်နှင့် အင်တာနက် ပြတ်တောက်မှုရှိပါက ပြန်လည်ဆက်တင်နိုင်ရန် ပြင်ဆင်ထားပါသည်။
*   **Progress Tracking**: ဗီဒီယိုတင်နေစဉ်အတွင်း Upload Progress (%) ကို Terminal တွင် ကြည့်ရှုနိုင်ပါသည်။

## ၂။ လိုအပ်သော API Keys များ (Required API Keys)

Bot ကို အောင်မြင်စွာ အသုံးပြုနိုင်ရန် `.env` ဖိုင်တွင် အောက်ပါ API Key အသစ်များကို ထည့်သွင်းပေးရန် လိုအပ်ပါသည်-

1.  **PEXELS_API_KEY**: [Pexels API](https://www.pexels.com/api/) မှ အခမဲ့ ရယူနိုင်ပါသည်။
2.  **GEMINI_API_KEY**: [Google AI Studio](https://aistudio.google.com/) မှ အခမဲ့ ရယူနိုင်ပါသည်။

## ၃။ စတင်အသုံးပြုပုံ (How to Use)

၁။ အသစ်သွင်းထားသော Library များကို Install လုပ်ပါ-
```bash
npm install
```

၂။ `.env` ဖိုင်တွင် သင်၏ API Key များကို ဖြည့်စွက်ပါ-
```env
PEXELS_API_KEY=your_pexels_key
GEMINI_API_KEY=your_gemini_key
# ကျန်ရှိသော YouTube နှင့် Telegram Key များကိုလည်း ဖြည့်ပါ
```

၃။ Bot ကို စတင်နှိုးပါ-
```bash
npm start
```

## ၄။ ပိုက်ဆံရရှိရန် အကြံပြုချက်များ (Monetization Tips)

*   **Content Originality**: Bot သည် AI နှင့် Stock Video များကို အသုံးပြုထားသဖြင့် YouTube ၏ Reused Content Policy ကို ရှောင်ရှားနိုင်ရန် ကူညီပေးပါသည်။
*   **Consistent Upload**: Bot တွင် ပါဝင်သော Scheduling စနစ်ကို အသုံးပြု၍ နေ့စဉ် ပုံမှန်တင်ပေးခြင်းဖြင့် Channel Growth ကို မြန်ဆန်စေပါသည်။
*   **Quality Music**: Telegram မှတစ်ဆင့် အရည်အသွေးမြင့်ပြီး Copyright ကင်းလွတ်သော သီချင်းများကိုသာ ပေးပို့ရန် အကြံပြုလိုပါသည်။

---
*မှတ်ချက်: ဗီဒီယိုဖန်တီးမှု လုပ်ငန်းစဉ်သည် ဗီဒီယိုအရှည် ၆၁ မိနစ်ဖြစ်သဖြင့် စက်၏စွမ်းဆောင်ရည်အပေါ် မူတည်၍ ၅ မိနစ်မှ ၁၅ မိနစ်ခန့် ကြာမြင့်နိုင်ပါသည်။*
