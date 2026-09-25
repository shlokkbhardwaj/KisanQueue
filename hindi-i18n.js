```javascript
/* ============================================================
   KISAN QUEUE
   COMPLETE HINDI / ENGLISH TRANSLATION SYSTEM

   Fixes:
   - Globe language icon
   - Hindi / English switching
   - Mixed English + Hindi
   - Dynamic JavaScript text
   - Buttons
   - Placeholders
   - Titles
   - aria-label
   - Farmer pages
   - Staff pages
   - Reports
   - Queue console
   - Alerts
   - Settings
   ============================================================ */

(function () {
  'use strict';

  var KEY = 'kq_language';

  /* ============================================================
     TRANSLATION DICTIONARY
     ============================================================ */

  var DICT = {

    /* ---------- LANGUAGE ---------- */

    'English': 'English',
    'Hindi': 'हिंदी',
    'Hindi (Hindi)': 'हिंदी',
    'हिंदी': 'हिंदी',
    'हिन्दी': 'हिन्दी',
    'Language': 'भाषा',
    'Display language': 'डिस्प्ले भाषा',

    /* ---------- MAIN NAVIGATION ---------- */

    'Home': 'होम',
    'Farmer Portal': 'किसान पोर्टल',
    'Farmer login': 'किसान लॉगिन',
    'Farmer Login': 'किसान लॉगिन',
    'Staff login': 'स्टाफ लॉगिन',
    'Staff Login': 'स्टाफ लॉगिन',
    'Farmer Registration': 'किसान पंजीकरण',
    'Slot Booking': 'स्लॉट बुकिंग',
    'Operation Staff': 'ऑपरेशन स्टाफ',
    'Operation Dashboard': 'ऑपरेशन डैशबोर्ड',
    'Queue Console': 'कतार कंसोल',
    'Q Console': 'क्यू कंसोल',
    'Reports & Analytics': 'रिपोर्ट्स और विश्लेषण',
    'Reports and Analytics': 'रिपोर्ट्स और विश्लेषण',
    'Settings': 'सेटिंग्स',
    'Notifications': 'सूचनाएँ',
    'Alerts': 'अलर्ट',
    'Log out': 'लॉग आउट',
    'Logout': 'लॉग आउट',
    'Login': 'लॉगिन',

    /* ---------- LANDING PAGE ---------- */

    'Procurement Portal — Book Your Slot':
      'खरीद पोर्टल — अपना स्लॉट बुक करें',

    'SIH26032 · Procurement made simple':
      'SIH26032 · खरीद को आसान बनाना',

    'Book your procurement slot. Skip the wait.':
      'अपना खरीद स्लॉट बुक करें। इंतज़ार से बचें।',

    'No more standing in line for hours without knowing when your turn will come. Book a slot, get a token, and track your status — all from your phone.':
      'अब अपनी बारी का इंतज़ार करते हुए घंटों लाइन में खड़े रहने की जरूरत नहीं। स्लॉट बुक करें, टोकन प्राप्त करें और अपने फोन से अपनी स्थिति देखें।',

    'Start booking →':
      'बुकिंग शुरू करें →',

    'Check my status':
      'मेरी स्थिति देखें',

    'Already have a token? Use "Check my status" to see your queue position.':
      'क्या आपके पास पहले से टोकन है? अपनी कतार स्थिति देखने के लिए "मेरी स्थिति देखें" चुनें।',

    'Sample token card (illustration)':
      'नमूना टोकन कार्ड (चित्र)',

    'Your nearest procurement centre · Live queue updates':
      'आपका निकटतम खरीद केंद्र · लाइव कतार अपडेट',

    'Find centre':
      'केंद्र खोजें',

    'Find a centre':
      'केंद्र खोजें',

    'How it works':
      'यह कैसे काम करता है',

    'Register once':
      'एक बार पंजीकरण करें',

    'Add your details and preferred procurement centre — takes less than two minutes.':
      'अपनी जानकारी और पसंदीदा खरीद केंद्र जोड़ें — इसमें दो मिनट से भी कम समय लगता है।',

    'Book a slot':
      'स्लॉट बुक करें',

    'Pick a centre, date, and time that works for you. Get an instant digital token.':
      'अपने लिए सुविधाजनक केंद्र, तारीख और समय चुनें। तुरंत डिजिटल टोकन प्राप्त करें।',

    'Track your status':
      'अपनी स्थिति ट्रैक करें',

    'See your live queue position and procurement status — no need to call or ask around.':
      'अपनी लाइव कतार स्थिति और खरीद की स्थिति देखें — कॉल करने या पूछताछ करने की जरूरत नहीं।',

    'SIH26032 · Farmer Procurement Portal — a project for smoother, fairer procurement.':
      'SIH26032 · किसान खरीद पोर्टल — सरल और पारदर्शी खरीद के लिए एक परियोजना।',

    'Farmer helpline (toll-free):':
      'किसान हेल्पलाइन (टोल-फ्री):',

    'Unable to log in or register? Call our farmer helpline (toll-free):':
      'लॉगिन या पंजीकरण में परेशानी? हमारी किसान हेल्पलाइन (टोल-फ्री) पर कॉल करें:',

    /* ---------- MARKET PRICES ---------- */

    'MANDI MARKET':
      'मंडी बाज़ार',

    "Today's Market Prices":
      'आज के बाज़ार भाव',

    "Today's Market Price":
      'आज का बाज़ार भाव',

    'Market':
      'बाज़ार',

    'Markets':
      'बाज़ार',

    'Market Price':
      'बाज़ार भाव',

    'Market Prices':
      'बाज़ार भाव',

    'Market price':
      'बाज़ार भाव',

    'Market prices':
      'बाज़ार भाव',

    'Price':
      'भाव',

    'Prices':
      'भाव',

    'Crop prices':
      'फसल के भाव',

    'Current market price':
      'वर्तमान बाज़ार भाव',

    "Today's price":
      'आज का भाव',

    'per quintal':
      'प्रति क्विंटल',

    'Per quintal':
      'प्रति क्विंटल',

    'Check indicative crop prices before planning your visit.':
      'अपनी यात्रा की योजना बनाने से पहले फसल के अनुमानित भाव देखें।',

    'Updated today':
      'आज अपडेट किया गया',

    'Prices shown are indicative/demo values for the prototype. Connect an official mandi-price source before presenting them as live market prices.':
      'दिखाए गए भाव प्रोटोटाइप के लिए अनुमानित/डेमो मूल्य हैं। इन्हें लाइव बाज़ार भाव के रूप में दिखाने से पहले आधिकारिक मंडी-भाव स्रोत से कनेक्ट करें।',

    /* ---------- CROPS ---------- */

    'Select Crop':
      'फसल चुनें',

    'Select crop':
      'फसल चुनें',

    'Select crop:':
      'फसल चुनें:',

    'Crop':
      'फसल',

    'Crop / produce type':
      'फसल / उपज का प्रकार',

    'Paddy':
      'धान',

    'Rice':
      'चावल',

    'Wheat':
      'गेहूँ',

    'Maize':
      'मक्का',

    'Mustard':
      'सरसों',

    'Gram':
      'चना',

    'Chickpea':
      'चना',

    'Lentil':
      'मसूर',

    'Bajra':
      'बाजरा',

    'Barley':
      'जौ',

    'Soybean':
      'सोयाबीन',

    'Cotton':
      'कपास',

    'Groundnut':
      'मूंगफली',

    'Sugarcane':
      'गन्ना',

    'Tur':
      'अरहर',

    'Arhar':
      'अरहर',

    'Moong':
      'मूंग',

    'Sesame':
      'तिल',

    'Jowar':
      'ज्वार',

    'Ragi':
      'रागी',

    'Peas':
      'मटर',

    'Potato':
      'आलू',

    'Onion':
      'प्याज़',

    'Tomato':
      'टमाटर',

    'Apple':
      'सेब',

    'Banana':
      'केला',

    'Mango':
      'आम',

    /* ---------- FARMER REGISTRATION ---------- */

    'My Profile - Kisan Queue Farmer Queue':
      'मेरी प्रोफ़ाइल - किसान क्यू',

    'Home / Farmer / My Profile':
      'होम / किसान / मेरी प्रोफ़ाइल',

    'My profile':
      'मेरी प्रोफ़ाइल',

    'Register your farmer details to access procurement centre services.':
      'खरीद केंद्र की सेवाओं का उपयोग करने के लिए अपने किसान विवरण दर्ज करें।',

    'Profile completion':
      'प्रोफ़ाइल पूर्णता',

    'Farmer details':
      'किसान विवरण',

    'Enter your details carefully. Select your crop and quantity first to find suitable procurement centres.':
      'अपनी जानकारी सावधानी से भरें। उपयुक्त खरीद केंद्र खोजने के लिए पहले फसल और मात्रा चुनें।',

    'NAME':
      'नाम',

    'Full name':
      'पूरा नाम',

    'MOBILE':
      'मोबाइल',

    'Mobile number':
      'मोबाइल नंबर',

    'VILLAGE':
      'गाँव',

    'Village':
      'गाँव',

    'DISTRICT':
      'जिला',

    'District':
      'जिला',

    'Select the crop you want to take for procurement.':
      'वह फसल चुनें जिसे आप खरीद के लिए लाना चाहते हैं।',

    'Loading crops...':
      'फसलें लोड हो रही हैं...',

    'Loading crops…':
      'फसलें लोड हो रही हैं…',

    'Quantity (quintals)':
      'मात्रा (क्विंटल)',

    'Quantity (quintal)':
      'मात्रा (क्विंटल)',

    'Quantity':
      'मात्रा',

    'Enter quantity before selecting a centre.':
      'केंद्र चुनने से पहले मात्रा दर्ज करें।',

    'Procurement centre':
      'खरीद केंद्र',

    'Procurement Centre':
      'खरीद केंद्र',

    'procurement centre':
      'खरीद केंद्र',

    'Kisan Procurement Centre':
      'किसान खरीद केंद्र',

    'Select crop and quantity first':
      'पहले फसल और मात्रा चुनें',

    'Only centres accepting your selected crop will be shown.':
      'केवल आपकी चुनी हुई फसल स्वीकार करने वाले केंद्र दिखाए जाएंगे।',

    'FARMER ID':
      'किसान आईडी',

    'Farmer ID':
      'किसान आईडी',

    'Leave blank if you do not have one.':
      'यदि आपके पास नहीं है तो खाली छोड़ें।',

    'PASSWORD (hashed on the server; never stored in the browser)':
      'पासवर्ड (सर्वर पर सुरक्षित रूप से हैश किया जाता है; ब्राउज़र में संग्रहीत नहीं होता)',

    'Password':
      'पासवर्ड',

    'Show':
      'दिखाएँ',

    'Hide':
      'छिपाएँ',

    'Use letters and numbers. Do not use your mobile number.':
      'अक्षरों और संख्याओं का उपयोग करें। अपना मोबाइल नंबर इस्तेमाल न करें।',

    'Confirm password':
      'पासवर्ड की पुष्टि करें',

    'Already registered?':
      'पहले से पंजीकृत हैं?',

    'Log in':
      'लॉगिन करें',

    'Cancel':
      'रद्द करें',

    'Save profile':
      'प्रोफ़ाइल सहेजें',

    'Profile saved':
      'प्रोफ़ाइल सहेजी गई',

    'Your farmer profile has been successfully saved.':
      'आपकी किसान प्रोफ़ाइल सफलतापूर्वक सहेज ली गई है।',

    'Village / District':
      'गाँव / जिला',

    'Continue to slot booking':
      'स्लॉट बुकिंग पर जाएँ',

    'Edit profile':
      'प्रोफ़ाइल संपादित करें',

    /* ---------- FARMER LOGIN ---------- */

    'Farmer Login - Kisan Queue Farmer Queue':
      'किसान लॉगिन - किसान क्यू',

    '← Back home':
      '← होम पर वापस जाएँ',

    'Back home':
      'होम पर वापस जाएँ',

    'Log in with your mobile number and password to book a slot, see your token and check the queue.':
      'स्लॉट बुक करने, अपना टोकन देखने और कतार जाँचने के लिए मोबाइल नंबर और पासवर्ड से लॉगिन करें।',

    'Keep me logged in on this device':
      'इस डिवाइस पर मुझे लॉगिन रखें',

    'New to Kisan Queue?':
      'Kisan Queue पर नए हैं?',

    'Create an account':
      'खाता बनाएँ',

    'Forgot your password? Please contact your procurement centre or helpline to have it reset.':
      'पासवर्ड भूल गए? इसे रीसेट कराने के लिए अपने खरीद केंद्र या हेल्पलाइन से संपर्क करें।',

    /* ---------- SLOT BOOKING ---------- */

    'Book a Slot — Procurement Portal':
      'स्लॉट बुक करें — खरीद पोर्टल',

    'Book a procurement slot':
      'खरीद स्लॉट बुक करें',

    'Produce details':
      'उपज विवरण',

    'Please select your crop type':
      'कृपया अपनी फसल का प्रकार चुनें',

    'Enter your expected quantity':
      'अपेक्षित मात्रा दर्ज करें',

    'Choose a procurement centre':
      'खरीद केंद्र चुनें',

    '📍 Use my location':
      '📍 मेरी लोकेशन का उपयोग करें',

    'Use my location':
      'मेरी लोकेशन का उपयोग करें',

    'Choose manually':
      'मैन्युअल रूप से चुनें',

    'Search manually':
      'मैन्युअल रूप से खोजें',

    'Choose a date':
      'तारीख चुनें',

    'Available time slots':
      'उपलब्ध समय स्लॉट',

    'Review your booking':
      'अपनी बुकिंग की समीक्षा करें',

    'Centre':
      'केंद्र',

    'Date':
      'तारीख',

    'Time slot':
      'समय स्लॉट',

    'Back':
      'वापस',

    'Continue':
      'जारी रखें',

    'Slot booked!':
      'स्लॉट बुक हो गया!',

    'Your slot is booked. Show your token at the centre.':
      'आपका स्लॉट बुक हो गया है। केंद्र पर अपना टोकन दिखाएँ।',

    'Back to home':
      'होम पर वापस जाएँ',

    'View my token':
      'मेरा टोकन देखें',

    'Confirm this booking?':
      'इस बुकिंग की पुष्टि करें?',

    "Once confirmed, you'll receive a token for this slot.":
      'पुष्टि के बाद आपको इस स्लॉट के लिए टोकन मिलेगा।',

    'Confirm booking':
      'बुकिंग की पुष्टि करें',

    /* ---------- BOOKING TOKEN ---------- */

    'Your Token — Procurement Portal':
      'आपका टोकन — खरीद पोर्टल',

    'Loading your booking…':
      'आपकी बुकिंग लोड हो रही है…',

    'Loading your booking...':
      'आपकी बुकिंग लोड हो रही है...',

    'Loading your booking':
      'आपकी बुकिंग लोड हो रही है',

    'Loading…':
      'लोड हो रहा है…',

    'Loading...':
      'लोड हो रहा है...',

    'Copy':
      'कॉपी करें',

    'Download':
      'डाउनलोड करें',

    'Share':
      'शेयर करें',

    'Tokens ahead of you':
      'आपसे आगे टोकन',

    'Live queue':
      'लाइव कतार',

    'Cancel booking':
      'बुकिंग रद्द करें',

    'Before you arrive':
      'पहुँचने से पहले',

    'Arrive at least 10 minutes before your slot time.':
      'अपने स्लॉट समय से कम से कम 10 मिनट पहले पहुँचें।',

    'Bring your farmer ID if you have one registered.':
      'यदि किसान आईडी पंजीकृत है तो उसे साथ लाएँ।',

    'Show this token at the entry counter.':
      'प्रवेश काउंटर पर यह टोकन दिखाएँ।',

    'Check the live queue page to see how many tokens are ahead of you.':
      'आपसे आगे कितने टोकन हैं यह देखने के लिए लाइव कतार पेज देखें।',

    "This booking was cancelled. If this wasn't you, please contact the centre.":
      'यह बुकिंग रद्द कर दी गई है। यदि आपने इसे रद्द नहीं किया, तो केंद्र से संपर्क करें।',

    'Book a new slot':
      'नया स्लॉट बुक करें',

    "This slot has passed. You'll need to book a new slot to continue.":
      'यह स्लॉट बीत चुका है। आगे बढ़ने के लिए आपको नया स्लॉट बुक करना होगा।',

    'Something went wrong.':
      'कुछ गलत हो गया।',

    'Try again':
      'फिर से प्रयास करें',

    'Your booking is saved, but its queue token has not been generated yet.':
      'आपकी बुकिंग सुरक्षित है, लेकिन उसका कतार टोकन अभी नहीं बना है।',

    'Generate my token':
      'मेरा टोकन बनाएँ',

    'You do not have a booking yet.':
      'आपकी अभी कोई बुकिंग नहीं है।',

    /* ---------- PROCUREMENT STATUS ---------- */

    'My Procurement Status — Procurement Portal':
      'मेरी खरीद स्थिति — खरीद पोर्टल',

    'Loading your status…':
      'आपकी स्थिति लोड हो रही है…',

    'Loading your status...':
      'आपकी स्थिति लोड हो रही है...',

    'Tokens ahead of you':
      'आपसे आगे टोकन',

    'No active booking':
      'कोई सक्रिय बुकिंग नहीं',

    "You don't have a procurement slot booked right now.":
      'अभी आपका कोई खरीद स्लॉट बुक नहीं है।',

    "Couldn't load your status":
      'आपकी स्थिति लोड नहीं हो सकी',

    'Check your internet connection and try again.':
      'अपना इंटरनेट कनेक्शन जाँचें और फिर प्रयास करें।',

    'Check your connection and try again.':
      'अपना कनेक्शन जाँचें और फिर प्रयास करें।',

    'Retry':
      'पुनः प्रयास करें',

    /* ---------- FARMER DASHBOARD ---------- */

    'My Dashboard — SIH26032 Procurement Portal':
      'मेरा डैशबोर्ड — SIH26032 खरीद पोर्टल',

    'Suresh Yadav':
      'सुरेश यादव',

    'Kheri Village':
      'खेड़ी गाँव',

    'Namaste':
      'नमस्ते',

    "Here's what's happening with your procurement.":
      'आपकी खरीद से जुड़ी जानकारी यहाँ दिखाई दे रही है।',

    'Next step':
      'अगला कदम',

    'Your booking':
      'आपकी बुकिंग',

    'Live queue position':
      'लाइव कतार स्थिति',

    'Procurement status':
      'खरीद स्थिति',

    'Payment status':
      'भुगतान स्थिति',

    'Book a slot':
      'स्लॉट बुक करें',

    'View token':
      'टोकन देखें',

    'Live queue':
      'लाइव कतार',

    'Find a centre':
      'केंद्र खोजें',

    'Recent activity':
      'हाल की गतिविधि',

    /* ---------- CENTRE FINDER ---------- */

    'Find a Centre — Farmer Queue':
      'केंद्र खोजें — किसान क्यू',

    'Find a procurement centre':
      'खरीद केंद्र खोजें',

    'All':
      'सभी',

    'No centres found':
      'कोई केंद्र नहीं मिला',

    'Try a different village, district, or clear your filters.':
      'दूसरा गाँव या जिला चुनें, या अपने फ़िल्टर हटाएँ।',

    'Clear filters':
      'फ़िल्टर हटाएँ',

    'Location not available':
      'लोकेशन उपलब्ध नहीं है',

    'Turn on location access in your browser settings, or search by village or district instead.':
      'अपने ब्राउज़र की सेटिंग्स में लोकेशन की अनुमति दें, या इसके बजाय गाँव या जिले से खोजें।',

    /* ---------- LIVE QUEUE ---------- */

    'Live Queue — Farmer Queue':
      'लाइव कतार — किसान क्यू',

    'tokens ahead of you':
      'आपसे आगे टोकन',

    'This centre today':
      'आज इस केंद्र पर',

    'Ahead of you':
      'आपसे आगे',

    'This screen refreshes automatically every 15 seconds while you wait. Queue order is by slot time, then token number.':
      'आपके इंतज़ार के दौरान यह स्क्रीन हर 15 सेकंड में अपने आप अपडेट होती है। कतार का क्रम स्लॉट समय और फिर टोकन नंबर के अनुसार है।',

    'Open my token':
      'मेरा टोकन खोलें',

    /* ---------- NOTIFICATIONS ---------- */

    'Notifications — Farmer Queue':
      'सूचनाएँ — किसान क्यू',

    'Notifications':
      'सूचनाएँ',

    'Mark all as read':
      'सभी को पढ़ा हुआ चिह्नित करें',

    'Bookings':
      'बुकिंग',

    'Queue':
      'कतार',

    'Payments':
      'भुगतान',

    'Centre notices':
      'केंद्र सूचनाएँ',

    'No notifications yet':
      'अभी कोई सूचना नहीं है',

    "You'll see updates about your bookings and tokens here.":
      'आपकी बुकिंग और टोकन के अपडेट यहाँ दिखाई देंगे।',

    "Couldn't load notifications":
      'सूचनाएँ लोड नहीं हो सकीं',

    /* ---------- ALERTS ---------- */

    'Alerts — Farmer Queue':
      'अलर्ट — किसान क्यू',

    'Alerts & centre announcements':
      'अलर्ट और केंद्र घोषणाएँ',

    'Closures, delays, and important updates from your procurement centre.':
      'आपके खरीद केंद्र से बंद रहने, देरी और महत्वपूर्ण अपडेट।',

    'Sample announcements — centre alerts are not connected to a live data source yet. Your own booking and token updates are on the Notifications page.':
      'नमूना घोषणाएँ — केंद्र के अलर्ट अभी लाइव डेटा स्रोत से जुड़े नहीं हैं। आपकी बुकिंग और टोकन अपडेट सूचनाएँ पेज पर उपलब्ध हैं।',

    'Centre announcements will appear here':
      'केंद्र की घोषणाएँ यहाँ दिखाई देंगी',

    'Bookings are being redirected to Counters 1 and 2 — expect slightly longer waits today.':
      'बुकिंग काउंटर 1 और 2 पर भेजी जा रही हैं — आज थोड़ा अधिक इंतज़ार हो सकता है।',

    'Live centre announcements are not configured yet':
      'लाइव केंद्र घोषणाएँ अभी कॉन्फ़िगर नहीं हैं',

    'Weather advisory':
      'मौसम सलाह',

    'Medium':
      'मध्यम',

    'No centre-specific alert is currently published.':
      'फिलहाल इस केंद्र के लिए कोई विशेष अलर्ट प्रकाशित नहीं है।',

    'Selected centre':
      'चयनित केंद्र',

    '2 hours ago':
      '2 घंटे पहले',

    'Timing change this week':
      'इस सप्ताह समय में बदलाव',

    'Low':
      'कम',

    'Centre-specific closure notices will appear here when published by staff.':
      'स्टाफ द्वारा प्रकाशित किए जाने पर केंद्र बंद रहने की सूचनाएँ यहाँ दिखाई देंगी।',

    'Yesterday':
      'कल',

    'New quality check process':
      'नई गुणवत्ता जाँच प्रक्रिया',

    'Centres now use a faster two-step quality check — average wait times should improve.':
      'केंद्र अब तेज़ दो-चरणीय गुणवत्ता जाँच का उपयोग करते हैं — औसत प्रतीक्षा समय कम होना चाहिए।',

    'All centres':
      'सभी केंद्र',

    '3 days ago':
      '3 दिन पहले',

    'No alerts right now':
      'अभी कोई अलर्ट नहीं है',

    'Your procurement centres are running normally.':
      'आपके खरीद केंद्र सामान्य रूप से चल रहे हैं।',

    /* ---------- STAFF LOGIN ---------- */

    'Staff Login — SIH26032 Procurement Portal':
      'स्टाफ लॉगिन — SIH26032 खरीद पोर्टल',

    'STAFF LOGIN PORTAL':
      'स्टाफ लॉगिन पोर्टल',

    'Run the centre floor from one screen.':
      'एक ही स्क्रीन से केंद्र का संचालन करें।',

    "Sign in to manage today's queue, update procurement status, and track centre performance. This login page is for centre staff only — for farmer login use the public app.":
      'आज की कतार प्रबंधित करने, खरीद स्थिति अपडेट करने और केंद्र के प्रदर्शन को ट्रैक करने के लिए साइन इन करें। यह लॉगिन पेज केवल केंद्र स्टाफ के लिए है — किसान लॉगिन के लिए सार्वजनिक ऐप का उपयोग करें।',

    "Sign in to manage today's queue, update procurement status, and track centre performance.":
      'आज की कतार प्रबंधित करने, खरीद स्थिति अपडेट करने और केंद्र के प्रदर्शन को ट्रैक करने के लिए साइन इन करें।',

    'This login page is for centre staff only — for farmer login use the public app.':
      'यह लॉगिन पेज केवल केंद्र स्टाफ के लिए है — किसान लॉगिन के लिए सार्वजनिक ऐप का उपयोग करें।',

    "Need farmer access instead? That's a separate portal —":
      'किसान के रूप में प्रवेश चाहिए? उसके लिए अलग पोर्टल है —',

    'Your session expired. Sign in again to continue.':
      'आपका सत्र समाप्त हो गया है। जारी रखने के लिए फिर से साइन इन करें।',

    'Sign In':
      'साइन इन करें',

    'Select your role and enter your staff credentials. Your assigned procurement centre is loaded from your staff account.':
      'अपनी भूमिका चुनें और स्टाफ विवरण दर्ज करें। आपका निर्धारित खरीद केंद्र आपके स्टाफ खाते से लोड होगा।',

    'Operator':
      'ऑपरेटर',

    'Runs day-to-day queue':
      'दैनिक कतार का संचालन करता है',

    'Supervisor':
      'सुपरवाइज़र',

    'Oversees one centre':
      'एक केंद्र की निगरानी करता है',

    'Admin':
      'एडमिन',

    'Manages all centres':
      'सभी केंद्रों का प्रबंधन करता है',

    'Staff ID':
      'स्टाफ आईडी',

    'Enter your staff ID':
      'अपना स्टाफ आईडी दर्ज करें',

    'Incorrect staff ID or password':
      'गलत स्टाफ आईडी या पासवर्ड',

    'Select a role to continue':
      'जारी रखने के लिए भूमिका चुनें',

    'Staff accounts are created by an administrator. No passwords are stored in this page.':
      'स्टाफ खाते एडमिन द्वारा बनाए जाते हैं। इस पेज पर कोई पासवर्ड संग्रहीत नहीं किया जाता।',

    'Simulate a session-expired redirect →':
      'सत्र समाप्त होने के बाद रीडायरेक्ट का परीक्षण करें →',

    'Signed in':
      'साइन इन हो गया',

    'Redirecting to your dashboard…':
      'आपके डैशबोर्ड पर भेजा जा रहा है…',

    'Redirecting to your dashboard...':
      'आपके डैशबोर्ड पर भेजा जा रहा है...',

    /* ---------- OPERATIONS DASHBOARD ---------- */

    'Operations Dashboard — SIH26032 Procurement Portal':
      'ऑपरेशंस डैशबोर्ड — SIH26032 खरीद पोर्टल',

    "Today's Operations":
      'आज का संचालन',

    'Loaded':
      'लोड हो गया',

    'Loading state':
      'लोडिंग स्थिति',

    'Empty-day state':
      'खाली-दिन स्थिति',

    'ALERT':
      'अलर्ट',

    'Counter 3 is offline — bookings are being redirected to Counters 1 and 2.':
      'काउंटर 3 बंद है — बुकिंग काउंटर 1 और 2 पर भेजी जा रही हैं।',

    'Bookings today':
      'आज की बुकिंग',

    '12 more than yesterday':
      'कल से 12 अधिक',

    'Farmers waiting':
      'प्रतीक्षा कर रहे किसान',

    'Avg wait 22 min':
      'औसत प्रतीक्षा 22 मिनट',

    'Active counters':
      'सक्रिय काउंटर',

    'Counter 3 offline':
      'काउंटर 3 बंद है',

    'Completed today':
      'आज पूर्ण',

    "71% of today's bookings":
      'आज की बुकिंग का 71%',

    'Pending cases':
      'लंबित मामले',

    'Needs review':
      'समीक्षा आवश्यक',

    'Bookings by hour':
      'घंटे के अनुसार बुकिंग',

    'Pending cases':
      'लंबित मामले',

    'Weighing discrepancy':
      'वजन में अंतर',

    'Issue':
      'समस्या',

    'Awaiting quality check':
      'गुणवत्ता जाँच की प्रतीक्षा',

    'Pending':
      'लंबित',

    'Payment not confirmed':
      'भुगतान की पुष्टि नहीं हुई',

    'No bookings yet today':
      'आज अभी कोई बुकिंग नहीं है',

    "Once farmers start booking slots at the selected procurement centre, they'll show up here.":
      'चयनित खरीद केंद्र पर किसान स्लॉट बुक करना शुरू करेंगे तो वे यहाँ दिखाई देंगे।',

    /* ---------- QUEUE CONSOLE ---------- */

    'Queue Management — SIH26032 Procurement Portal':
      'कतार प्रबंधन — SIH26032 खरीद पोर्टल',

    'Queue management':
      'कतार प्रबंधन',

    'Queue date':
      'कतार की तारीख',

    'Manage bookings for the selected operating date.':
      'चयनित संचालन तारीख की बुकिंग प्रबंधित करें।',

    '0 farmers waiting':
      '0 किसान प्रतीक्षा में',

    'farmers waiting':
      'किसान प्रतीक्षा में',

    'Call the next token to an available counter':
      'अगला टोकन उपलब्ध काउंटर पर बुलाएँ',

    'Call next':
      'अगला बुलाएँ',

    'Currently serving':
      'वर्तमान में सेवा में',

    'Waiting queue':
      'प्रतीक्षा कतार',

    'On hold':
      'होल्ड पर',

    'Escalate token':
      'टोकन एस्केलेट करें',

    'Flag this booking for supervisor review.':
      'इस बुकिंग को सुपरवाइज़र समीक्षा के लिए चिह्नित करें।',

    'Reason':
      'कारण',

    'Quality dispute':
      'गुणवत्ता विवाद',

    'Farmer dispute':
      'किसान विवाद',

    'Other':
      'अन्य',

    'Note (optional)':
      'नोट (वैकल्पिक)',

    'Escalate':
      'एस्केलेट करें',

    'Mark as complete':
      'पूर्ण के रूप में चिह्नित करें',

    'Confirm this procurement is done.':
      'पुष्टि करें कि यह खरीद पूरी हो गई है।',

    'Mark complete':
      'पूर्ण चिह्नित करें',

    /* ---------- STATUS MANAGEMENT ---------- */

    'Procurement Status Management — SIH26032 Procurement Portal':
      'खरीद स्थिति प्रबंधन — SIH26032 खरीद पोर्टल',

    'Procurement status management':
      'खरीद स्थिति प्रबंधन',

    'Move each booking through checked-in, quality check, weighing, and acceptance.':
      'हर बुकिंग को चेक-इन, गुणवत्ता जाँच, वज़न और स्वीकृति के चरणों से आगे बढ़ाएँ।',

    'Active bookings':
      'सक्रिय बुकिंग',

    'Needs attention':
      'ध्यान देने की आवश्यकता',

    'Flag an issue':
      'समस्या चिह्नित करें',

    'This will pause the booking for supervisor review.':
      'यह बुकिंग को सुपरवाइज़र समीक्षा के लिए रोक देगा।',

    'Quality below standard':
      'गुणवत्ता मानक से कम',

    'Documentation mismatch':
      'दस्तावेज़ में असंगति',

    'Flag issue':
      'समस्या चिह्नित करें',

    /* ---------- REPORTS ---------- */

    'Reports and Analytics — SIH26032 Procurement Portal':
      'रिपोर्ट्स और विश्लेषण — SIH26032 खरीद पोर्टल',

    'Reports and Analytics':
      'रिपोर्ट्स और विश्लेषण',

    'Track bookings, waiting time, and centre performance over time.':
      'समय के साथ बुकिंग, प्रतीक्षा समय और केंद्र के प्रदर्शन को ट्रैक करें।',

    'Daily':
      'दैनिक',

    'Weekly':
      'साप्ताहिक',

    'Monthly':
      'मासिक',

    'Has data':
      'डेटा उपलब्ध है',

    'No-data state':
      'डेटा उपलब्ध नहीं',

    'Export report':
      'रिपोर्ट निर्यात करें',

    'Total bookings':
      'कुल बुकिंग',

    '12 more than previous period':
      'पिछली अवधि से 12 अधिक',

    'Avg waiting time':
      'औसत प्रतीक्षा समय',

    '22 min':
      '22 मिनट',

    '3 min less than previous period':
      'पिछली अवधि से 3 मिनट कम',

    'Completed procurements':
      'पूर्ण खरीद',

    '71% of total bookings':
      'कुल बुकिंग का 71%',

    'Payment pending':
      'भुगतान लंबित',

    'Across all centres':
      'सभी केंद्रों में',

    'Bookings trend — by hour':
      'बुकिंग रुझान — घंटे के अनुसार',

    'Centre utilization':
      'केंद्र उपयोगिता',

    'Centre names are loaded from the procurement-centre directory.':
      'केंद्रों के नाम खरीद केंद्र निर्देशिका से लोड किए जाते हैं।',

    'Payment status':
      'भुगतान स्थिति',

    'Paid':
      'भुगतान हो गया',

    'No data for this period':
      'इस अवधि के लिए कोई डेटा नहीं है',

    'Reports will populate once bookings are recorded for the selected range.':
      'चयनित अवधि में बुकिंग दर्ज होने के बाद रिपोर्ट यहाँ दिखाई देगी।',

    /* ---------- SETTINGS ---------- */

    'Settings — SIH26032 Procurement Portal':
      'सेटिंग्स — SIH26032 खरीद पोर्टल',

    'Staff':
      'स्टाफ',

    'Dashboard':
      'डैशबोर्ड',

    'Status management':
      'स्थिति प्रबंधन',

    'Reports':
      'रिपोर्ट्स',

    'Language, display, notifications, and help — for this device only.':
      'भाषा, डिस्प्ले, सूचनाएँ और सहायता — केवल इस डिवाइस के लिए।',

    'Changes the language used across the staff portal.':
      'स्टाफ पोर्टल में उपयोग होने वाली भाषा बदलें।',

    'हिंदी (Hindi)':
      'हिंदी',

    'Display and accessibility':
      'डिस्प्ले और सुगम्यता',

    'Font size':
      'फ़ॉन्ट आकार',

    'Adjusts text size across this portal.':
      'पूरे पोर्टल में टेक्स्ट का आकार बदलें।',

    'Adjust text size across this portal.':
      'पूरे पोर्टल में टेक्स्ट का आकार बदलें।',

    'High contrast':
      'उच्च कंट्रास्ट',

    'Increases color contrast for better visibility.':
      'बेहतर दृश्यता के लिए रंग कंट्रास्ट बढ़ाता है।',

    'Reduced motion':
      'कम गति',

    'Turns off animations and transitions.':
      'एनिमेशन और ट्रांज़िशन बंद करता है।',

    'Notification preferences':
      'सूचना प्राथमिकताएँ',

    'Slot confirmations':
      'स्लॉट पुष्टिकरण',

    "When a farmer's slot booking is confirmed or changed.":
      'किसान की स्लॉट बुकिंग की पुष्टि या बदलाव होने पर।',

    'Queue status changes':
      'कतार स्थिति बदलाव',

    'When tokens are called, held, or escalated.':
      'टोकन बुलाए, होल्ड या एस्केलेट होने पर।',

    'Payment updates':
      'भुगतान अपडेट',

    'When a payment is completed or still pending.':
      'भुगतान पूरा होने या लंबित रहने पर।',

    'Centre announcements':
      'केंद्र घोषणाएँ',

    'Closures, delays, and weather-related advisories.':
      'बंद रहने, देरी और मौसम संबंधी सलाह।',

    'Help and FAQ':
      'सहायता और FAQ',

    'How do I call the next token in the queue?':
      'मैं कतार में अगले टोकन को कैसे बुलाऊँ?',

    'Go to Queue management and use the "Call next" button, or call a specific waiting token directly from its card.':
      'कतार प्रबंधन में जाएँ और "अगला बुलाएँ" बटन का उपयोग करें, या किसी प्रतीक्षा कर रहे टोकन के कार्ड से सीधे उसे बुलाएँ।',

    'What happens when I escalate a booking?':
      'बुकिंग को एस्केलेट करने पर क्या होता है?',

    'The booking moves to "Needs attention" with your selected reason and note, so a supervisor can review it before it continues.':
      'बुकिंग आपके चुने हुए कारण और नोट के साथ "ध्यान देने की आवश्यकता" में चली जाती है, ताकि सुपरवाइज़र आगे बढ़ने से पहले उसकी समीक्षा कर सके।',

    'Can I undo marking a booking as complete?':
      'क्या मैं बुकिंग को पूर्ण चिह्नित करने की कार्रवाई वापस कर सकता हूँ?',

    'Not from this screen. If a booking was completed by mistake, ask a supervisor to reopen it from the reports section.':
      'इस स्क्रीन से नहीं। यदि कोई बुकिंग गलती से पूर्ण हो गई है, तो सुपरवाइज़र से रिपोर्ट अनुभाग से उसे दोबारा खोलने के लिए कहें।',

    'Who can I contact if a counter goes offline?':
      'यदि कोई काउंटर बंद हो जाए तो मैं किससे संपर्क करूँ?',

    'Report it to your centre supervisor immediately so bookings can be redirected to the remaining active counters.':
      'तुरंत अपने केंद्र सुपरवाइज़र को सूचित करें ताकि बुकिंग को बाकी सक्रिय काउंटरों पर भेजा जा सके।',

    'App information':
      'ऐप जानकारी',

    'Portal':
      'पोर्टल',

    'SIH26032 Staff Procurement Portal':
      'SIH26032 स्टाफ खरीद पोर्टल',

    'Version':
      'संस्करण',

    '1.0.0 (demo)':
      '1.0.0 (डेमो)',

    'Assigned centre from staff account':
      'स्टाफ खाते से निर्धारित केंद्र',

    'Data mode':
      'डेटा मोड',

    'Connected staff portal':
      'कनेक्टेड स्टाफ पोर्टल',

    'Send feedback':
      'फीडबैक भेजें',

    /* ---------- COMMON ---------- */

    'Farmer':
      'किसान',

    'Farmers':
      'किसान',

    'Registration':
      'पंजीकरण',

    'Register':
      'पंजीकरण करें',

    'Booking':
      'बुकिंग',

    'Staff':
      'स्टाफ',

    'Operations':
      'संचालन',

    'Analytics':
      'विश्लेषण',

    'Report':
      'रिपोर्ट',

    'Console':
      'कंसोल',

    'Procurement':
      'खरीद',

    'Token':
      'टोकन',

    'Status':
      'स्थिति',

    'Slot':
      'स्लॉट',

    'Time':
      'समय',

    'Day':
      'दिन',

    'Today':
      'आज',

    'Tomorrow':
      'कल',

    'Details':
      'विवरण',

    'Information':
      'जानकारी',

    'Search':
      'खोजें',

    'Select':
      'चुनें',

    'Select centre':
      'केंद्र चुनें',

    'Select date':
      'तारीख चुनें',

    'Select time':
      'समय चुनें',

    'Market rates':
      'बाज़ार दरें',

    'Rate':
      'दर',

    'Save':
      'सहेजें',

    'Submit':
      'जमा करें',

    'Close':
      'बंद करें',

    'Next':
      'अगला',

    'Previous':
      'पिछला',

    'Required':
      'आवश्यक',

    'Optional':
      'वैकल्पिक',

    'Success':
      'सफल',

    'Error':
      'त्रुटि',

    'Open':
      'खुला',

    'Closed':
      'बंद',

    'Available':
      'उपलब्ध',

    'Full':
      'भरा हुआ',

    'Waiting':
      'प्रतीक्षा में',

    'Called':
      'बुलाया गया',

    'Serving':
      'सेवा में',

    'Completed':
      'पूर्ण',

    'Cancelled':
      'रद्द',

    'Held':
      'होल्ड',

    'Skipped':
      'छोड़ा गया',

    'Recall':
      'फिर से बुलाएँ',

    'Resume':
      'फिर शुरू करें',

    'Hold':
      'होल्ड',

    'Complete':
      'पूर्ण करें',

    'Skip':
      'छोड़ें',

    'Serve':
      'सेवा शुरू करें',

    'Call':
      'बुलाएँ',

    'Yes':
      'हाँ',

    'No':
      'नहीं',

    'OK':
      'ठीक है',

    'Refresh':
      'रिफ्रेश करें',

    'Refresh queue':
      'कतार रिफ्रेश करें',

    'Current token':
      'वर्तमान टोकन',

    'Your token':
      'आपका टोकन',

    'Selected crop':
      'चयनित फसल',

    'Selected quantity':
      'चयनित मात्रा',

    'Book now':
      'अभी बुक करें',

    'Search centres':
      'केंद्र खोजें',

    'Nearest centre':
      'निकटतम केंद्र',

    'Centre Operator':
      'केंद्र ऑपरेटर',

    'Ramesh Kumar':
      'रमेश कुमार'

  };


  /* ============================================================
     BUILD REVERSE DICTIONARY
     ============================================================ */

  var reverse = Object.create(null);

  Object.keys(DICT).forEach(function (english) {

    var hindi = DICT[english];

    if (
      hindi &&
      hindi !== english &&
      !reverse[hindi]
    ) {
      reverse[hindi] = english;
    }

  });


  /* ============================================================
     ORIGINAL TEXT STORAGE
     ============================================================ */

  var originalText =
    new WeakMap();

  var originalAttrs =
    new WeakMap();


  /* ============================================================
     HELPERS
     ============================================================ */

  function norm(value) {

    return String(
      value == null ? '' : value
    )
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  }


  function escapeRegExp(value) {

    return String(value).replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

  }


  function preserveWhitespace(
    original,
    translated
  ) {

    var text =
      String(original);

    var leading =
      text.match(/^\s*/);

    var trailing =
      text.match(/\s*$/);

    return (
      (leading ? leading[0] : '') +
      translated +
      (trailing ? trailing[0] : '')
    );

  }


  /* ============================================================
     PHRASE REPLACEMENT
     ============================================================ */

  function replacePhrases(
    text,
    phrases,
    map
  ) {

    var result =
      String(text);

    phrases.forEach(
      function (phrase) {

        var translated =
          map[phrase];

        if (
          !translated ||
          translated === phrase
        ) {
          return;
        }

        var escaped =
          escapeRegExp(
            phrase
          );

        var startsWithEnglish =
          /^[A-Za-z0-9]/.test(
            phrase
          );

        var endsWithEnglish =
          /[A-Za-z0-9]$/.test(
            phrase
          );

        var pattern =
          (startsWithEnglish
            ? '(?<![A-Za-z0-9])'
            : '') +
          escaped +
          (endsWithEnglish
            ? '(?![A-Za-z0-9])'
            : '');

        try {

          result =
            result.replace(
              new RegExp(
                pattern,
                'g'
              ),
              translated
            );

        } catch (e) {}

      }
    );

    return result;

  }


  var englishPhrases =
    Object.keys(DICT)
      .filter(function (key) {

        return (
          key &&
          DICT[key] &&
          DICT[key] !== key
        );

      })
      .sort(function (a, b) {

        return b.length - a.length;

      });


  var hindiPhrases =
    Object.keys(reverse)
      .filter(function (key) {

        return key &&
          reverse[key];

      })
      .sort(function (a, b) {

        return b.length - a.length;

      });


  /* ============================================================
     TRANSLATE STRING
     ============================================================ */

  function direct(
    value,
    language
  ) {

    var original =
      String(
        value == null
          ? ''
          : value
      );

    var clean =
      norm(original);

    if (!clean) {
      return original;
    }


    /* ---------- HINDI ---------- */

    if (language === 'hi') {

      if (
        DICT[clean] !==
        undefined
      ) {

        return preserveWhitespace(
          original,
          DICT[clean]
        );

      }

      return replacePhrases(
        original,
        englishPhrases,
        DICT
      );

    }


    /* ---------- ENGLISH ---------- */

    if (
      reverse[clean] !==
      undefined
    ) {

      return preserveWhitespace(
        original,
        reverse[clean]
      );

    }


    return replacePhrases(
      original,
      hindiPhrases,
      reverse
    );

  }


  /* ============================================================
     REMEMBER ATTRIBUTES
     ============================================================ */

  function rememberAttributes(
    element
  ) {

    if (
      !element ||
      originalAttrs.has(element)
    ) {
      return;
    }

    originalAttrs.set(
      element,
      {

        placeholder:
          element.hasAttribute(
            'placeholder'
          )
            ? element.getAttribute(
                'placeholder'
              )
            : null,

        title:
          element.hasAttribute(
            'title'
          )
            ? element.getAttribute(
                'title'
              )
            : null,

        aria:
          element.hasAttribute(
            'aria-label'
          )
            ? element.getAttribute(
                'aria-label'
              )
            : null,

        alt:
          element.hasAttribute(
            'alt'
          )
            ? element.getAttribute(
                'alt'
              )
            : null,

        value:
          (
            element.tagName ===
              'INPUT' ||
            element.tagName ===
              'TEXTAREA'
          )
            ? element.value
            : null

      }
    );

  }


  /* ============================================================
     CAPTURE ORIGINAL DOM
     ============================================================ */

  function capture(
    root
  ) {

    if (!root) {
      return;
    }


    var walker =
      document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT
      );

    var node;


    while (
      (node =
        walker.nextNode())
    ) {

      var parent =
        node.parentElement;

      if (!parent) {
        continue;
      }

      if (
        /^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE)$/i.test(
          parent.tagName
        )
      ) {
        continue;
      }

      /*
       * Never capture the language selector.
       */

      if (
        parent.closest &&
        parent.closest(
          '.kq-i18n-control'
        )
      ) {
        continue;
      }


      if (
        !originalText.has(node)
      ) {

        originalText.set(
          node,
          node.nodeValue
        );

      }

    }


    /*
     * Capture attributes.
     */

    if (
      root.nodeType ===
      Node.ELEMENT_NODE
    ) {

      rememberAttributes(
        root
      );

    }


    var elements =
      root.querySelectorAll
        ? root.querySelectorAll(
            'input,textarea,button,[title],[aria-label],[alt]'
          )
        : [];


    elements.forEach(
      rememberAttributes
    );

  }


  /* ============================================================
     TRANSLATE ROOT
     ============================================================ */

  function translateRoot(
    root,
    language
  ) {

    if (!root) {
      return;
    }


    capture(root);


    var walker =
      document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT
      );

    var node;


    while (
      (node =
        walker.nextNode())
    ) {

      var parent =
        node.parentElement;

      if (!parent) {
        continue;
      }


      if (
        /^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE)$/i.test(
          parent.tagName
        )
      ) {
        continue;
      }


      /*
       * NEVER translate the globe control.
       */

      if (
        parent.closest &&
        parent.closest(
          '.kq-i18n-control'
        )
      ) {
        continue;
      }


      var base =
        originalText.get(
          node
        );


      if (
        base === undefined
      ) {

        base =
          node.nodeValue;

        originalText.set(
          node,
          base
        );

      }


      var translated =
        direct(
          base,
          language
        );


      if (
        node.nodeValue !==
        translated
      ) {

        node.nodeValue =
          translated;

      }

    }


    /*
     * Attributes.
     */

    var elements =
      root.querySelectorAll
        ? root.querySelectorAll(
            'input,textarea,button,[title],[aria-label],[alt]'
          )
        : [];


    elements.forEach(
      function (element) {

        if (
          element.closest &&
          element.closest(
            '.kq-i18n-control'
          )
        ) {
          return;
        }


        rememberAttributes(
          element
        );


        var attrs =
          originalAttrs.get(
            element
          );


        if (!attrs) {
          return;
        }


        if (
          attrs.placeholder !==
          null
        ) {

          element.placeholder =
            direct(
              attrs.placeholder,
              language
            );

        }


        if (
          attrs.title !==
          null
        ) {

          element.title =
            direct(
              attrs.title,
              language
            );

        }


        if (
          attrs.aria !==
          null
        ) {

          element.setAttribute(
            'aria-label',
            direct(
              attrs.aria,
              language
            )
          );

        }


        if (
          attrs.alt !==
          null
        ) {

          element.setAttribute(
            'alt',
            direct(
              attrs.alt,
              language
            )
          );

        }


        if (
          attrs.value !==
            null &&
          element.tagName ===
            'INPUT' &&
          /^(button|submit|reset)$/i.test(
            element.type
          )
        ) {

          element.value =
            direct(
              attrs.value,
              language
            );

        }

      }
    );

  }


  /* ============================================================
     ADD GLOBE LANGUAGE CONTROL
     ============================================================ */

  function addLanguageControl() {

    /*
     * If an existing selector is already present,
     * use it instead of creating a duplicate.
     */

    var existingSelect =
      document.getElementById(
        'languageSelect'
      ) ||
      document.getElementById(
        'langSelect'
      );


    var oldControl =
      document.querySelector(
        '.kq-i18n-control'
      );


    if (
      oldControl &&
      existingSelect
    ) {

      return;

    }


    /*
     * Remove broken/old generated control.
     */

    if (oldControl) {
      oldControl.remove();
    }


    /*
     * Create control.
     */

    var wrapper =
      document.createElement(
        'div'
      );

    wrapper.className =
      'kq-i18n-control';


    var button =
      document.createElement(
        'button'
      );

    button.type =
      'button';

    button.className =
      'kq-i18n-globe';

    button.innerHTML =
      '🌐';

    button.setAttribute(
      'aria-label',
      'Change language'
    );

    button.setAttribute(
      'title',
      'Change language'
    );


    var select =
      document.createElement(
        'select'
      );

    select.id =
      'languageSelect';

    select.setAttribute(
      'aria-label',
      'Language'
    );


    select.innerHTML =
      '<option value="en">English</option>' +
      '<option value="hi">हिन्दी</option>';


    wrapper.appendChild(
      button
    );

    wrapper.appendChild(
      select
    );


    document.body.appendChild(
      wrapper
    );


    /*
     * Change language.
     */

    select.addEventListener(
      'change',
      function () {

        setLanguage(
          select.value
        );

      }
    );


    /*
     * Globe opens dropdown.
     */

    button.addEventListener(
      'click',
      function () {

        try {

          if (
            typeof select.showPicker ===
            'function'
          ) {

            select.showPicker();

          } else {

            select.focus();

            select.click();

          }

        } catch (e) {

          select.focus();

        }

      }
    );


    /*
     * Initial language.
     */

    select.value =
      getLanguage();

  }


  /* ============================================================
     LANGUAGE
     ============================================================ */

  function getLanguage() {

    try {

      var saved =
        localStorage.getItem(
          KEY
        );


      if (
        saved === 'hi' ||
        saved === 'en'
      ) {

        return saved;

      }

    } catch (e) {}


    return 'en';

  }


  function setLanguage(
    language
  ) {

    language =
      language === 'hi'
        ? 'hi'
        : 'en';


    try {

      localStorage.setItem(
        KEY,
        language
      );

    } catch (e) {}


    /*
     * Translate the page.
     */

    translateRoot(
      document.body,
      language
    );


    /*
     * Page title.
     */

    if (
      !window.__kqOriginalTitle
    ) {

      window.__kqOriginalTitle =
        document.title;

    }


    if (
      window.__kqOriginalTitle
    ) {

      document.title =
        direct(
          window.__kqOriginalTitle,
          language
        );

    }


    /*
     * HTML language.
     */

    document.documentElement.lang =
      language;


    document.documentElement.setAttribute(
      'data-language',
      language
    );


    /*
     * Keep selector synchronized.
     */

    var select =
      document.getElementById(
        'languageSelect'
      );

    if (select) {

      select.value =
        language;

    }

  }


  /* ============================================================
     ADD CSS FOR GLOBE
     ============================================================ */

  function addControlCSS() {

    if (
      document.getElementById(
        'kq-i18n-style'
      )
    ) {
      return;
    }


    var style =
      document.createElement(
        'style'
      );

    style.id =
      'kq-i18n-style';


    style.textContent = `

      .kq-i18n-control {
        position: fixed;
        left: 20px;
        bottom: 20px;
        width: 52px;
        height: 52px;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .kq-i18n-globe {
        width: 52px;
        height: 52px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 25px;
        line-height: 1;
        background: #ffffff;
        box-shadow: 0 4px 16px rgba(0,0,0,.20);
        transition: transform .15s ease;
      }

      .kq-i18n-globe:hover {
        transform: scale(1.06);
      }

      .kq-i18n-globe:active {
        transform: scale(.96);
      }

      .kq-i18n-control select {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        z-index: 2;
      }

      @media (max-width: 600px) {
        .kq-i18n-control {
          left: 14px;
          bottom: 14px;
        }

        .kq-i18n-globe {
          width: 48px;
          height: 48px;
          font-size: 23px;
        }
      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* ============================================================
     DYNAMIC CONTENT OBSERVER
     ============================================================ */

  function setupObserver() {

    if (
      typeof MutationObserver ===
      'undefined'
    ) {
      return;
    }


    var timer =
      null;


    var observer =
      new MutationObserver(
        function (mutations) {

          var language =
            getLanguage();


          var roots =
            [];


          mutations.forEach(
            function (mutation) {

              mutation.addedNodes.forEach(
                function (node) {

                  if (
                    node.nodeType ===
                    Node.ELEMENT_NODE
                  ) {

                    if (
                      node.classList &&
                      node.classList.contains(
                        'kq-i18n-control'
                      )
                    ) {

                      return;

                    }


                    roots.push(
                      node
                    );

                  }

                }
              );


              if (
                mutation.type ===
                'characterData'
              ) {

                if (
                  mutation.target &&
                  mutation.target.parentElement
                ) {

                  roots.push(
                    mutation.target
                      .parentElement
                  );

                }

              }

            }
          );


          if (
            !roots.length
          ) {
            return;
          }


          if (timer) {
            clearTimeout(
              timer
            );
          }


          timer =
            setTimeout(
              function () {

                roots.forEach(
                  function (root) {

                    translateRoot(
                      root,
                      language
                    );

                  }
                );


                timer =
                  null;

              },
              20
            );

        }
      );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true,
        characterData: true
      }
    );

  }


  /* ============================================================
     PUBLIC API
     ============================================================ */

  window.KisanQueueI18n = {

    getLanguage:
      getLanguage,

    setLanguage:
      setLanguage,

    translate:
      function () {

        setLanguage(
          getLanguage()
        );

      },

    dictionary:
      DICT

  };


  /* ============================================================
     INITIALIZE
     ============================================================ */

  function init() {

    /*
     * IMPORTANT:
     * Capture the original English page BEFORE translating it.
     */

    capture(
      document.body
    );


    /*
     * Save original title.
     */

    if (
      window.__kqOriginalTitle ===
      undefined
    ) {

      window.__kqOriginalTitle =
        document.title || '';

    }


    /*
     * Add globe.
     */

    addControlCSS();

    addLanguageControl();


    /*
     * Apply saved language.
     */

    setLanguage(
      getLanguage()
    );


    /*
     * Watch dynamic content.
     */

    setupObserver();

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      { once: true }
    );

  } else {

    init();

  }

})();
```
