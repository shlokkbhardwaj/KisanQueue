/**
 * KisanQueue Voice Assistant
 * ==========================
 * A pluggable, multilingual voice-assistant layer for the existing static
 * KisanQueue frontend. Designed to be dropped into ANY farmer-facing page
 * with two lines:
 *
 *   <link rel="stylesheet" href="voice-assistant.css">
 *   <script src="voice-assistant.js"></script>
 *   <script>KisanVoice.init();</script>
 *
 * ARCHITECTURE (matches the required abstraction layer):
 *
 *   Mic tap
 *     -> SpeechToTextService      (real: browser Web Speech API)
 *     -> LanguageService          (selected/detected language, script hints)
 *     -> FarmerIntentService      (mock: rule-based NLU -> intent + entities)
 *     -> VoiceCommandService      (real: performs in-app actions / navigation)
 *     -> ResponseService          (mock: farmer-friendly templated replies)
 *     -> TextToSpeechService      (real: browser Web Speech Synthesis API)
 *
 * Every service below is a small object with a fixed method contract so any
 * one of them can be swapped for a real backend/cloud API later WITHOUT
 * touching the others. Search for "INTEGRATION POINT" to find every place a
 * production API would plug in.
 *
 * WHAT IS REAL vs MOCKED (see full breakdown at the bottom of this file
 * and in VOICE_ASSISTANT_README.md):
 *   REAL   - speech recognition & speech synthesis (browser-native, no keys)
 *   REAL   - the rule-based Hindi/English/Hinglish intent & entity parser
 *   REAL   - centres, accepted crops, tokens, queue position, payment records, cancel (backend API via
 *            DataService; needs the farmer to be logged in for the personal ones)
 *   NOT AVAILABLE - market prices and transport cost: there is no data source, so the assistant says so
 */

(function (global) {
  'use strict';

  /* ===================================================================
   * 1. LANGUAGE CONFIG
   * Every language the product wants to support is listed here, with an
   * HONEST status flag. Nothing here fakes support:
   *   - "voice"     : browser speech recognition is known to work for this
   *                   BCP-47 tag in current Chrome/Android (real mic input).
   *   - "text-only" : no reliable browser speech recognition exists for this
   *                   language today. The farmer can still pick it and type,
   *                   but the mic button is disabled with an honest message.
   * TTS availability is NOT assumed from this table — it is re-checked live
   * against speechSynthesis.getVoices() on the farmer's own device, because
   * installed voice packs vary by phone/OS even within a "voice" language.
   * =================================================================== */
  var LANGUAGES = [
    { code: 'hi-IN', name: 'हिन्दी',   engName: 'Hindi',     sttMode: 'voice' },
    { code: 'en-IN', name: 'English',  engName: 'English',   sttMode: 'voice' },
    { code: 'bn-IN', name: 'বাংলা',    engName: 'Bengali',   sttMode: 'voice' },
    { code: 'mr-IN', name: 'मराठी',    engName: 'Marathi',   sttMode: 'voice' },
    { code: 'gu-IN', name: 'ગુજરાતી', engName: 'Gujarati',  sttMode: 'voice' },
    { code: 'pa-IN', name: 'ਪੰਜਾਬੀ',  engName: 'Punjabi',   sttMode: 'voice' },
    { code: 'ta-IN', name: 'தமிழ்',    engName: 'Tamil',     sttMode: 'voice' },
    { code: 'te-IN', name: 'తెలుగు',   engName: 'Telugu',    sttMode: 'voice' },
    { code: 'kn-IN', name: 'ಕನ್ನಡ',   engName: 'Kannada',   sttMode: 'voice' },
    { code: 'ml-IN', name: 'മലയാളം',  engName: 'Malayalam', sttMode: 'voice' },
    // Planned: no dependable browser speech-recognition support today.
    // Kept in the picker as text-input languages so the roadmap is honest
    // and visible, per product requirement — never silently promoted to
    // "voice" just because the farmer picked them.
    { code: 'bho-IN', name: 'भोजपुरी', engName: 'Bhojpuri',  sttMode: 'text-only', note: 'Parsed using the Hindi keyword set (shared agricultural vocabulary) until a dedicated Bhojpuri model is available.' },
    { code: 'or-IN',  name: 'ଓଡ଼ିଆ',   engName: 'Odia',      sttMode: 'text-only', note: 'Needs a cloud ASR/TTS provider such as Bhashini or Google Cloud Speech.' },
    { code: 'as-IN',  name: 'অসমীয়া', engName: 'Assamese',  sttMode: 'text-only', note: 'Needs a cloud ASR/TTS provider such as Bhashini or Google Cloud Speech.' }
  ];

  function getLangConfig(code) {
    return LANGUAGES.filter(function (l) { return l.code === code; })[0] || LANGUAGES[0];
  }

  /* ===================================================================
   * 2. FARMER PROFILE (local, works offline)
   * Stands in for a real farmer-profile API. Selected language, last
   * booking/token and a tiny bit of state are cached in localStorage so
   * the assistant still "remembers" the farmer with no network at all.
   * INTEGRATION POINT: replace get()/set() bodies with real profile
   * API calls; keep the same method names so nothing else changes.
   * =================================================================== */
  var FarmerProfileService = {
    KEY: 'kisanQueueFarmerProfile',
    get: function () {
      try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; }
      catch (e) { return {}; }
    },
    set: function (patch) {
      var p = this.get();
      for (var k in patch) { if (patch.hasOwnProperty(k)) p[k] = patch[k]; }
      try { localStorage.setItem(this.KEY, JSON.stringify(p)); } catch (e) {}
      return p;
    },
    getLanguage: function () { return this.get().language || null; },
    setLanguage: function (code) { this.set({ language: code }); }
  };

  /* ===================================================================
   * 3. SPEECH-TO-TEXT SERVICE (REAL — browser Web Speech API)
   * INTEGRATION POINT: to move to a cloud ASR (needed for Bhojpuri/Odia/
   * Assamese, or for better accuracy/offline support), replace start()
   * with a call that streams mic audio to that provider and calls the
   * same onResult/onError/onEnd callbacks. Nothing else in this file
   * needs to change.
   * =================================================================== */
  var SpeechToTextService = (function () {
    var RecognitionCtor = global.SpeechRecognition || global.webkitSpeechRecognition;
    var recognizer = null;

    return {
      isBrowserSupported: function () { return !!RecognitionCtor; },
      // Only "voice" languages ever reach here; text-only languages use
      // the typed-input fallback in the UI layer instead.
      start: function (langCode, handlers) {
        if (!RecognitionCtor) {
          handlers.onError && handlers.onError('no-speech-api');
          return;
        }
        if (!global.isSecureContext && location.hostname !== 'localhost') {
          // Web Speech API requires HTTPS (or localhost) in modern browsers.
          handlers.onError && handlers.onError('insecure-context');
          return;
        }
        try {
          recognizer = new RecognitionCtor();
          recognizer.lang = langCode;
          recognizer.interimResults = true;
          recognizer.maxAlternatives = 1;
          recognizer.continuous = false;

          recognizer.onresult = function (evt) {
            var last = evt.results[evt.results.length - 1];
            var transcript = last[0].transcript;
            var confidence = typeof last[0].confidence === 'number' ? last[0].confidence : 0.6;
            handlers.onResult && handlers.onResult({
              transcript: transcript,
              isFinal: last.isFinal,
              confidence: confidence
            });
          };
          recognizer.onerror = function (evt) {
            // Common evt.error values: 'no-speech', 'audio-capture',
            // 'not-allowed' (permission denied), 'network', 'language-not-supported'
            handlers.onError && handlers.onError(evt.error || 'unknown');
          };
          recognizer.onend = function () { handlers.onEnd && handlers.onEnd(); };
          recognizer.start();
        } catch (e) {
          handlers.onError && handlers.onError('start-failed');
        }
      },
      stop: function () { if (recognizer) { try { recognizer.stop(); } catch (e) {} } }
    };
  })();

  /* ===================================================================
   * 4. TEXT-TO-SPEECH SERVICE (REAL — browser Speech Synthesis API)
   * Voice availability is checked live per device; if no matching voice
   * exists we degrade gracefully to text-only (never silently stay
   * "silent" without telling the UI layer).
   * INTEGRATION POINT: swap speak() for a cloud TTS call (needed for
   * guaranteed voices in every language) while keeping the callback shape.
   * =================================================================== */
  var TextToSpeechService = (function () {
    var voicesCache = [];
    function refreshVoices() {
      if (global.speechSynthesis) voicesCache = global.speechSynthesis.getVoices() || [];
    }
    if (global.speechSynthesis) {
      refreshVoices();
      global.speechSynthesis.onvoiceschanged = refreshVoices;
    }
    function findVoice(langCode) {
      var short = langCode.split('-')[0];
      var exact = voicesCache.filter(function (v) { return v.lang === langCode; })[0];
      if (exact) return exact;
      return voicesCache.filter(function (v) { return v.lang && v.lang.indexOf(short) === 0; })[0] || null;
    }
    return {
      isBrowserSupported: function () { return !!global.speechSynthesis; },
      hasVoiceFor: function (langCode) { return !!findVoice(langCode); },
      speak: function (text, langCode, onEnd) {
        if (!global.speechSynthesis) { onEnd && onEnd(false); return; }
        var voice = findVoice(langCode);
        if (!voice) { onEnd && onEnd(false); return; } // caller falls back to text-only
        try {
          global.speechSynthesis.cancel();
          var utter = new SpeechSynthesisUtterance(text);
          utter.voice = voice;
          utter.lang = voice.lang;
          utter.rate = 0.95;
          utter.onend = function () { onEnd && onEnd(true); };
          utter.onerror = function () { onEnd && onEnd(false); };
          global.speechSynthesis.speak(utter);
        } catch (e) { onEnd && onEnd(false); }
      },
      cancel: function () { if (global.speechSynthesis) global.speechSynthesis.cancel(); }
    };
  })();

  /* ===================================================================
   * 5. DATA SERVICE — REAL backend data (replaces the old demo MOCK_DB).
   * Talks to the same API as the farmer pages, through the shared KQ helper (kq-app.js):
   *   GET /api/crops, GET /api/mandis?cropId=&includeCrops=true   (public)
   *   GET /api/bookings/mine, /api/queue/status, /api/payments/farmer/:id,
   *   POST /api/bookings/:id/cancel                                (need the farmer to be logged in)
   * Nothing is invented: when the backend has no data the assistant says so.
   * =================================================================== */
  var DataService = (function () {
    var cropsCache = null;

    function K() { return global.KQ || null; }

    function api(path, opts) {
      if (!K()) return Promise.reject({ kind: 'network', message: 'kq-app.js is not loaded on this page' });
      return K().api(path, opts);
    }

    var service = {
      isLoggedIn: function () { return !!(K() && K().isLoggedIn()); },

      getCrops: function () {
        if (cropsCache) return Promise.resolve(cropsCache);
        return api('/crops', { auth: false }).then(function (res) {
          cropsCache = (res.data || []).filter(function (c) { return c.active !== false; });
          return cropsCache;
        });
      },

      // NLU crop keys are lower-case crop names (wheat, rice, maize, mustard).
      cropByKey: function (key) {
        return service.getCrops().then(function (list) {
          return list.filter(function (c) { return String(c.name).toLowerCase() === key; })[0] || null;
        });
      },

      // Centres that accept the crop (or all centres). Sorted by distance only if the page already has a location.
      findMandis: function (cropKey) {
        return (cropKey ? service.cropByKey(cropKey) : Promise.resolve(null)).then(function (crop) {
          if (cropKey && !crop) return [];            // this crop is not in the database
          var path = '/mandis?includeCrops=true' + (crop ? '&cropId=' + encodeURIComponent(crop.id) : '');
          var loc = K() && K().lastLocation;
          if (loc) path += '&lat=' + encodeURIComponent(loc.latitude) + '&lng=' + encodeURIComponent(loc.longitude) + '&radiusKm=20000';
          return api(path, { auth: false }).then(function (res) { return res.data || []; });
        });
      },

      getCurrentBooking: function () {
        return api('/bookings/mine').then(function (res) { return K().pickCurrentBooking(res.data); });
      },

      getQueueStatus: function (bookingId) {
        return api('/queue/status?bookingId=' + encodeURIComponent(bookingId));
      },

      getPayments: function () {
        var farmer = K().getFarmer();
        return api('/payments/farmer/' + encodeURIComponent(farmer.id)).then(function (res) { return res.data || []; });
      },

      cancelBooking: function (bookingId) {
        return api('/bookings/' + encodeURIComponent(bookingId) + '/cancel', { method: 'POST' });
      },

      // Pre-fills the booking page (page03) with what the farmer just said.
      rememberBookingIntent: function (crop, quantity) {
        var farmer = K() && K().getFarmer();
        if (!farmer || !crop) return;
        try {
          localStorage.setItem('Kisan Queue_booking_preferences', JSON.stringify({
            farmer_id: farmer.id, crop_id: crop.id, crop_name: crop.name, quantity_quintals: quantity || undefined
          }));
        } catch (e) { /* storage blocked */ }
      }
    };
    return service;
  })();

  function escapeText(value) {
    return String(value === null || value === undefined ? '' : value);
  }

  /* ===================================================================
   * 6. FARMER INTENT SERVICE (rule-based NLU — REAL but intentionally
   * simple; this is the mock/placeholder for a production LLM or NLU
   * service). It is deliberately isolated behind ONE method — parse() —
   * so a real intent-classification API can replace the body later
   * without touching VoiceCommandService at all.
   *
   * Coverage is honest, not uniform:
   *  - Hindi / Bhojpuri (shares Hindi vocabulary) / English / Hinglish
   *    code-switching: full intent + entity coverage.
   *  - Bengali / Marathi / Gujarati / Punjabi / Tamil / Telugu / Kannada /
   *    Malayalam: core-intent keyword coverage (sell crop, price, payment,
   *    queue/token, help, yes/no) — enough for the required demo, not a
   *    full natural-language parser. See README for what production needs.
   * =================================================================== */
  var FarmerIntentService = (function () {

    // Keys are the lower-case crop names used by the database (Wheat, Rice, Maize, Mustard).
    var CROP_WORDS = {
      wheat:   ['gehu', 'gehun', 'wheat', 'गेहूं', 'गेहूँ', 'गेहू', 'গম', 'गहू', 'ઘઉં', 'ਕਣਕ', 'கோதுமை', 'గోధుమ', 'ಗೋಧಿ', 'ഗോതമ്പ്'],
      rice:    ['chawal', 'dhan', 'paddy', 'rice', 'चावल', 'धान', 'ধান', 'भात', 'ડાંગર', 'ਝੋਨਾ', 'நெல்', 'వరి', 'ಭತ್ತ', 'നെല്ല്'],
      maize:   ['makka', 'makai', 'maize', 'corn', 'मक्का', 'मकई', 'ভুট্টা', 'मका', 'મકાઈ', 'ਮੱਕੀ', 'மக்காச்சோளம்', 'మొక్కజొన్న', 'ಮೆಕ್ಕೆಜೋಳ', 'ചോളം'],
      mustard: ['sarso', 'sarson', 'mustard', 'सरसों', 'सरसो', 'সরিষা', 'मोहरी', 'રાઈ', 'ਸਰੋਂ', 'கடுகு', 'ఆవాలు', 'ಸಾಸಿವೆ', 'കടുക്']
    };

    var YES_WORDS = ['haan', 'ha', 'yes', 'ji haan', 'हाँ', 'हां', 'जी हाँ', 'ঠিক আছে', 'হ্যাঁ', 'हो', 'हा', 'હા', 'ਹਾਂ', 'ஆம்', 'అవును', 'ಹೌದು', 'അതെ'];
    var NO_WORDS  = ['nahi', 'nahin', 'no', 'नहीं', 'ना', 'না', 'नको', 'ना', 'ना', 'ਨਹੀਂ', 'இல்லை', 'కాదు', 'ಇಲ್ಲ', 'ഇല്ല'];

    // Keyword groups per intent. English + Hindi/Hinglish carry the bulk of
    // real coverage (per the spec's worked examples); a handful of common
    // words are added for the other supported languages for the core
    // intents so the "at least one additional Indian language" demo works
    // end-to-end, not just for Hindi/English.
    var INTENT_KEYWORDS = {
      SELL_CROP:               ['bechna', 'bechne', 'sell', 'बेचना', 'बेचने', 'बेचनी', 'বিক্রি', 'विकणे', 'विकायचे', 'વેચવું', 'ਵੇਚਣਾ', 'விற்க', 'అమ్మ', 'ಮಾರ', 'വിൽക്ക'],
      FIND_MANDI:               ['mandi', 'kaunsi mandi', 'nearby mandi', 'मंडी', 'मंडियां', 'पास', 'কাছে', 'मंडयें', 'বাজার'],
      CHECK_CROP_ACCEPTANCE:    ['leta hai', 'liya jata', 'accept', 'lete hain', 'लिया जाता', 'लेते हैं', 'स्वीकार'],
      COMPARE_MANDIS:           ['tulna', 'compare', 'comparison', 'तुलना', 'दोनों', 'তুলনা'],
      CHECK_PRICE:              ['rate', 'bhaav', 'bhav', 'price', 'भाव', 'दर', 'रेट', 'দর', 'भाव', 'ભાવ', 'ਭਾਅ', 'விலை', 'ధర', 'ಬೆಲೆ', 'വില'],
      CALCULATE_TRANSPORT_COST: ['transport', 'bhada', 'bhaada', 'भाड़ा', 'किराया', 'পরিবহন'],
      CHECK_QUEUE:              ['queue', 'wait', 'intezar', 'kitna time', 'इंतजार', 'कतार', 'नंबर कब', 'অপেক্ষা'],
      GET_TOKEN:                ['token', 'टोकन', 'नंबर', 'টোকেন'],
      CHECK_PAYMENT:            ['payment', 'paisa', 'paise', 'पेमेंट', 'भुगतान', 'पैसा', 'পেমেন্ট', 'টাকা', 'ચુકવણી', 'ਭੁਗਤਾਨ', 'கட்டணம்', 'చెల్లింపు', 'ಪಾವತಿ', 'പണം'],
      VIEW_TRANSACTION_HISTORY: ['history', 'purana', 'pichla', 'इतिहास', 'पुराना', 'পুরনো'],
      CANCEL_TOKEN:             ['cancel', 'radd', 'रद्द', 'कैंसिल', 'বাতিল'],
      HELP:                     ['help', 'madad', 'मदद', 'सहायता', 'সাহায্য', 'मदत', 'મદદ', 'ਮਦਦ', 'உதவி', 'సహాయం', 'ಸಹಾಯ', 'സഹായം'],
      CHANGE_LANGUAGE:          ['language badlo', 'bhasha', 'भाषा', 'ভাষা', 'भाषा', 'ભાષા', 'ਭਾਸ਼ਾ', 'மொழி', 'భాష', 'ಭಾಷೆ', 'ഭാഷ'],
      NAV_HOME:                 ['home kholo', 'home', 'होम खोलो', 'होम'],
      NAV_BACK:                 ['peeche jao', 'back', 'पीछे जाओ', 'पीछे'],
      NAV_SHOW_MANDI:           ['mandi dikhao', 'मंडी दिखाओ'],
      NAV_SHOW_PAYMENT:         ['payment dikhao', 'पेमेंट दिखाओ'],
      NAV_SHOW_TOKEN:           ['mera token batao', 'मेरा टोकन बताओ'],
      NAV_NEXT_MANDI:           ['dusri mandi dikhao', 'दूसरी मंडी दिखाओ']
    };

    // Order matters: more specific intents are tested before generic ones.
    var INTENT_ORDER = [
      'CANCEL_TOKEN', 'COMPARE_MANDIS', 'CHECK_CROP_ACCEPTANCE', 'CALCULATE_TRANSPORT_COST',
      'CHECK_PRICE', 'CHECK_PAYMENT', 'VIEW_TRANSACTION_HISTORY', 'GET_TOKEN', 'CHECK_QUEUE',
      'NAV_NEXT_MANDI', 'NAV_SHOW_MANDI', 'NAV_SHOW_PAYMENT', 'NAV_SHOW_TOKEN', 'NAV_HOME', 'NAV_BACK',
      'FIND_MANDI', 'SELL_CROP', 'CHANGE_LANGUAGE', 'HELP'
    ];

    function normalize(text) { return (text || '').toLowerCase().trim(); }

    // Splits into whitespace/punctuation-separated tokens so short keywords
    // (e.g. "ना" = no, "हा" = yes) can't false-match inside a longer word
    // (e.g. "बेचना", "रहा") the way a plain substring search would.
    function tokenize(text) { return text.split(/[\s,.!?।٫،]+/).filter(Boolean); }

    function containsKeyword(text, tokens, keyword) {
      var kw = keyword.toLowerCase();
      if (kw.indexOf(' ') !== -1) return text.indexOf(kw) !== -1; // multi-word phrase: substring is safe
      return tokens.indexOf(kw) !== -1; // single word: require an exact token match
    }

    function findCrop(text, tokens) {
      for (var crop in CROP_WORDS) {
        if (!CROP_WORDS.hasOwnProperty(crop)) continue;
        for (var i = 0; i < CROP_WORDS[crop].length; i++) {
          if (containsKeyword(text, tokens, CROP_WORDS[crop][i])) return crop;
        }
      }
      return null;
    }

    function findQuantity(text) {
      // Matches "35 quintal", "35 क्विंटल", "35 kuintal", plain "35" near a crop word.
      var m = text.match(/(\d+(\.\d+)?)\s*(quintal|quintals|kuintal|क्विंटल|क्विंटलों?|கிவிண்டல்|క్వింటాల్|ಕ್ವಿಂಟಲ್|ക്വിന്റൽ)?/);
      return m ? parseFloat(m[1]) : null;
    }

    function findYesNo(text, tokens) {
      for (var i = 0; i < YES_WORDS.length; i++) if (containsKeyword(text, tokens, YES_WORDS[i])) return true;
      for (var i2 = 0; i2 < NO_WORDS.length; i2++) if (containsKeyword(text, tokens, NO_WORDS[i2])) return false;
      return null;
    }

    function matchIntent(text, tokens) {
      var scores = {};
      for (var i = 0; i < INTENT_ORDER.length; i++) {
        var intent = INTENT_ORDER[i];
        var words = INTENT_KEYWORDS[intent] || [];
        for (var j = 0; j < words.length; j++) {
          if (containsKeyword(text, tokens, words[j])) {
            scores[intent] = (scores[intent] || 0) + 1;
          }
        }
      }
      var best = null, bestScore = 0;
      for (var k = 0; k < INTENT_ORDER.length; k++) {
        var intentName = INTENT_ORDER[k];
        if (scores[intentName] > bestScore) { best = intentName; bestScore = scores[intentName]; }
      }
      return { intent: best, score: bestScore };
    }

    return {
      /**
       * parse(text, langCode) -> {
       *   intent: string|null,     // one of the fixed intent names, or null
       *   entities: { crop, quantity, yesNo },
       *   confidence: 0..1
       * }
       * INTEGRATION POINT: this whole function body is the swap target for
       * a real multilingual LLM/NLU intent-and-slot-extraction service.
       */
      parse: function (text, langCode) {
        var norm = normalize(text);
        var tokens = tokenize(norm);
        var crop = findCrop(norm, tokens);
        var quantity = findQuantity(norm);
        var yesNo = findYesNo(norm, tokens);
        var match = matchIntent(norm, tokens);

        var confidence = 0;
        if (match.intent) confidence += 0.5;
        if (crop) confidence += 0.2;
        if (quantity !== null) confidence += 0.2;
        if (!match.intent && (crop || quantity !== null)) {
          // A bare "35 quintal gehun" with no verb still clearly means SELL_CROP.
          match.intent = 'SELL_CROP';
          confidence += 0.3;
        }
        confidence = Math.min(confidence, 0.95);

        return {
          intent: match.intent,
          entities: { crop: crop, quantity: quantity, yesNo: yesNo },
          confidence: confidence,
          rawText: text
        };
      }
    };
  })();

  /* ===================================================================
   * 7. RESPONSE TEMPLATES (farmer-friendly, short, per language).
   * Complete sets: Hindi, English, Bengali, Marathi, Gujarati, Punjabi, Tamil, Telugu, Kannada,
   * Malayalam and Bhojpuri. Odia and Assamese have no reply set yet and fall back to Hindi text
   * (never to raw English technical text). All non-Hindi/English sets were written without a native
   * reviewer: have native speakers check them before a public launch.
   * =================================================================== */
  var STRINGS = {
    'hi-IN': {
      askCrop: "कौन सी फसल बेचनी है?",
      askQuantity: "कितनी क्विंटल है?",
      searching: "आपके पास {qty} क्विंटल {crop} है। मैं इसे खरीदने वाले केंद्र देख रहा हूं।",
      mandiFound_one: "एक केंद्र मिला है।",
      mandiFound_many: "{n} केंद्र मिले हैं। क्या आप तुलना करना चाहते हैं?",
      mandiNone: "माफ़ करें, अभी इस फसल के लिए कोई खरीद केंद्र नहीं मिला।",
      accept_yes: "हाँ, यहाँ {crop} लिया जाता है।",
      accept_no: "नहीं, यहाँ {crop} स्वीकार नहीं किया जाता।",
      distance: "सबसे पास का केंद्र {name} लगभग {km} किलोमीटर दूर है।",
      distanceUnknown: "दूरी जानने के लिए \"केंद्र खोजें\" पेज पर \"मेरी लोकेशन\" दबाएं। भाड़े का अनुमान अभी उपलब्ध नहीं है।",
      priceUnavailable: "मंडी भाव की जानकारी अभी इस ऐप में उपलब्ध नहीं है। कृपया केंद्र से पूछें।",
      queueNone: "आपका अभी कोई टोकन नहीं है। क्या आप स्लॉट बुक करना चाहते हैं?",
      queueStatus: "आपका टोकन {token} है। आपसे पहले {ahead} टोकन हैं।",
      queueWait: " अनुमानित प्रतीक्षा लगभग {wait} मिनट है।",
      queueWaitUnknown: " अनुमानित समय अभी उपलब्ध नहीं है।",
      paymentCredited: "आपकी {crop} की बिक्री का ₹{amount} भुगतान {date} को हो चुका है।",
      paymentProcessing: "आपकी {crop} की बिक्री का भुगतान अभी प्रक्रिया में है।",
      paymentFailed: "आपकी {crop} के भुगतान में समस्या आई है। कृपया केंद्र से संपर्क करें।",
      paymentNone: "आपके नाम पर अभी कोई भुगतान रिकॉर्ड नहीं मिला।",
      historyIntro: "ये आपके भुगतान रिकॉर्ड हैं।",
      cancelConfirm: "क्या आप अपना टोकन रद्द करना चाहते हैं?",
      cancelDone: "आपकी बुकिंग और टोकन रद्द कर दिए गए हैं।",
      cancelKeep: "ठीक है, टोकन रद्द नहीं किया गया।",
      tokenNotCancellable: "यह टोकन अब रद्द नहीं हो सकता। कृपया केंद्र से संपर्क करें।",
      help: "आप बोल सकते हैं जैसे: \"गेहूं बेचना है\", \"मेरा पेमेंट आया क्या\", \"मेरा टोकन बताओ\"।",
      unclear: "मुझे ठीक से समझ नहीं आया। क्या आप फसल बेचने के बारे में पूछ रहे हैं?",
      noMic: "माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया अनुमति दें या टाइप करें।",
      noSpeechApi: "इस ब्राउज़र में आवाज़ पहचानने की सुविधा उपलब्ध नहीं है। कृपया टाइप करें।",
      network: "इंटरनेट कमज़ोर लग रहा है। कृपया दोबारा कोशिश करें।",
      languagePicked: "ठीक है, अब मैं हिन्दी में बात करूंगा।",
      loginNeeded: "यह जानकारी देखने के लिए पहले लॉगिन करें।",
      backendError: "अभी जानकारी नहीं मिल पाई। कृपया थोड़ी देर बाद कोशिश करें।"
    },
    'en-IN': {
      askCrop: "Which crop would you like to sell?",
      askQuantity: "How many quintals?",
      searching: "You have {qty} quintals of {crop}. Looking for centres that buy it.",
      mandiFound_one: "Found one centre.",
      mandiFound_many: "Found {n} centres. Want to compare them?",
      mandiNone: "Sorry, no procurement centre accepts this crop right now.",
      accept_yes: "Yes, {crop} is accepted here.",
      accept_no: "No, {crop} is not accepted here.",
      distance: "The nearest centre, {name}, is about {km} km away.",
      distanceUnknown: "To see distances, press \"Use my location\" on the Find centre page. A transport cost estimate is not available yet.",
      priceUnavailable: "Market price information is not available in this app yet. Please ask the centre.",
      queueNone: "You do not have an active token yet. Would you like to book a slot?",
      queueStatus: "Your token is {token}. There are {ahead} tokens ahead of you.",
      queueWait: " Estimated wait is about {wait} minutes.",
      queueWaitUnknown: " An estimated wait time is not available yet.",
      paymentCredited: "Your payment of ₹{amount} for {crop} was credited on {date}.",
      paymentProcessing: "Your payment for {crop} is still being processed.",
      paymentFailed: "There was a problem with your payment for {crop}. Please contact the centre.",
      paymentNone: "No payment record found for you yet.",
      historyIntro: "Here are your payment records.",
      cancelConfirm: "Do you want to cancel your token?",
      cancelDone: "Your booking and token have been cancelled.",
      cancelKeep: "Okay, your token was not cancelled.",
      tokenNotCancellable: "This token can no longer be cancelled. Please contact the centre.",
      help: "Try saying: \"I want to sell wheat\", \"Has my payment come?\", \"What is my token?\"",
      unclear: "I did not quite catch that. Are you asking about selling a crop?",
      noMic: "Microphone permission was not granted. Please allow it or type instead.",
      noSpeechApi: "Voice recognition is not available in this browser. Please type instead.",
      network: "Your connection seems weak. Please try again.",
      languagePicked: "Okay, I will speak in English now.",
      loginNeeded: "Please log in first to see this information.",
      backendError: "I could not get the information right now. Please try again in a little while."
    },
    'bn-IN': {
      askCrop: "কোন ফসল বিক্রি করতে চান?",
      askQuantity: "কত কুইন্টাল আছে?",
      searching: "আপনার কাছে {qty} কুইন্টাল {crop} আছে। যেসব কেন্দ্র এটি কেনে সেগুলো খুঁজছি।",
      mandiFound_one: "একটি কেন্দ্র পাওয়া গেছে।",
      mandiFound_many: "{n}টি কেন্দ্র পাওয়া গেছে। তুলনা করতে চান?",
      mandiNone: "দুঃখিত, এই ফসলের জন্য এখন কোনো ক্রয়কেন্দ্র পাওয়া যায়নি।",
      accept_yes: "হ্যাঁ, এখানে {crop} নেওয়া হয়।",
      accept_no: "না, এখানে {crop} নেওয়া হয় না।",
      distance: "সবচেয়ে কাছের কেন্দ্র {name} প্রায় {km} কিলোমিটার দূরে।",
      distanceUnknown: "দূরত্ব জানতে \"কেন্দ্র খুঁজুন\" পাতায় \"আমার অবস্থান\" চাপুন। ভাড়ার আনুমানিক হিসাব এখনও নেই।",
      priceUnavailable: "বাজারদরের তথ্য এখনও এই অ্যাপে নেই। অনুগ্রহ করে কেন্দ্রে জিজ্ঞাসা করুন।",
      queueNone: "আপনার এখন কোনো টোকেন নেই। স্লট বুক করতে চান?",
      queueStatus: "আপনার টোকেন {token}। আপনার আগে {ahead}টি টোকেন আছে।",
      queueWait: " আনুমানিক অপেক্ষা প্রায় {wait} মিনিট।",
      queueWaitUnknown: " আনুমানিক সময় এখনও জানা নেই।",
      paymentCredited: "আপনার {crop} বিক্রির ₹{amount} {date} তারিখে জমা হয়েছে।",
      paymentProcessing: "আপনার {crop} বিক্রির টাকা এখনও প্রক্রিয়াধীন।",
      paymentFailed: "আপনার {crop} এর পেমেন্টে সমস্যা হয়েছে। অনুগ্রহ করে কেন্দ্রের সঙ্গে যোগাযোগ করুন।",
      paymentNone: "আপনার নামে এখনও কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।",
      historyIntro: "এগুলো আপনার পেমেন্ট রেকর্ড।",
      cancelConfirm: "আপনি কি আপনার টোকেন বাতিল করতে চান?",
      cancelDone: "আপনার বুকিং ও টোকেন বাতিল করা হয়েছে।",
      cancelKeep: "ঠিক আছে, টোকেন বাতিল করা হয়নি।",
      tokenNotCancellable: "এই টোকেন আর বাতিল করা যাবে না। অনুগ্রহ করে কেন্দ্রের সঙ্গে যোগাযোগ করুন।",
      help: "আপনি বলতে পারেন: \"গম বিক্রি করতে চাই\", \"আমার পেমেন্ট এসেছে?\", \"আমার টোকেন কত?\"",
      unclear: "ঠিক বুঝতে পারিনি। আপনি কি ফসল বিক্রির কথা জিজ্ঞাসা করছেন?",
      noMic: "মাইক্রোফোনের অনুমতি পাওয়া যায়নি। অনুমতি দিন বা টাইপ করুন।",
      noSpeechApi: "এই ব্রাউজারে কণ্ঠস্বর শনাক্তকরণ নেই। অনুগ্রহ করে টাইপ করুন।",
      network: "ইন্টারনেট দুর্বল মনে হচ্ছে। আবার চেষ্টা করুন।",
      languagePicked: "ঠিক আছে, এখন আমি বাংলায় কথা বলব।",
      loginNeeded: "এই তথ্য দেখতে আগে লগইন করুন।",
      backendError: "এখন তথ্য পাওয়া যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
    },
    'mr-IN': {
      askCrop: "कोणते पीक विकायचे आहे?",
      askQuantity: "किती क्विंटल आहे?",
      searching: "तुमच्याकडे {qty} क्विंटल {crop} आहे. ते खरेदी करणारी केंद्रे शोधत आहे.",
      mandiFound_one: "एक केंद्र सापडले.",
      mandiFound_many: "{n} केंद्रे सापडली. तुलना करायची आहे का?",
      mandiNone: "क्षमस्व, या पिकासाठी सध्या कोणतेही खरेदी केंद्र सापडले नाही.",
      accept_yes: "होय, इथे {crop} घेतले जाते.",
      accept_no: "नाही, इथे {crop} घेतले जात नाही.",
      distance: "सर्वात जवळचे केंद्र {name} सुमारे {km} किलोमीटर दूर आहे.",
      distanceUnknown: "अंतर पाहण्यासाठी \"केंद्र शोधा\" पानावर \"माझे स्थान\" दाबा. भाड्याचा अंदाज अजून उपलब्ध नाही.",
      priceUnavailable: "बाजारभावाची माहिती अजून या अ‍ॅपमध्ये नाही. कृपया केंद्राला विचारा.",
      queueNone: "तुमच्याकडे सध्या टोकन नाही. स्लॉट बुक करायचा आहे का?",
      queueStatus: "तुमचे टोकन {token} आहे. तुमच्या आधी {ahead} टोकन आहेत.",
      queueWait: " अंदाजे प्रतीक्षा सुमारे {wait} मिनिटे.",
      queueWaitUnknown: " अंदाजे वेळ अजून उपलब्ध नाही.",
      paymentCredited: "तुमच्या {crop} विक्रीचे ₹{amount} {date} रोजी जमा झाले आहेत.",
      paymentProcessing: "तुमच्या {crop} विक्रीचे पैसे अजून प्रक्रियेत आहेत.",
      paymentFailed: "तुमच्या {crop} च्या पेमेंटमध्ये अडचण आली आहे. कृपया केंद्राशी संपर्क साधा.",
      paymentNone: "तुमच्या नावावर अजून कोणतेही पेमेंट रेकॉर्ड सापडले नाही.",
      historyIntro: "हे तुमचे पेमेंट रेकॉर्ड आहेत.",
      cancelConfirm: "तुम्हाला तुमचे टोकन रद्द करायचे आहे का?",
      cancelDone: "तुमचे बुकिंग आणि टोकन रद्द केले आहे.",
      cancelKeep: "ठीक आहे, टोकन रद्द केले नाही.",
      tokenNotCancellable: "हे टोकन आता रद्द करता येणार नाही. कृपया केंद्राशी संपर्क साधा.",
      help: "तुम्ही म्हणू शकता: \"गहू विकायचा आहे\", \"माझे पेमेंट आले का?\", \"माझे टोकन सांगा\"",
      unclear: "मला नीट समजले नाही. तुम्ही पीक विकण्याबद्दल विचारत आहात का?",
      noMic: "मायक्रोफोनची परवानगी मिळाली नाही. कृपया परवानगी द्या किंवा टाइप करा.",
      noSpeechApi: "या ब्राउझरमध्ये आवाज ओळखण्याची सुविधा नाही. कृपया टाइप करा.",
      network: "इंटरनेट कमकुवत वाटत आहे. कृपया पुन्हा प्रयत्न करा.",
      languagePicked: "ठीक आहे, आता मी मराठीत बोलेन.",
      loginNeeded: "ही माहिती पाहण्यासाठी आधी लॉगिन करा.",
      backendError: "सध्या माहिती मिळू शकली नाही. कृपया थोड्या वेळाने प्रयत्न करा."
    },
    'gu-IN': {
      askCrop: "કયો પાક વેચવો છે?",
      askQuantity: "કેટલા ક્વિન્ટલ છે?",
      searching: "તમારી પાસે {qty} ક્વિન્ટલ {crop} છે. તે ખરીદતાં કેન્દ્રો શોધી રહ્યો છું.",
      mandiFound_one: "એક કેન્દ્ર મળ્યું છે.",
      mandiFound_many: "{n} કેન્દ્રો મળ્યાં છે. સરખામણી કરવી છે?",
      mandiNone: "માફ કરશો, આ પાક માટે હાલમાં કોઈ ખરીદ કેન્દ્ર મળ્યું નથી.",
      accept_yes: "હા, અહીં {crop} લેવામાં આવે છે.",
      accept_no: "ના, અહીં {crop} લેવામાં આવતું નથી.",
      distance: "સૌથી નજીકનું કેન્દ્ર {name} લગભગ {km} કિલોમીટર દૂર છે.",
      distanceUnknown: "અંતર જાણવા \"કેન્દ્ર શોધો\" પેજ પર \"મારું સ્થાન\" દબાવો. ભાડાનો અંદાજ હજી ઉપલબ્ધ નથી.",
      priceUnavailable: "બજારભાવની માહિતી હજી આ એપમાં ઉપલબ્ધ નથી. કૃપા કરીને કેન્દ્રને પૂછો.",
      queueNone: "તમારી પાસે હાલમાં કોઈ ટોકન નથી. સ્લોટ બુક કરવો છે?",
      queueStatus: "તમારો ટોકન {token} છે. તમારી આગળ {ahead} ટોકન છે.",
      queueWait: " અંદાજિત રાહ લગભગ {wait} મિનિટ છે.",
      queueWaitUnknown: " અંદાજિત સમય હજી ઉપલબ્ધ નથી.",
      paymentCredited: "તમારા {crop} વેચાણના ₹{amount} {date} ના રોજ જમા થઈ ગયા છે.",
      paymentProcessing: "તમારા {crop} વેચાણની ચુકવણી હજી પ્રક્રિયામાં છે.",
      paymentFailed: "તમારા {crop} ની ચુકવણીમાં સમસ્યા આવી છે. કૃપા કરીને કેન્દ્રનો સંપર્ક કરો.",
      paymentNone: "તમારા નામે હજી કોઈ ચુકવણી રેકોર્ડ મળ્યો નથી.",
      historyIntro: "આ તમારા ચુકવણી રેકોર્ડ છે.",
      cancelConfirm: "શું તમે તમારો ટોકન રદ કરવા માંગો છો?",
      cancelDone: "તમારું બુકિંગ અને ટોકન રદ કરવામાં આવ્યા છે.",
      cancelKeep: "ઠીક છે, ટોકન રદ કરવામાં આવ્યો નથી.",
      tokenNotCancellable: "આ ટોકન હવે રદ થઈ શકતો નથી. કૃપા કરીને કેન્દ્રનો સંપર્ક કરો.",
      help: "તમે કહી શકો: \"ઘઉં વેચવા છે\", \"મારી ચુકવણી આવી?\", \"મારો ટોકન કહો\"",
      unclear: "મને બરાબર સમજાયું નહીં. શું તમે પાક વેચવા વિશે પૂછો છો?",
      noMic: "માઇક્રોફોનની પરવાનગી મળી નથી. કૃપા કરીને પરવાનગી આપો અથવા ટાઇપ કરો.",
      noSpeechApi: "આ બ્રાઉઝરમાં અવાજ ઓળખવાની સુવિધા નથી. કૃપા કરીને ટાઇપ કરો.",
      network: "ઇન્ટરનેટ નબળું લાગે છે. કૃપા કરીને ફરી પ્રયત્ન કરો.",
      languagePicked: "ઠીક છે, હવે હું ગુજરાતીમાં બોલીશ.",
      loginNeeded: "આ માહિતી જોવા માટે પહેલા લોગિન કરો.",
      backendError: "હાલમાં માહિતી મળી શકી નથી. કૃપા કરીને થોડી વાર પછી પ્રયત્ન કરો."
    },
    'pa-IN': {
      askCrop: "ਕਿਹੜੀ ਫ਼ਸਲ ਵੇਚਣੀ ਹੈ?",
      askQuantity: "ਕਿੰਨੇ ਕੁਇੰਟਲ ਹਨ?",
      searching: "ਤੁਹਾਡੇ ਕੋਲ {qty} ਕੁਇੰਟਲ {crop} ਹੈ। ਇਸਨੂੰ ਖਰੀਦਣ ਵਾਲੇ ਕੇਂਦਰ ਲੱਭ ਰਿਹਾ ਹਾਂ।",
      mandiFound_one: "ਇੱਕ ਕੇਂਦਰ ਮਿਲਿਆ ਹੈ।",
      mandiFound_many: "{n} ਕੇਂਦਰ ਮਿਲੇ ਹਨ। ਕੀ ਤੁਸੀਂ ਤੁਲਨਾ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
      mandiNone: "ਮਾਫ਼ ਕਰਨਾ, ਇਸ ਫ਼ਸਲ ਲਈ ਹੁਣ ਕੋਈ ਖਰੀਦ ਕੇਂਦਰ ਨਹੀਂ ਮਿਲਿਆ।",
      accept_yes: "ਹਾਂ, ਇੱਥੇ {crop} ਲਈ ਜਾਂਦੀ ਹੈ।",
      accept_no: "ਨਹੀਂ, ਇੱਥੇ {crop} ਨਹੀਂ ਲਈ ਜਾਂਦੀ।",
      distance: "ਸਭ ਤੋਂ ਨੇੜਲਾ ਕੇਂਦਰ {name} ਲਗਭਗ {km} ਕਿਲੋਮੀਟਰ ਦੂਰ ਹੈ।",
      distanceUnknown: "ਦੂਰੀ ਜਾਣਨ ਲਈ \"ਕੇਂਦਰ ਲੱਭੋ\" ਪੰਨੇ ਉੱਤੇ \"ਮੇਰੀ ਲੋਕੇਸ਼ਨ\" ਦਬਾਓ। ਭਾੜੇ ਦਾ ਅੰਦਾਜ਼ਾ ਹਾਲੇ ਉਪਲਬਧ ਨਹੀਂ।",
      priceUnavailable: "ਮੰਡੀ ਭਾਅ ਦੀ ਜਾਣਕਾਰੀ ਹਾਲੇ ਇਸ ਐਪ ਵਿੱਚ ਉਪਲਬਧ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਕੇਂਦਰ ਤੋਂ ਪੁੱਛੋ।",
      queueNone: "ਤੁਹਾਡੇ ਕੋਲ ਹਾਲੇ ਕੋਈ ਟੋਕਨ ਨਹੀਂ ਹੈ। ਕੀ ਤੁਸੀਂ ਸਲਾਟ ਬੁੱਕ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
      queueStatus: "ਤੁਹਾਡਾ ਟੋਕਨ {token} ਹੈ। ਤੁਹਾਡੇ ਤੋਂ ਪਹਿਲਾਂ {ahead} ਟੋਕਨ ਹਨ।",
      queueWait: " ਅੰਦਾਜ਼ਨ ਉਡੀਕ ਲਗਭਗ {wait} ਮਿੰਟ ਹੈ।",
      queueWaitUnknown: " ਅੰਦਾਜ਼ਨ ਸਮਾਂ ਹਾਲੇ ਉਪਲਬਧ ਨਹੀਂ।",
      paymentCredited: "ਤੁਹਾਡੀ {crop} ਦੀ ਵਿਕਰੀ ਦੇ ₹{amount} {date} ਨੂੰ ਜਮ੍ਹਾ ਹੋ ਚੁੱਕੇ ਹਨ।",
      paymentProcessing: "ਤੁਹਾਡੀ {crop} ਦੀ ਵਿਕਰੀ ਦਾ ਭੁਗਤਾਨ ਹਾਲੇ ਪ੍ਰਕਿਰਿਆ ਵਿੱਚ ਹੈ।",
      paymentFailed: "ਤੁਹਾਡੀ {crop} ਦੇ ਭੁਗਤਾਨ ਵਿੱਚ ਸਮੱਸਿਆ ਆਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕੇਂਦਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
      paymentNone: "ਤੁਹਾਡੇ ਨਾਮ ਉੱਤੇ ਹਾਲੇ ਕੋਈ ਭੁਗਤਾਨ ਰਿਕਾਰਡ ਨਹੀਂ ਮਿਲਿਆ।",
      historyIntro: "ਇਹ ਤੁਹਾਡੇ ਭੁਗਤਾਨ ਰਿਕਾਰਡ ਹਨ।",
      cancelConfirm: "ਕੀ ਤੁਸੀਂ ਆਪਣਾ ਟੋਕਨ ਰੱਦ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
      cancelDone: "ਤੁਹਾਡੀ ਬੁਕਿੰਗ ਅਤੇ ਟੋਕਨ ਰੱਦ ਕਰ ਦਿੱਤੇ ਗਏ ਹਨ।",
      cancelKeep: "ਠੀਕ ਹੈ, ਟੋਕਨ ਰੱਦ ਨਹੀਂ ਕੀਤਾ ਗਿਆ।",
      tokenNotCancellable: "ਇਹ ਟੋਕਨ ਹੁਣ ਰੱਦ ਨਹੀਂ ਹੋ ਸਕਦਾ। ਕਿਰਪਾ ਕਰਕੇ ਕੇਂਦਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
      help: "ਤੁਸੀਂ ਕਹਿ ਸਕਦੇ ਹੋ: \"ਕਣਕ ਵੇਚਣੀ ਹੈ\", \"ਮੇਰਾ ਭੁਗਤਾਨ ਆਇਆ?\", \"ਮੇਰਾ ਟੋਕਨ ਦੱਸੋ\"",
      unclear: "ਮੈਨੂੰ ਠੀਕ ਤਰ੍ਹਾਂ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਕੀ ਤੁਸੀਂ ਫ਼ਸਲ ਵੇਚਣ ਬਾਰੇ ਪੁੱਛ ਰਹੇ ਹੋ?",
      noMic: "ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਕਿਰਪਾ ਕਰਕੇ ਇਜਾਜ਼ਤ ਦਿਓ ਜਾਂ ਟਾਈਪ ਕਰੋ।",
      noSpeechApi: "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਆਵਾਜ਼ ਪਛਾਣ ਦੀ ਸਹੂਲਤ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਟਾਈਪ ਕਰੋ।",
      network: "ਇੰਟਰਨੈੱਟ ਕਮਜ਼ੋਰ ਲੱਗਦਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      languagePicked: "ਠੀਕ ਹੈ, ਹੁਣ ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲ ਕਰਾਂਗਾ।",
      loginNeeded: "ਇਹ ਜਾਣਕਾਰੀ ਦੇਖਣ ਲਈ ਪਹਿਲਾਂ ਲੌਗਇਨ ਕਰੋ।",
      backendError: "ਹਾਲੇ ਜਾਣਕਾਰੀ ਨਹੀਂ ਮਿਲ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਕੋਸ਼ਿਸ਼ ਕਰੋ।"
    },
    'ta-IN': {
      askCrop: "எந்த பயிரை விற்க வேண்டும்?",
      askQuantity: "எத்தனை குவிண்டால் உள்ளது?",
      searching: "உங்களிடம் {qty} குவிண்டால் {crop} உள்ளது. அதை வாங்கும் மையங்களைத் தேடுகிறேன்.",
      mandiFound_one: "ஒரு மையம் கிடைத்துள்ளது.",
      mandiFound_many: "{n} மையங்கள் கிடைத்துள்ளன. ஒப்பிட விரும்புகிறீர்களா?",
      mandiNone: "மன்னிக்கவும், இந்தப் பயிருக்கு தற்போது கொள்முதல் மையம் எதுவும் கிடைக்கவில்லை.",
      accept_yes: "ஆம், இங்கே {crop} வாங்கப்படுகிறது.",
      accept_no: "இல்லை, இங்கே {crop} வாங்கப்படுவதில்லை.",
      distance: "அருகிலுள்ள மையம் {name} சுமார் {km} கிலோமீட்டர் தொலைவில் உள்ளது.",
      distanceUnknown: "தூரத்தை அறிய \"மையம் தேடு\" பக்கத்தில் \"என் இருப்பிடம்\" அழுத்தவும். போக்குவரத்துச் செலவு மதிப்பீடு இன்னும் கிடைக்கவில்லை.",
      priceUnavailable: "சந்தை விலை தகவல் இந்த செயலியில் இன்னும் இல்லை. மையத்தில் கேளுங்கள்.",
      queueNone: "உங்களிடம் தற்போது டோக்கன் இல்லை. ஸ்லாட் பதிவு செய்ய விரும்புகிறீர்களா?",
      queueStatus: "உங்கள் டோக்கன் {token}. உங்களுக்கு முன் {ahead} டோக்கன்கள் உள்ளன.",
      queueWait: " மதிப்பிடப்பட்ட காத்திருப்பு சுமார் {wait} நிமிடங்கள்.",
      queueWaitUnknown: " மதிப்பிடப்பட்ட நேரம் இன்னும் கிடைக்கவில்லை.",
      paymentCredited: "உங்கள் {crop} விற்பனைக்கான ₹{amount} {date} அன்று வரவு வைக்கப்பட்டது.",
      paymentProcessing: "உங்கள் {crop} விற்பனைக்கான பணம் இன்னும் செயலாக்கத்தில் உள்ளது.",
      paymentFailed: "உங்கள் {crop} பணம் செலுத்துதலில் சிக்கல் ஏற்பட்டுள்ளது. மையத்தைத் தொடர்பு கொள்ளுங்கள்.",
      paymentNone: "உங்கள் பெயரில் இன்னும் பணம் செலுத்தும் பதிவு எதுவும் இல்லை.",
      historyIntro: "இவை உங்கள் பணம் செலுத்தும் பதிவுகள்.",
      cancelConfirm: "உங்கள் டோக்கனை ரத்து செய்ய விரும்புகிறீர்களா?",
      cancelDone: "உங்கள் முன்பதிவும் டோக்கனும் ரத்து செய்யப்பட்டன.",
      cancelKeep: "சரி, டோக்கன் ரத்து செய்யப்படவில்லை.",
      tokenNotCancellable: "இந்த டோக்கனை இனி ரத்து செய்ய முடியாது. மையத்தைத் தொடர்பு கொள்ளுங்கள்.",
      help: "நீங்கள் இப்படிச் சொல்லலாம்: \"கோதுமை விற்க வேண்டும்\", \"என் பணம் வந்ததா?\", \"என் டோக்கன் என்ன?\"",
      unclear: "எனக்கு சரியாகப் புரியவில்லை. நீங்கள் பயிர் விற்பது பற்றிக் கேட்கிறீர்களா?",
      noMic: "மைக்ரோஃபோன் அனுமதி கிடைக்கவில்லை. அனுமதி அளிக்கவும் அல்லது தட்டச்சு செய்யவும்.",
      noSpeechApi: "இந்த உலாவியில் குரல் அறிதல் இல்லை. தயவுசெய்து தட்டச்சு செய்யவும்.",
      network: "இணைய இணைப்பு பலவீனமாக உள்ளது. மீண்டும் முயற்சிக்கவும்.",
      languagePicked: "சரி, இனி நான் தமிழில் பேசுவேன்.",
      loginNeeded: "இந்தத் தகவலைப் பார்க்க முதலில் உள்நுழையவும்.",
      backendError: "இப்போது தகவலைப் பெற முடியவில்லை. சிறிது நேரம் கழித்து முயற்சிக்கவும்."
    },
    'te-IN': {
      askCrop: "ఏ పంటను అమ్మాలనుకుంటున్నారు?",
      askQuantity: "ఎన్ని క్వింటాళ్లు ఉన్నాయి?",
      searching: "మీ వద్ద {qty} క్వింటాళ్ల {crop} ఉంది. దాన్ని కొనే కేంద్రాలను వెతుకుతున్నాను.",
      mandiFound_one: "ఒక కేంద్రం దొరికింది.",
      mandiFound_many: "{n} కేంద్రాలు దొరికాయి. పోల్చి చూడాలనుకుంటున్నారా?",
      mandiNone: "క్షమించండి, ఈ పంటకు ప్రస్తుతం కొనుగోలు కేంద్రం ఏదీ దొరకలేదు.",
      accept_yes: "అవును, ఇక్కడ {crop} కొంటారు.",
      accept_no: "లేదు, ఇక్కడ {crop} కొనరు.",
      distance: "దగ్గరలోని కేంద్రం {name} సుమారు {km} కిలోమీటర్ల దూరంలో ఉంది.",
      distanceUnknown: "దూరం తెలుసుకోవడానికి \"కేంద్రం వెతుకు\" పేజీలో \"నా స్థానం\" నొక్కండి. రవాణా ఖర్చు అంచనా ఇంకా అందుబాటులో లేదు.",
      priceUnavailable: "మార్కెట్ ధర సమాచారం ఈ యాప్‌లో ఇంకా లేదు. దయచేసి కేంద్రాన్ని అడగండి.",
      queueNone: "మీకు ప్రస్తుతం టోకెన్ లేదు. స్లాట్ బుక్ చేయాలనుకుంటున్నారా?",
      queueStatus: "మీ టోకెన్ {token}. మీ కంటే ముందు {ahead} టోకెన్లు ఉన్నాయి.",
      queueWait: " అంచనా వేచి ఉండే సమయం సుమారు {wait} నిమిషాలు.",
      queueWaitUnknown: " అంచనా సమయం ఇంకా అందుబాటులో లేదు.",
      paymentCredited: "మీ {crop} అమ్మకం ₹{amount} {date} న జమ అయింది.",
      paymentProcessing: "మీ {crop} అమ్మకం చెల్లింపు ఇంకా ప్రాసెసింగ్‌లో ఉంది.",
      paymentFailed: "మీ {crop} చెల్లింపులో సమస్య వచ్చింది. దయచేసి కేంద్రాన్ని సంప్రదించండి.",
      paymentNone: "మీ పేరు మీద ఇంకా ఏ చెల్లింపు రికార్డు దొరకలేదు.",
      historyIntro: "ఇవి మీ చెల్లింపు రికార్డులు.",
      cancelConfirm: "మీ టోకెన్‌ను రద్దు చేయాలనుకుంటున్నారా?",
      cancelDone: "మీ బుకింగ్ మరియు టోకెన్ రద్దు చేయబడ్డాయి.",
      cancelKeep: "సరే, టోకెన్ రద్దు చేయలేదు.",
      tokenNotCancellable: "ఈ టోకెన్‌ను ఇక రద్దు చేయలేరు. దయచేసి కేంద్రాన్ని సంప్రదించండి.",
      help: "మీరు ఇలా చెప్పవచ్చు: \"గోధుమ అమ్మాలి\", \"నా చెల్లింపు వచ్చిందా?\", \"నా టోకెన్ చెప్పండి\"",
      unclear: "నాకు సరిగ్గా అర్థం కాలేదు. మీరు పంట అమ్మడం గురించి అడుగుతున్నారా?",
      noMic: "మైక్రోఫోన్ అనుమతి రాలేదు. దయచేసి అనుమతి ఇవ్వండి లేదా టైప్ చేయండి.",
      noSpeechApi: "ఈ బ్రౌజర్‌లో వాయిస్ గుర్తింపు లేదు. దయచేసి టైప్ చేయండి.",
      network: "ఇంటర్నెట్ బలహీనంగా ఉంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
      languagePicked: "సరే, ఇప్పటి నుండి తెలుగులో మాట్లాడతాను.",
      loginNeeded: "ఈ సమాచారం చూడటానికి ముందు లాగిన్ అవ్వండి.",
      backendError: "ప్రస్తుతం సమాచారం అందలేదు. కొంతసేపటి తర్వాత ప్రయత్నించండి."
    },
    'kn-IN': {
      askCrop: "ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡಬೇಕು?",
      askQuantity: "ಎಷ್ಟು ಕ್ವಿಂಟಾಲ್ ಇದೆ?",
      searching: "ನಿಮ್ಮ ಬಳಿ {qty} ಕ್ವಿಂಟಾಲ್ {crop} ಇದೆ. ಅದನ್ನು ಖರೀದಿಸುವ ಕೇಂದ್ರಗಳನ್ನು ಹುಡುಕುತ್ತಿದ್ದೇನೆ.",
      mandiFound_one: "ಒಂದು ಕೇಂದ್ರ ಸಿಕ್ಕಿದೆ.",
      mandiFound_many: "{n} ಕೇಂದ್ರಗಳು ಸಿಕ್ಕಿವೆ. ಹೋಲಿಕೆ ಮಾಡಬೇಕೇ?",
      mandiNone: "ಕ್ಷಮಿಸಿ, ಈ ಬೆಳೆಗೆ ಸದ್ಯ ಯಾವುದೇ ಖರೀದಿ ಕೇಂದ್ರ ಸಿಕ್ಕಿಲ್ಲ.",
      accept_yes: "ಹೌದು, ಇಲ್ಲಿ {crop} ಖರೀದಿಸಲಾಗುತ್ತದೆ.",
      accept_no: "ಇಲ್ಲ, ಇಲ್ಲಿ {crop} ಖರೀದಿಸುವುದಿಲ್ಲ.",
      distance: "ಹತ್ತಿರದ ಕೇಂದ್ರ {name} ಸುಮಾರು {km} ಕಿಲೋಮೀಟರ್ ದೂರದಲ್ಲಿದೆ.",
      distanceUnknown: "ದೂರ ತಿಳಿಯಲು \"ಕೇಂದ್ರ ಹುಡುಕಿ\" ಪುಟದಲ್ಲಿ \"ನನ್ನ ಸ್ಥಳ\" ಒತ್ತಿ. ಸಾಗಾಣಿಕೆ ವೆಚ್ಚದ ಅಂದಾಜು ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.",
      priceUnavailable: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಮಾಹಿತಿ ಈ ಆ್ಯಪ್‌ನಲ್ಲಿ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೇಂದ್ರವನ್ನು ಕೇಳಿ.",
      queueNone: "ನಿಮ್ಮ ಬಳಿ ಸದ್ಯ ಟೋಕನ್ ಇಲ್ಲ. ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಬೇಕೇ?",
      queueStatus: "ನಿಮ್ಮ ಟೋಕನ್ {token}. ನಿಮ್ಮ ಮುಂದೆ {ahead} ಟೋಕನ್‌ಗಳಿವೆ.",
      queueWait: " ಅಂದಾಜು ಕಾಯುವ ಸಮಯ ಸುಮಾರು {wait} ನಿಮಿಷ.",
      queueWaitUnknown: " ಅಂದಾಜು ಸಮಯ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.",
      paymentCredited: "ನಿಮ್ಮ {crop} ಮಾರಾಟದ ₹{amount} {date} ರಂದು ಜಮಾ ಆಗಿದೆ.",
      paymentProcessing: "ನಿಮ್ಮ {crop} ಮಾರಾಟದ ಪಾವತಿ ಇನ್ನೂ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ.",
      paymentFailed: "ನಿಮ್ಮ {crop} ಪಾವತಿಯಲ್ಲಿ ಸಮಸ್ಯೆ ಆಗಿದೆ. ದಯವಿಟ್ಟು ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
      paymentNone: "ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಪಾವತಿ ದಾಖಲೆ ಸಿಕ್ಕಿಲ್ಲ.",
      historyIntro: "ಇವು ನಿಮ್ಮ ಪಾವತಿ ದಾಖಲೆಗಳು.",
      cancelConfirm: "ನಿಮ್ಮ ಟೋಕನ್ ರದ್ದುಗೊಳಿಸಬೇಕೇ?",
      cancelDone: "ನಿಮ್ಮ ಬುಕಿಂಗ್ ಮತ್ತು ಟೋಕನ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.",
      cancelKeep: "ಸರಿ, ಟೋಕನ್ ರದ್ದುಗೊಳಿಸಿಲ್ಲ.",
      tokenNotCancellable: "ಈ ಟೋಕನ್ ಅನ್ನು ಇನ್ನು ರದ್ದುಗೊಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
      help: "ನೀವು ಹೀಗೆ ಹೇಳಬಹುದು: \"ಗೋಧಿ ಮಾರಬೇಕು\", \"ನನ್ನ ಪಾವತಿ ಬಂತಾ?\", \"ನನ್ನ ಟೋಕನ್ ಹೇಳಿ\"",
      unclear: "ನನಗೆ ಸರಿಯಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ನೀವು ಬೆಳೆ ಮಾರಾಟದ ಬಗ್ಗೆ ಕೇಳುತ್ತಿದ್ದೀರಾ?",
      noMic: "ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಅನುಮತಿ ನೀಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.",
      noSpeechApi: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಇಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.",
      network: "ಇಂಟರ್ನೆಟ್ ದುರ್ಬಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      languagePicked: "ಸರಿ, ಇನ್ನು ನಾನು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತೇನೆ.",
      loginNeeded: "ಈ ಮಾಹಿತಿ ನೋಡಲು ಮೊದಲು ಲಾಗಿನ್ ಮಾಡಿ.",
      backendError: "ಸದ್ಯ ಮಾಹಿತಿ ಸಿಗಲಿಲ್ಲ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ."
    },
    'ml-IN': {
      askCrop: "ഏത് വിള വിൽക്കണം?",
      askQuantity: "എത്ര ക്വിന്റൽ ഉണ്ട്?",
      searching: "നിങ്ങളുടെ കയ്യിൽ {qty} ക്വിന്റൽ {crop} ഉണ്ട്. അത് വാങ്ങുന്ന കേന്ദ്രങ്ങൾ തിരയുകയാണ്.",
      mandiFound_one: "ഒരു കേന്ദ്രം കണ്ടെത്തി.",
      mandiFound_many: "{n} കേന്ദ്രങ്ങൾ കണ്ടെത്തി. താരതമ്യം ചെയ്യണോ?",
      mandiNone: "ക്ഷമിക്കണം, ഈ വിളയ്ക്ക് ഇപ്പോൾ സംഭരണ കേന്ദ്രം ഒന്നും കണ്ടെത്തിയില്ല.",
      accept_yes: "അതെ, ഇവിടെ {crop} എടുക്കും.",
      accept_no: "ഇല്ല, ഇവിടെ {crop} എടുക്കില്ല.",
      distance: "ഏറ്റവും അടുത്ത കേന്ദ്രം {name} ഏകദേശം {km} കിലോമീറ്റർ അകലെയാണ്.",
      distanceUnknown: "ദൂരം അറിയാൻ \"കേന്ദ്രം കണ്ടെത്തുക\" പേജിൽ \"എന്റെ സ്ഥലം\" അമർത്തുക. ചരക്കുകൂലി കണക്ക് ഇതുവരെ ലഭ്യമല്ല.",
      priceUnavailable: "വിപണിവില വിവരം ഈ ആപ്പിൽ ഇതുവരെ ലഭ്യമല്ല. ദയവായി കേന്ദ്രത്തോട് ചോദിക്കുക.",
      queueNone: "നിങ്ങൾക്ക് ഇപ്പോൾ ടോക്കൺ ഇല്ല. സ്ലോട്ട് ബുക്ക് ചെയ്യണോ?",
      queueStatus: "നിങ്ങളുടെ ടോക്കൺ {token} ആണ്. നിങ്ങൾക്ക് മുമ്പ് {ahead} ടോക്കണുകൾ ഉണ്ട്.",
      queueWait: " കണക്കാക്കിയ കാത്തിരിപ്പ് ഏകദേശം {wait} മിനിറ്റ്.",
      queueWaitUnknown: " കണക്കാക്കിയ സമയം ഇതുവരെ ലഭ്യമല്ല.",
      paymentCredited: "നിങ്ങളുടെ {crop} വിൽപ്പനയുടെ ₹{amount} {date} ന് വരവുവച്ചു.",
      paymentProcessing: "നിങ്ങളുടെ {crop} വിൽപ്പനയുടെ പണം ഇപ്പോഴും പ്രോസസ്സിംഗിലാണ്.",
      paymentFailed: "നിങ്ങളുടെ {crop} പേയ്‌മെന്റിൽ പ്രശ്നം ഉണ്ടായി. ദയവായി കേന്ദ്രവുമായി ബന്ധപ്പെടുക.",
      paymentNone: "നിങ്ങളുടെ പേരിൽ ഇതുവരെ പേയ്‌മെന്റ് രേഖ ഒന്നും കണ്ടെത്തിയില്ല.",
      historyIntro: "ഇവ നിങ്ങളുടെ പേയ്‌മെന്റ് രേഖകളാണ്.",
      cancelConfirm: "നിങ്ങളുടെ ടോക്കൺ റദ്ദാക്കണോ?",
      cancelDone: "നിങ്ങളുടെ ബുക്കിംഗും ടോക്കണും റദ്ദാക്കി.",
      cancelKeep: "ശരി, ടോക്കൺ റദ്ദാക്കിയില്ല.",
      tokenNotCancellable: "ഈ ടോക്കൺ ഇനി റദ്ദാക്കാൻ കഴിയില്ല. ദയവായി കേന്ദ്രവുമായി ബന്ധപ്പെടുക.",
      help: "നിങ്ങൾക്ക് ഇങ്ങനെ പറയാം: \"ഗോതമ്പ് വിൽക്കണം\", \"എന്റെ പണം വന്നോ?\", \"എന്റെ ടോക്കൺ പറയൂ\"",
      unclear: "എനിക്ക് വ്യക്തമായില്ല. നിങ്ങൾ വിള വിൽക്കുന്നതിനെക്കുറിച്ചാണോ ചോദിക്കുന്നത്?",
      noMic: "മൈക്രോഫോൺ അനുമതി ലഭിച്ചില്ല. ദയവായി അനുമതി നൽകുക അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക.",
      noSpeechApi: "ഈ ബ്രൗസറിൽ ശബ്ദം തിരിച്ചറിയൽ ഇല്ല. ദയവായി ടൈപ്പ് ചെയ്യുക.",
      network: "ഇന്റർനെറ്റ് ദുർബലമാണ്. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
      languagePicked: "ശരി, ഇനി ഞാൻ മലയാളത്തിൽ സംസാരിക്കാം.",
      loginNeeded: "ഈ വിവരം കാണാൻ ആദ്യം ലോഗിൻ ചെയ്യുക.",
      backendError: "ഇപ്പോൾ വിവരം ലഭിച്ചില്ല. കുറച്ചു കഴിഞ്ഞ് ശ്രമിക്കുക."
    },
    'bho-IN': {
      askCrop: "कवन फसल बेचे के बा?",
      askQuantity: "केतना क्विंटल बा?",
      searching: "रउआ लगे {qty} क्विंटल {crop} बा। एकरा के खरीदे वाला केंद्र खोजत बानी।",
      mandiFound_one: "एगो केंद्र मिलल बा।",
      mandiFound_many: "{n} केंद्र मिलल बा। का रउआ तुलना करे चाहत बानी?",
      mandiNone: "माफ करीं, अभी एह फसल खातिर कवनो खरीद केंद्र ना मिलल।",
      accept_yes: "हँ, इहाँ {crop} लिहल जाला।",
      accept_no: "ना, इहाँ {crop} ना लिहल जाला।",
      distance: "सबसे नजदीक के केंद्र {name} करीब {km} किलोमीटर दूर बा।",
      distanceUnknown: "दूरी जाने खातिर \"केंद्र खोजीं\" पेज पर \"हमार लोकेशन\" दबाईं। भाड़ा के अंदाजा अभी नइखे।",
      priceUnavailable: "मंडी भाव के जानकारी अभी एह ऐप में नइखे। कृपा करके केंद्र से पूछीं।",
      queueNone: "रउआ लगे अभी कवनो टोकन नइखे। का रउआ स्लॉट बुक करे चाहत बानी?",
      queueStatus: "रउआ के टोकन {token} बा। रउआ से पहिले {ahead} टोकन बा।",
      queueWait: " अंदाजन इंतजार करीब {wait} मिनट बा।",
      queueWaitUnknown: " अंदाजन समय अभी नइखे मालूम।",
      paymentCredited: "रउआ के {crop} बेचला के ₹{amount} {date} के आ गइल बा।",
      paymentProcessing: "रउआ के {crop} बेचला के पइसा अभी प्रक्रिया में बा।",
      paymentFailed: "रउआ के {crop} के भुगतान में दिक्कत आइल बा। कृपा करके केंद्र से संपर्क करीं।",
      paymentNone: "रउआ नाम पर अभी कवनो भुगतान रिकॉर्ड ना मिलल।",
      historyIntro: "ई रउआ के भुगतान रिकॉर्ड बा।",
      cancelConfirm: "का रउआ आपन टोकन रद्द करे चाहत बानी?",
      cancelDone: "रउआ के बुकिंग आ टोकन रद्द हो गइल।",
      cancelKeep: "ठीक बा, टोकन रद्द ना भइल।",
      tokenNotCancellable: "ई टोकन अब रद्द ना हो सकेला। कृपा करके केंद्र से संपर्क करीं।",
      help: "रउआ कह सकेनी: \"गेहूँ बेचे के बा\", \"हमार पेमेंट आइल का\", \"हमार टोकन बताईं\"",
      unclear: "हमके ठीक से समझ ना आइल। का रउआ फसल बेचे के बारे में पूछत बानी?",
      noMic: "माइक्रोफ़ोन के अनुमति ना मिलल। कृपा करके अनुमति दीं भा टाइप करीं।",
      noSpeechApi: "एह ब्राउज़र में आवाज़ पहचान के सुविधा नइखे। कृपा करके टाइप करीं।",
      network: "इंटरनेट कमजोर लागत बा। कृपा करके फेर से कोशिश करीं।",
      languagePicked: "ठीक बा, अब हम भोजपुरी में बात करब।",
      loginNeeded: "ई जानकारी देखे खातिर पहिले लॉगिन करीं।",
      backendError: "अभी जानकारी ना मिल पाइल। कृपा करके तनी देर में कोशिश करीं।"
    }
  };

  function t(langCode, key, vars) {
    var pack = STRINGS[langCode] || STRINGS['hi-IN'];
    var str = pack[key] || STRINGS['hi-IN'][key] || key;
    if (vars) {
      for (var k in vars) { if (vars.hasOwnProperty(k)) str = str.split('{' + k + '}').join(vars[k]); }
    }
    return str;
  }

  /* ===================================================================
   * 8. VOICE COMMAND SERVICE — turns an intent into a real app action.
   * This is the ONLY layer that touches app state/navigation, so wiring
   * a real backend later means editing the small number of functions here.
   * =================================================================== */
  var PAGES = {
    home: 'page01-landing.html',
    slotBooking: 'page03-slot-booking.html',
    token: 'page04-booking-token.html',
    status: 'page05-procurement-status.html',
    dashboard: 'page06-farmer-dashboard.html',
    centreFinder: 'page07-centre-finder.html',
    liveQueue: 'page08-live-queue.html',
    login: 'page02a-farmer-login.html'
  };

  function VoiceCommandService(ui) {
    var session = { lastMandis: null, pendingCrop: null, pendingQty: null, awaitingConfirm: null, cancelTarget: null };

    var CROP_LABELS = {
      wheat:   { 'hi-IN': 'गेहूं',  'bho-IN': 'गेहूँ', 'en-IN': 'wheat' },
      rice:    { 'hi-IN': 'धान',   'bho-IN': 'धान',  'en-IN': 'rice' },
      maize:   { 'hi-IN': 'मक्का', 'bho-IN': 'मकई',  'en-IN': 'maize' },
      mustard: { 'hi-IN': 'सरसों', 'bho-IN': 'सरसों', 'en-IN': 'mustard' }
    };

    function crop() { return session.pendingCrop; }

    function cropLabel(cropKey, lang) {
      if (!cropKey) return lang === 'hi-IN' ? 'फसल' : 'crop';
      var labels = CROP_LABELS[String(cropKey).toLowerCase()];
      return (labels && (labels[lang] || labels['en-IN'])) || cropKey;
    }

    function respond(lang, text, opts) {
      ui.showAssistantText(text, opts);
      TextToSpeechService.speak(text, lang, function (spoke) {
        if (!spoke) ui.markTextOnly();
      });
    }

    function needLogin(lang) {
      respond(lang, t(lang, 'loginNeeded'), { buttons: [{ label: '🔑 Login', action: 'GO_LOGIN' }] });
    }

    function fail(lang, err) {
      if (err && err.kind === 'auth') return;               // the page is already redirecting to login
      if (window.console) console.error('Voice assistant data error:', err);
      respond(lang, t(lang, err && err.kind === 'network' ? 'network' : 'backendError'));
    }

    function formatDate(iso) {
      var d = new Date(iso);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    /* ------------------------------------------------------------ crops / centres */

    function handleSellCrop(lang, entities) {
      if (entities.crop) session.pendingCrop = entities.crop;
      if (entities.quantity !== null && entities.quantity !== undefined) session.pendingQty = entities.quantity;

      if (!session.pendingCrop) { respond(lang, t(lang, 'askCrop')); return Promise.resolve(); }
      if (!session.pendingQty) { respond(lang, t(lang, 'askQuantity')); return Promise.resolve(); }

      respond(lang, t(lang, 'searching', { qty: session.pendingQty, crop: cropLabel(session.pendingCrop, lang) }));
      return handleFindMandi(lang, { crop: session.pendingCrop }).then(function () {
        // Remember the choice so the booking page opens with it filled in.
        return DataService.cropByKey(session.pendingCrop).then(function (c) {
          DataService.rememberBookingIntent(c, session.pendingQty);
        });
      });
    }

    function handleFindMandi(lang, entities) {
      var cropKey = entities.crop || crop();
      return DataService.findMandis(cropKey).then(function (results) {
        session.lastMandis = results;
        if (!results.length) { respond(lang, t(lang, 'mandiNone')); return; }
        ui.showMandiCards(results);
        var msg = results.length === 1 ? t(lang, 'mandiFound_one') : t(lang, 'mandiFound_many', { n: results.length });
        var buttons = [];
        if (results.length > 1) buttons.push({ label: '📊 Compare', action: 'COMPARE_MANDIS' });
        buttons.push({ label: '📅 Book a slot', action: 'GO_BOOK' });
        respond(lang, msg, { buttons: buttons });
      });
    }

    function handleCompare(lang) {
      if (!session.lastMandis || !session.lastMandis.length) return handleFindMandi(lang, {});
      ui.showMandiComparison(session.lastMandis);
      respond(lang, t(lang, 'mandiFound_many', { n: session.lastMandis.length }));
      return Promise.resolve();
    }

    function handleAcceptance(lang, entities) {
      var cropKey = entities.crop || crop();
      var mandi = session.lastMandis && session.lastMandis[0];
      if (!mandi) return handleFindMandi(lang, { crop: cropKey });
      var ok = (mandi.accepted_crops || []).some(function (c) { return String(c.name).toLowerCase() === cropKey; });
      respond(lang, t(lang, ok ? 'accept_yes' : 'accept_no', { crop: cropLabel(cropKey, lang) }));
      return Promise.resolve();
    }

    // There is no price data source in the backend, so the assistant says so instead of quoting a number.
    function handlePrice(lang) {
      respond(lang, t(lang, 'priceUnavailable'));
      return Promise.resolve();
    }

    function handleTransport(lang) {
      var mandi = session.lastMandis && session.lastMandis[0];
      if (mandi && mandi.distance_km !== undefined) {
        respond(lang, t(lang, 'distance', { name: mandi.name, km: mandi.distance_km }));
        return Promise.resolve();
      }
      if (!mandi) return handleFindMandi(lang, {}).then(function () { /* the distance note follows below */ });
      respond(lang, t(lang, 'distanceUnknown'));
      return Promise.resolve();
    }

    /* ------------------------------------------------------------ queue / token */

    function activeBookingWithToken() {
      return DataService.getCurrentBooking().then(function (booking) {
        var live = booking && booking.token && ['WAITING', 'CALLED', 'SERVING', 'HOLD'].indexOf(booking.token.status) !== -1 &&
          booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED';
        return live ? booking : null;
      });
    }

    function handleQueue(lang) {
      if (!DataService.isLoggedIn()) { needLogin(lang); return Promise.resolve(); }
      return activeBookingWithToken().then(function (booking) {
        if (!booking) {
          respond(lang, t(lang, 'queueNone'), { buttons: [{ label: '📅 Book a slot', action: 'GO_BOOK' }] });
          return;
        }
        return DataService.getQueueStatus(booking.id).then(function (status) {
          var mine = status.mine;
          if (!mine || mine.tokensAhead === null || mine.tokensAhead === undefined) {
            respond(lang, t(lang, 'queueNone'), { buttons: [{ label: '📅 Book a slot', action: 'GO_BOOK' }] });
            return;
          }
          var msg = t(lang, 'queueStatus', { token: '#' + mine.tokenNumber, ahead: mine.tokensAhead }) +
            (mine.estimatedWaitMinutes !== null && mine.estimatedWaitMinutes !== undefined
              ? t(lang, 'queueWait', { wait: mine.estimatedWaitMinutes })
              : t(lang, 'queueWaitUnknown'));
          respond(lang, msg, { buttons: [{ label: '🔎 View queue', action: 'GO_QUEUE' }] });
        });
      });
    }

    function handleToken(lang) { return handleQueue(lang); }

    /* ------------------------------------------------------------------ payments */

    function paymentCropKey(p) {
      var name = p.bookings && p.bookings.crops && p.bookings.crops.name;
      return name ? String(name).toLowerCase() : null;
    }

    function handlePayment(lang, entities) {
      if (!DataService.isLoggedIn()) { needLogin(lang); return Promise.resolve(); }
      var wanted = entities.crop || crop();
      return DataService.getPayments().then(function (list) {
        var matches = wanted ? list.filter(function (p) { return paymentCropKey(p) === wanted; }) : list;
        var p = matches[0];                                  // newest first
        if (!p) { respond(lang, t(lang, 'paymentNone')); return; }
        var label = cropLabel(paymentCropKey(p), lang);
        if (p.status === 'CREDITED') {
          respond(lang, t(lang, 'paymentCredited', {
            crop: label, amount: Number(p.amount).toLocaleString('en-IN'), date: formatDate(p.payment_date || p.created_at)
          }));
        } else if (p.status === 'FAILED') {
          respond(lang, t(lang, 'paymentFailed', { crop: label }));
        } else {
          respond(lang, t(lang, 'paymentProcessing', { crop: label }));
        }
      });
    }

    function handleHistory(lang) {
      if (!DataService.isLoggedIn()) { needLogin(lang); return Promise.resolve(); }
      return DataService.getPayments().then(function (list) {
        if (!list.length) { respond(lang, t(lang, 'paymentNone')); return; }
        ui.showPaymentHistory(list);
        respond(lang, t(lang, 'historyIntro'));
      });
    }

    /* ------------------------------------------------------------------- cancel */

    function handleCancelToken(lang, entities) {
      if (session.awaitingConfirm === 'CANCEL_TOKEN') {
        var target = session.cancelTarget;
        session.awaitingConfirm = null;
        session.cancelTarget = null;
        if (entities.yesNo !== true || !target) { respond(lang, t(lang, 'cancelKeep')); return Promise.resolve(); }
        return DataService.cancelBooking(target.id).then(function () {
          respond(lang, t(lang, 'cancelDone'));
        }, function (err) {
          if (err && err.status === 409) { respond(lang, t(lang, 'tokenNotCancellable')); return; }
          throw err;
        });
      }
      if (!DataService.isLoggedIn()) { needLogin(lang); return Promise.resolve(); }
      return activeBookingWithToken().then(function (booking) {
        if (!booking) { respond(lang, t(lang, 'queueNone')); return; }
        session.awaitingConfirm = 'CANCEL_TOKEN';
        session.cancelTarget = booking;
        respond(lang, t(lang, 'cancelConfirm'), {
          buttons: [
            { label: '✅ ' + (lang === 'hi-IN' ? 'हाँ, रद्द करें' : 'Yes, cancel'), action: 'CONFIRM_YES' },
            { label: '❌ ' + (lang === 'hi-IN' ? 'नहीं' : 'No'), action: 'CONFIRM_NO' }
          ]
        });
      });
    }

    function handleHelp(lang) {
      respond(lang, t(lang, 'help'));
      return Promise.resolve();
    }

    function handleNav(intent) {
      var map = {
        NAV_HOME: PAGES.home,
        NAV_SHOW_MANDI: PAGES.centreFinder,
        NAV_SHOW_PAYMENT: PAGES.status,
        NAV_SHOW_TOKEN: PAGES.token
      };
      if (intent === 'NAV_BACK') { history.back(); return; }
      if (intent === 'NAV_NEXT_MANDI') {
        if (session.lastMandis && session.lastMandis.length > 1) {
          session.lastMandis.push(session.lastMandis.shift());
          ui.showMandiCards(session.lastMandis);
        }
        return;
      }
      if (map[intent]) window.location.href = map[intent];
    }

    function goLogin() {
      var page = (window.location.pathname.split('/').pop() || 'page01-landing.html') + (window.location.search || '');
      window.location.href = PAGES.login + '?next=' + encodeURIComponent(page);
    }

    return {
      /** Dispatch a parsed NLU result into a real app action. Always returns a Promise. */
      handle: function (parsed, lang) {
        var intent = parsed.intent;
        var entities = parsed.entities || {};

        var run = function () {
          // If we're mid-confirmation, route yes/no there first regardless of intent guess.
          if (session.awaitingConfirm === 'CANCEL_TOKEN' && (entities.yesNo !== null)) {
            return handleCancelToken(lang, entities);
          }
          // Slot-filling continuation: if we already asked for crop/qty, keep collecting.
          if ((session.pendingCrop && !session.pendingQty) || (!session.pendingCrop && session.pendingQty)) {
            if (entities.crop || entities.quantity !== null) return handleSellCrop(lang, entities);
          }

          if (parsed.confidence < 0.35 || !intent) {
            respond(lang, t(lang, 'unclear'), { buttons: [{ label: lang === 'hi-IN' ? '🌾 फसल बेचनी है' : '🌾 Sell a crop', action: 'INTENT_SELL_CROP' }] });
            return Promise.resolve();
          }

          switch (intent) {
            case 'SELL_CROP': return handleSellCrop(lang, entities);
            case 'FIND_MANDI': return handleFindMandi(lang, entities);
            case 'CHECK_CROP_ACCEPTANCE': return handleAcceptance(lang, entities);
            case 'COMPARE_MANDIS': return handleCompare(lang);
            case 'CHECK_PRICE': return handlePrice(lang);
            case 'CALCULATE_TRANSPORT_COST': return handleTransport(lang);
            case 'CHECK_QUEUE': return handleQueue(lang);
            case 'GET_TOKEN': return handleToken(lang);
            case 'CHECK_PAYMENT': return handlePayment(lang, entities);
            case 'VIEW_TRANSACTION_HISTORY': return handleHistory(lang);
            case 'CANCEL_TOKEN': return handleCancelToken(lang, entities);
            case 'HELP': return handleHelp(lang);
            case 'CHANGE_LANGUAGE': ui.openLanguagePicker(); return Promise.resolve();
            case 'NAV_HOME': case 'NAV_BACK': case 'NAV_SHOW_MANDI':
            case 'NAV_SHOW_PAYMENT': case 'NAV_SHOW_TOKEN': case 'NAV_NEXT_MANDI':
              handleNav(intent); return Promise.resolve();
            default: respond(lang, t(lang, 'unclear')); return Promise.resolve();
          }
        };
        return Promise.resolve().then(run).catch(function (err) { fail(lang, err); });
      },
      // Buttons rendered in the panel call back through here.
      handleButton: function (action, lang) {
        var p = Promise.resolve();
        if (action === 'COMPARE_MANDIS') p = handleCompare(lang);
        else if (action === 'CONFIRM_YES') p = handleCancelToken(lang, { yesNo: true });
        else if (action === 'CONFIRM_NO') p = handleCancelToken(lang, { yesNo: false });
        else if (action === 'GO_BOOK') window.location.href = PAGES.slotBooking;
        else if (action === 'GO_QUEUE') window.location.href = PAGES.liveQueue;
        else if (action === 'GO_LOGIN') goLogin();
        else if (action === 'INTENT_SELL_CROP') p = handleSellCrop(lang, {});
        return p.catch(function (err) { fail(lang, err); });
      },
      resetSlotFilling: function () { session.pendingCrop = null; session.pendingQty = null; }
    };
  }

  /* ===================================================================
   * 9. WIDGET UI — mic button, expandable panel, transcript, states,
   * language picker. Pure DOM, no framework, matches the site's existing
   * CSS custom properties (--green-700 etc.) so it themes automatically.
   * =================================================================== */
  function buildUI() {
    var root = document.createElement('div');
    root.id = 'kqVoiceRoot';
    root.innerHTML =
      '<button id="kqMicFab" aria-label="बोलकर पूछें" title="बोलकर पूछें">🎙️</button>' +
      '<div id="kqPanel" class="kq-panel" role="dialog" aria-label="Voice assistant">' +
        '<div class="kq-panel-head">' +
          '<span class="kq-panel-title">🌾 <span id="kqPanelTitleText">बोलकर पूछें</span></span>' +
          '<button id="kqLangBtn" class="kq-lang-btn" title="Change language">🌐</button>' +
          '<button id="kqCloseBtn" class="kq-close-btn" aria-label="Close">✕</button>' +
        '</div>' +
        '<div id="kqOfflineBanner" class="kq-offline-banner" style="display:none;">📶 इंटरनेट कमज़ोर है — आवाज़ पहचान सीमित हो सकती है</div>' +
        '<div id="kqTranscript" class="kq-transcript"></div>' +
        '<div id="kqYouSaid" class="kq-you-said" style="display:none;"></div>' +
        '<div id="kqState" class="kq-state">बोलने के लिए माइक दबाएं</div>' +
        '<div class="kq-input-row">' +
          '<input id="kqTextInput" class="kq-text-input" type="text" placeholder="यहाँ टाइप करें…" />' +
          '<button id="kqTextSend" class="kq-send-btn">भेजें</button>' +
        '</div>' +
      '</div>' +
      '<div id="kqLangOverlay" class="kq-lang-overlay" style="display:none;">' +
        '<div class="kq-lang-box">' +
          '<div class="kq-lang-title">अपनी भाषा चुनें<br/><span class="kq-lang-title-en">Choose your language</span></div>' +
          '<div id="kqLangList" class="kq-lang-list"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  function renderLangList(container, onPick) {
    container.innerHTML = '';
    LANGUAGES.forEach(function (lang) {
      var btn = document.createElement('button');
      btn.className = 'kq-lang-option' + (lang.sttMode === 'text-only' ? ' kq-lang-textonly' : '');
      btn.innerHTML = '<span class="kq-lang-native">' + lang.name + '</span>' +
        '<span class="kq-lang-eng">' + lang.engName + '</span>' +
        (lang.sttMode === 'text-only' ? '<span class="kq-lang-badge">⌨️ टाइप करें</span>' : '<span class="kq-lang-badge kq-lang-badge-voice">🎙️ Voice</span>');
      btn.addEventListener('click', function () { onPick(lang.code); });
      container.appendChild(btn);
    });
  }

  /* ===================================================================
   * 10. PUBLIC init()
   * =================================================================== */
  function init(options) {
    options = options || {};
    if (document.getElementById('kqVoiceRoot')) return; // already initialised on this page

    var root = buildUI();
    var micFab = root.querySelector('#kqMicFab');
    var panel = root.querySelector('#kqPanel');
    var closeBtn = root.querySelector('#kqCloseBtn');
    var langBtn = root.querySelector('#kqLangBtn');
    var stateEl = root.querySelector('#kqState');
    var transcriptEl = root.querySelector('#kqTranscript');
    var youSaidEl = root.querySelector('#kqYouSaid');
    var textInput = root.querySelector('#kqTextInput');
    var textSend = root.querySelector('#kqTextSend');
    var langOverlay = root.querySelector('#kqLangOverlay');
    var langList = root.querySelector('#kqLangList');
    var offlineBanner = root.querySelector('#kqOfflineBanner');
    var titleText = root.querySelector('#kqPanelTitleText');

    var currentLang = FarmerProfileService.getLanguage() || 'hi-IN';
    var listening = false;

    var ui = {
      showAssistantText: function (text, opts) {
        var bubble = document.createElement('div');
        bubble.className = 'kq-bubble kq-bubble-assistant';
        bubble.textContent = text;
        transcriptEl.appendChild(bubble);
        if (opts && opts.buttons) {
          var row = document.createElement('div');
          row.className = 'kq-btn-row';
          opts.buttons.forEach(function (b) {
            var btn = document.createElement('button');
            btn.className = 'kq-chip-btn';
            btn.textContent = b.label;
            btn.addEventListener('click', function () { cmd.handleButton(b.action, currentLang); });
            row.appendChild(btn);
          });
          transcriptEl.appendChild(row);
        }
        transcriptEl.scrollTop = transcriptEl.scrollHeight;
        stateEl.textContent = '🔊 बोल रहा हूँ…';
      },
      showUserText: function (text) {
        var bubble = document.createElement('div');
        bubble.className = 'kq-bubble kq-bubble-user';
        bubble.textContent = text;
        transcriptEl.appendChild(bubble);
        transcriptEl.scrollTop = transcriptEl.scrollHeight;
      },
      markTextOnly: function () { /* voice unavailable for this reply; text already shown */ },
      showMandiCards: function (mandis) {
        var wrap = document.createElement('div');
        wrap.className = 'kq-mandi-cards';
        mandis.forEach(function (m) {
          var card = document.createElement('div');
          card.className = 'kq-mandi-card';
          function row(text) {
            var r = document.createElement('div');
            r.className = 'kq-mandi-row';
            r.textContent = text;                       // textContent: centre names come from the database
            card.appendChild(r);
          }
          var name = document.createElement('div');
          name.className = 'kq-mandi-name';
          name.textContent = escapeText(m.name);
          card.appendChild(name);
          row('📍 ' + [m.address, m.district].filter(Boolean).join(', ') + (m.distance_km !== undefined ? ' · ' + m.distance_km + ' km' : ''));
          row('🕒 ' + (m.operating_hours || '—'));
          row('✅ ' + ((m.accepted_crops || []).map(function (c) { return c.name; }).join(', ') || '—'));
          wrap.appendChild(card);
        });
        transcriptEl.appendChild(wrap);
        transcriptEl.scrollTop = transcriptEl.scrollHeight;
      },
      showMandiComparison: function (mandis) {
        var table = document.createElement('table');
        table.className = 'kq-compare-table';
        function addRow(label, cellText) {
          var tr = document.createElement('tr');
          var th = document.createElement('td');
          th.textContent = label;
          tr.appendChild(th);
          mandis.forEach(function (m) {
            var td = document.createElement('td');
            td.textContent = cellText(m);
            tr.appendChild(td);
          });
          table.appendChild(tr);
        }
        addRow('', function (m) { return escapeText(m.name).split(' — ')[0]; });
        addRow('📏', function (m) { return m.distance_km !== undefined ? m.distance_km + ' km' : '—'; });
        addRow('🕒', function (m) { return m.operating_hours || '—'; });
        addRow('✅', function (m) { return String((m.accepted_crops || []).length); });
        transcriptEl.appendChild(table);
        transcriptEl.scrollTop = transcriptEl.scrollHeight;
      },
      showPaymentHistory: function (list) {
        var wrap = document.createElement('div');
        wrap.className = 'kq-mandi-cards';
        list.forEach(function (p) {
          var card = document.createElement('div');
          card.className = 'kq-mandi-card';
          var name = document.createElement('div');
          name.className = 'kq-mandi-name';
          name.textContent = (p.bookings && p.bookings.crops && p.bookings.crops.name) || '—';
          var line = document.createElement('div');
          line.className = 'kq-mandi-row';
          var when = new Date(p.payment_date || p.created_at);
          line.textContent = (p.status === 'CREDITED' ? '✅ ' : p.status === 'FAILED' ? '⚠️ ' : '⏳ ') +
            '₹' + Number(p.amount).toLocaleString('en-IN') + ' · ' + p.status +
            (isNaN(when.getTime()) ? '' : ' · ' + when.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
          card.appendChild(name);
          card.appendChild(line);
          wrap.appendChild(card);
        });
        transcriptEl.appendChild(wrap);
        transcriptEl.scrollTop = transcriptEl.scrollHeight;
      },
      openLanguagePicker: function () { langOverlay.style.display = 'flex'; }
    };

    var cmd = VoiceCommandService(ui);

    function setLang(code) {
      currentLang = code;
      FarmerProfileService.setLanguage(code);
      langOverlay.style.display = 'none';
      var cfg = getLangConfig(code);
      titleText.textContent = cfg.sttMode === 'voice' ? 'बोलकर पूछें' : (cfg.name);
      // The FAB is the only way to open the panel at all, so it must never be
      // hidden — only its icon/label change for languages with no browser
      // speech support. Clicking it still opens the panel either way (see
      // the click handler below, which focuses the text input instead of
      // starting speech recognition when sttMode !== 'voice').
      micFab.style.display = '';
      micFab.textContent = cfg.sttMode === 'voice' ? '🎙️' : '⌨️';
      var fabLabel = cfg.sttMode === 'voice'
        ? (cfg.engName === 'English' ? 'Ask by Voice' : cfg.name)
        : (cfg.engName === 'English' ? 'Ask by typing' : cfg.name + ' — टाइप करें');
      micFab.setAttribute('aria-label', fabLabel);
      micFab.setAttribute('title', fabLabel);
      stateEl.textContent = cfg.sttMode === 'voice'
        ? 'बोलने के लिए माइक दबाएं'
        : (cfg.note || 'इस भाषा के लिए टाइप करें।');
      ui.showAssistantText(t(code, 'languagePicked') || ('भाषा: ' + cfg.name));
    }

    renderLangList(langList, setLang);

    micFab.addEventListener('click', function () {
      panel.classList.add('kq-open');
      var cfg = getLangConfig(currentLang);
      if (cfg.sttMode !== 'voice') { textInput.focus(); return; }
      if (!SpeechToTextService.isBrowserSupported()) {
        ui.showAssistantText(t(currentLang, 'noSpeechApi'));
        return;
      }
      if (listening) { SpeechToTextService.stop(); return; }
      listening = true;
      stateEl.textContent = '🔴 सुन रहा हूँ…';
      micFab.classList.add('kq-listening');
      SpeechToTextService.start(currentLang, {
        onResult: function (r) {
          youSaidEl.style.display = 'block';
          youSaidEl.innerHTML = '<b>आपने कहा:</b> “' + r.transcript + '” <button class="kq-edit-btn" id="kqEditSaid">✏️</button>';
          if (r.isFinal) {
            stateEl.textContent = '⏳ समझ रहा हूँ…';
            handleUtterance(r.transcript);
          }
        },
        onError: function (err) {
          listening = false;
          micFab.classList.remove('kq-listening');
          if (err === 'not-allowed') ui.showAssistantText(t(currentLang, 'noMic'));
          else if (err === 'no-speech-api') ui.showAssistantText(t(currentLang, 'noSpeechApi'));
          else if (err === 'network') ui.showAssistantText(t(currentLang, 'network'));
          else ui.showAssistantText(t(currentLang, 'unclear'));
          stateEl.textContent = 'बोलने के लिए माइक दबाएं';
        },
        onEnd: function () { listening = false; micFab.classList.remove('kq-listening'); }
      });
    });

    function handleUtterance(text) {
      ui.showUserText(text);
      var parsed = FarmerIntentService.parse(text, currentLang);
      cmd.handle(parsed, currentLang);
      stateEl.textContent = 'बोलने के लिए माइक दबाएं';
    }

    // Let the farmer correct a misheard transcript, per spec.
    root.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'kqEditSaid') {
        var current = youSaidEl.textContent.replace(/^आपने कहा:\s*/, '').replace(/["“”]/g, '');
        textInput.value = current;
        textInput.focus();
      }
    });

    closeBtn.addEventListener('click', function () { panel.classList.remove('kq-open'); });
    langBtn.addEventListener('click', function () { ui.openLanguagePicker(); });

    textSend.addEventListener('click', function () {
      var val = textInput.value.trim();
      if (!val) return;
      textInput.value = '';
      handleUtterance(val);
    });
    textInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') textSend.click(); });

    function updateOffline() { offlineBanner.style.display = navigator.onLine ? 'none' : 'block'; }
    window.addEventListener('online', updateOffline);
    window.addEventListener('offline', updateOffline);
    updateOffline();

    // First-launch language picker (per spec: shown at first launch, then cached).
    if (!FarmerProfileService.getLanguage() && options.showLanguagePickerOnFirstLaunch !== false) {
      ui.openLanguagePicker();
    } else {
      setLang(currentLang);
    }
  }

  global.KisanVoice = {
    init: init,
    LANGUAGES: LANGUAGES,
    // Exposed for the standalone Node-based tests in test-intent-parser.js
    _internal: { FarmerIntentService: FarmerIntentService, DataService: DataService, STRINGS: STRINGS }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.KisanVoice;
  }

})(typeof window !== 'undefined' ? window : global);
