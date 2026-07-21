# AIVA (AI Virtual Assistant) - Loyiha Hujjati va Tizim Arxitekturasi

Ushbu hujjat **AIVA** loyihasining to'liq arxitekturasi, ma'lumotlar bazasi sxemalari, ishlatilgan algoritmlar, API endpointlari va front-end/back-end tarkibiy qismlarini ChatGPT kabi AI modellariga loyihani oson tushuntirish va ustiga yangi funksiyalar qo'shish uchun mo'ljallangan.

---

## 1. Loyiha haqida umumiy ma'lumot (Project Overview)

**AIVA** — biznesning savdo kanallarini (ayni vaqtda Telegram va Instagram DM) avtomatlashtirish, mijozlar bilan muloqot qilish, savdolarni boshqarish va yetakchilarni (lead) saralash uchun yaratilgan aqlli savdo yordamchisi va boshqaruv paneli (Dashboard).

### Asosiy Funksiyalar:
1. **O'z-o'zidan o'rganuvchi Bilimlar Bazasi (Living Knowledge Base)**: Mijozlar bergan savollarni o'rganib boradi, RAG (Retrieval-Augmented Generation) yordamida javob qaytaradi va yangi javoblarni ma'muriyat tasdiqlashi uchun (pending statusida) bazaga avtomatik qo'shadi.
2. **SPIN Sales Framework**: Suhbatni SPIN (Situation, Problem, Implication, Need-payoff) metodologiyasi bo'yicha olib borib, mijozning ehtiyojlarini aniqlaydi va savdoni yakunlash ehtimolini hisoblaydi.
3. **Premium Behavioral Intelligence**: Mijozning hissiyotini (Sentiment), niyatini (Intent) va e'tirozlarini (Objection) tahlil qiladi. Mijoz yozgan alifboni (Uzbek Latin/Cyrillic) aniqlab, javobni ham xuddi shu shriftda qaytaradi.
4. **Mijoz ma'lumotlarini capture qilish**: Ism, telefon raqami, elektron pochta va qiziqayotgan mahsulotlarni avtomatik aniqlab, CRM-ga Lead sifatida saqlaydi.
5. **Inson yordamiga o'tkazish (Human Takeover)**: Mijoz operatorni chaqirganda yoki AI e'tirozlarni hal qila olmay qolganda, suhbatni avtomatik ravishda insonga o'tkazadi va dashboardga bildirishnoma yuboradi.
6. **Channel Simulator Sandbox**: Admin panelida Telegram yoki Instagram integratsiyalarini haqiqiy mijoz kabi test qilish uchun interaktiv chat simulyatori.

---

## 2. Texnologiyalar va Arxitektura (Tech Stack)

* **Front-end**: React + Vite, Tailwind CSS, Lucide React (ikonkalar uchun), Axios, React Router.
* **Back-end**: Node.js + Express.js.
* **Ma'lumotlar bazasi (Database)**: Ikki tomonlama (Dual) tizim:
  * **MongoDB (Mongoose)**: Ishlab chiqarish (Production) muhiti uchun.
  * **Local JSON DB (`db.json`)**: Mahalliy rivojlantirish (Development) uchun avtomatik ishga tushadigan fayl-baza (Mongoose interfeysini to'liq simulyatsiya qiladi).
* **AI Engine**: OpenAI API (yoki local fallback mock AI modeli).

---

## 3. Loyihaning Fayllar Tuzilishi (File Structure)

```text
aiva/
├── client/                      # Front-end React ilovasi
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # Yo'nalishlar (Routing) va global Toast bildirishnomalar
│       ├── App.css
│       ├── index.css            # Custom dizayn va glassmorphism o'zgaruvchilari
│       ├── context/
│       │   └── AppContext.jsx   # Global holat boshqaruvi va API xizmatlari
│       ├── components/
│       │   └── DashboardLayout.jsx # Dashboard chap menyusi va yuqori qismi
│       └── pages/
│           ├── DashboardPage.jsx
│           ├── IntegrationsPage.jsx # Telegram va Instagram ulanishi + Chat Simulator
│           ├── KnowledgePage.jsx    # Bilimlar bazasi va uning tahlillari
│           ├── CRMPage.jsx          # Leadlar va savdo voronkasi (Sales Pipeline)
│           ├── ConversationsPage.jsx # Mijozlar bilan jonli suhbat (Human takeover chat)
│           ├── AIAgentPage.jsx      # AI Agent sozlamalari
│           ├── AnalyticsPage.jsx    # Savdo va AI tahlillari
│           └── ... (Mahsulotlar, Xodimlar, Sozlamalar sahifalari)
│
└── server/                      # Back-end API xizmati
    ├── server.js                # Serverni ishga tushirish fayli
    ├── db.js                    # Dual-DB (JSON DB / MongoDB) ulagichi va sxemalar
    ├── .env                     # Muhit sozlamalari (Port, OpenAI Key, Webhook URL)
    ├── routes/
    │   ├── auth.js              # Foydalanuvchi tizimga kirishi va ro'yxatdan o'tishi
    │   ├── knowledge.js         # Bilimlar bazasi CRUD va tahlillari
    │   ├── integrations.js      # Integratsiyalar API (Telegram ulanishi, Simulyator)
    │   └── ... (mahsulotlar, leadlar, conversations yo'llari)
    └── services/
        ├── ai.js                # Asosiy AI javob berish va SPIN / Behavioral Engine
        ├── knowledgeEngine.js   # Q&A qidirish (Levenshtein), PII tozalash va o'rganish
        ├── telegram.js          # Telegram API va xabar qabul qiluvchi fallback poller
        └── telegramWebhook.js   # Telegram Webhook, retry va xabar yuborish logikasi
```

---

## 4. Muhim Algoritmlar va Modullar (Core Mechanics)

### 4.1. RAG va Living Knowledge Base (`knowledgeEngine.js`)
* **Matnni normalizatsiya qilish**: Stop-so'zlarni o'chirish (o'zbek, rus, ingliz) va kalit so'zlarni ajratib olish.
* **Levenshtein masofasi (Similarity Match)**: Mijoz yozgan savol va bazadagi Q&A orasidagi o'xshashlik foizini hisoblaydi (`calculateSimilarity` funksiyasi).
* **PII Sanitization (Shaxsiy ma'lumotlar xavfsizligi)**: Matndagi telefon raqami, karta raqami, elektron pochta va maxfiy kalitlarni `[CARD_SECURED]`, `[TOKEN_SECURED]` ko'rinishida tozalab keyin bazaga yozadi.
* **Auto-Grow (O'z-o'zini boyitish)**: Agar savolga o'xshash javob topilmasa (o'xshashlik < 80%), tizim AI yaratgan javobni `pending` statusi bilan bazaga qo'shadi. Keyinchalik admin uni tahrirlab tasdiqlashi mumkin.

### 4.2. SPIN Sales va Behavioral Analytics (`ai.js`)
* **SPIN jarayoni**: Suhbatning qaysi bosqichdaligini (`salesStage`: situation, problem, implication, need_payoff, presentation, closing) aniqlab, suhbatni keyingi bosqich savoliga yo'naltiradi.
* **Hissiyot va niyatlarni kuzatish**: Har bir xabardan so'ng mijozning hissiyoti (`sentimentTimeline`) va niyati (`intentTimeline`) o'zgarishi saqlab boriladi.
* **E'tirozlarni boshqarish**: Narx, vaqt, ishonch, ehtiyoj yoki qaror qabul qiluvchi shaxs bo'yicha e'tirozlarni (objections) ajratib oladi va ularga moslashtirilgan javob variantlarini taklif qiladi.
* **Alifboni moslashtirish (Language Mirroring)**: Mijoz o'zbekcha yozganda kirill yoki lotin yozuvidan foydalanganiga qarab, AI javobi ham mos yozuvga o'zgartiriladi (`uzLatinToCyrillic` / `uzCyrillicToLatin`).

### 4.3. Telegram Transport & Webhook Layer (`telegramWebhook.js` / `telegram.js`)
* Tizim Telegram API webhook ulanishini avtomatlashtiradi.
* **429 Rate Limit va Retries**: Telegram serveridan 429 xatosi kelganda, javob matnida ko'rsatilgan soniya davomida kutib, so'ng qayta urinadi (`registerTelegramWebhook`).
* **Human-like Pacing**: Telegram foydalanuvchisiga xabar yozishdan oldin bot "typing..." holatini yuboradi, so'ng uzun matnlarni paragraflarga bo'lib, biroz kutish oralig'ida bo'lib-bo'lib yuboradi.

---

## 5. Ma'lumotlar bazasi sxemalari (Database Schemas)

Quyida `db.js` faylidagi eng muhim ma'lumotlar sxemalarining tuzilishi keltirilgan:

### 5.1. Conversation (Suhbatlar)
```javascript
const ConversationSchema = new mongoose.Schema({
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  customerInstagram: { type: String, default: '' },
  customerTelegram: { type: String, default: '' },
  messages: [{
    sender: { type: String, enum: ['customer', 'ai', 'human'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  companyId: { type: String, required: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  channel: { type: String, enum: ['sandbox', 'telegram', 'instagram'], default: 'sandbox' },
  assignedTo: { type: String, enum: ['ai', 'human'], default: 'ai' },
  
  // SPIN Sales Stages
  salesStage: { type: String, default: 'situation' },
  leadScore: { type: Number, default: 0 },
  spinAnswers: {
    situation: { type: String, default: '' },
    problem: { type: String, default: '' },
    implication: { type: String, default: '' },
    needPayoff: { type: String, default: '' }
  },
  
  // Qualification & Demographics
  qualification: {
    companySize: { type: String, default: '' },
    industry: { type: String, default: '' },
    urgency: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    decisionMaker: { type: String, default: '' },
    businessGoals: { type: String, default: '' },
    painLevel: { type: String, default: '' },
    purchaseIntent: { type: String, default: '' },
    timeline: { type: String, default: '' }
  },
  painPoints: { type: [String], default: [] },
  recommendedProducts: { type: [String], default: [] },
  closeProbability: { type: Number, default: 0 },

  // Behavioral Analytics
  sentimentTimeline: [{ sentiment: String, timestamp: Date }],
  intentTimeline: [{ intent: String, timestamp: Date }],
  buyingSignals: { type: [String], default: [] },
  objectionsLog: [{ category: String, text: String, resolved: Boolean, timestamp: Date }],
  
  // Custom Analytics
  nextBestAction: { type: String, default: 'ask_discovery' },
  personalityStyle: { type: String, default: '' },
  trustLevel: { type: String, default: 'medium' },
  salesReadiness: { type: Number, default: 0 },
  alphabetPreferred: { type: String, default: 'latin' },
  revenuePrediction: { type: Number, default: 0 },
  customerLifetimeValueEstimate: { type: Number, default: 0 }
});
```

### 5.2. Lead (Yetakchi mijozlar)
```javascript
const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  telegram: { type: String, default: '' },
  instagram: { type: String, default: '' },
  companyId: { type: String, required: true },
  interestedProduct: { type: String, default: '' },
  conversationHistoryId: { type: String, default: '' },
  budget: { type: Number, default: 0 },
  status: { type: String, enum: ['new', 'contacted', 'negotiation', 'sold', 'lost'], default: 'new' },
  revenue: { type: Number, default: 0 }
});
```

### 5.3. Knowledge (Bilimlar)
```javascript
const KnowledgeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: 'faq' }, // faq, policy, verified_answer, etc.
  companyId: { type: String, required: true },
  question: { type: String, default: '' },
  normalizedQuestion: { type: String, default: '' },
  keywords: { type: [String], default: [] },
  category: { type: String, default: 'General' },
  language: { type: String, default: 'en' },
  confidence: { type: Number, default: 100 },
  source: { type: String, default: 'admin_document' }, // admin_document, ai_generation
  approvalStatus: { type: String, enum: ['pending', 'verified', 'approved', 'rejected'], default: 'verified' }
});
```

---

## 6. ChatGPT-ga So'rov Yuborish Namunalari (Prompts for ChatGPT)

Loyiha ustida ishlashni davom ettirish uchun ChatGPT-ga quyidagi so'rovlarni berishingiz mumkin:

### 6.1. Yangi funksiya qo'shish so'rovi (Instagram Webhook qo'shish)
> *"Men yuborgan AIVA loyiha hujjatidan kelib chiqib, Instagram Direct Messages uchun webhook va xabar almashish xizmatini yozishimiz kerak. Xuddi `telegramWebhook.js` kabi, Instagram Meta API uchun webhook endpointlarini (`routes/integrations.js` va yangi `services/instagramWebhook.js` da) yarat. Xabarlarni qabul qilib backenddagi AIVA AI javob tizimiga uzatsin."*

### 6.2. Algoritmni yaxshilash so'rovi (Qidiruvni yaxshilash)
> *"Loyihadagi `knowledgeEngine.js` faylidagi Levenshtein similarity score o'rniga, TF-IDF yoki oddiy Cosine Similarity algoritmini JavaScriptda yozib ber. Bu algoritmni `findSimilarKnowledge` funksiyasiga qanday integratsiya qilishni ko'rsat."*

### 6.3. Front-endga funksiya qo'shish (Jonli suhbat paneli)
> *"`ConversationsPage.jsx` va `AppContext.jsx` front-end fayllarida mijoz suhbatini AI-dan Inson operatoriga o'tkazish tugmasini bosganda ishlaydigan API integratsiyasini yozib ber. UI chiroyli glassmorphism dizaynida bo'lsin."*
