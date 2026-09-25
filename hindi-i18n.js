```javascript
(function () {
  'use strict';

  /*
   * ============================================================
   * KISAN QUEUE
   * Hindi / English Language System
   * Complete replacement version
   * ============================================================
   */

  var STORAGE_KEY = 'kisanQueueLanguage';

  var DICT = {

    /* =========================================================
       LANGUAGE
       ========================================================= */

    'English': 'अंग्रेज़ी',
    'Hindi': 'हिंदी',
    'हिंदी (Hindi)': 'हिंदी',
    'Language': 'भाषा',
    'Display language': 'डिस्प्ले भाषा',

    /* =========================================================
       MAIN NAVIGATION
       ========================================================= */

    'Home': 'होम',
    'Landing Home': 'मुख्य पृष्ठ',
    'Farmer Portal': 'किसान पोर्टल',
    'Farmer login': 'किसान लॉगिन',
    'Farmer Login': 'किसान लॉगिन',
    'Staff login': 'स्टाफ लॉगिन',
    'Staff Login': 'स्टाफ लॉगिन',

    'Farmer Registration': 'किसान पंजीकरण',
    'Slot Booking': 'स्लॉट बुकिंग',
    'Alerts': 'सूचनाएँ',
    'Operation Staff': 'ऑपरेशन स्टाफ',
    'Operation Dashboard': 'ऑपरेशन डैशबोर्ड',
    'Operations Dashboard': 'ऑपरेशंस डैशबोर्ड',
    'Queue Console': 'कतार कंसोल',
    'Q Console': 'क्यू कंसोल',
    'Reports & Analytics': 'रिपोर्ट्स और विश्लेषण',
    'Reports and Analytics': 'रिपोर्ट्स और विश्लेषण',
    'Settings': 'सेटिंग्स',
    'Notifications': 'सूचनाएँ',

    /* =========================================================
       LANDING PAGE
       ========================================================= */

    'Procurement Portal — Book Your Slot':
      'खरीद पोर्टल — अपना स्लॉट बुक करें',

    'Procurement Portal':
      'खरीद पोर्टल',

    'SIH26032 · Procurement made simple':
      'SIH26032 · खरीद को आसान बनाया गया',

    'Book your procurement slot. Skip the wait.':
      'अपना खरीद स्लॉट बुक करें। इंतज़ार से बचें।',

    'Check my status':
      'मेरी स्थिति देखें',

    'Start booking →':
      'बुकिंग शुरू करें →',

    'Already have a token? Use "Check my status" to see your queue position.':
      'क्या आपके पास पहले से टोकन है? अपनी कतार स्थिति देखने के लिए "मेरी स्थिति देखें" चुनें।',

    'Sample token card (illustration)':
      'नमूना टोकन कार्ड (चित्र)',

    'Your nearest procurement centre · Live queue updates':
      'आपका निकटतम खरीद केंद्र · लाइव कतार अपडेट',

    'How it works':
      'यह कैसे काम करता है',

    'Register once':
      'एक बार पंजीकरण करें',

    'Book a slot':
      'स्लॉट बुक करें',

    'Track your status':
      'अपनी स्थिति ट्रैक करें',

    'Find centre':
      'केंद्र खोजें',

    'Find a centre':
      'केंद्र खोजें',

    'Find a Centre':
      'केंद्र खोजें',

    /* =========================================================
       MARKET PRICES
       ========================================================= */

    'MANDI MARKET':
      'मंडी बाज़ार',

    "Today's Market Prices":
      'आज के बाज़ार भाव',

    'Market Prices':
      'बाज़ार भाव',

    'Market Price':
      'बाज़ार भाव',

    'Price':
      'भाव',

    'Prices':
      'भाव',

    'Check indicative crop prices before planning your visit.':
      'अपनी यात्रा की योजना बनाने से पहले फसल के अनुमानित भाव देखें।',

    'Updated today':
      'आज अपडेट किया गया',

    'per quintal':
      'प्रति क्विंटल',

    'Prices shown are indicative/demo values for the prototype. Connect an official mandi-price source before presenting them as live market prices.':
      'दिखाए गए भाव प्रोटोटाइप के लिए अनुमानित/डेमो मूल्य हैं। इन्हें लाइव बाज़ार भाव के रूप में दिखाने से पहले आधिकारिक मंडी-भाव स्रोत से कनेक्ट करें।',

    /* =========================================================
       CROPS
       ========================================================= */

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

    'Wheat':
      'गेहूँ',

    'Maize':
      'मक्का',

    'Mustard':
      'सरसों',

    'Paddy':
      'धान',

    'Rice':
      'चावल',

    'Gram':
      'चना',

    'Lentil':
      'मसूर',

    'Chickpea':
      'चना',

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

    /* =========================================================
       FARMER REGISTRATION
       ========================================================= */

    'My Profile - Kisan Queue Farmer Queue':
      'मेरी प्रोफ़ाइल - किसान क्यू',

    'Home / Farmer / My Profile':
      'होम / किसान / मेरी प्रोफ़ाइल',

    'My profile':
      'मेरी प्रोफ़ाइल',

    'Profile completion':
      'प्रोफ़ाइल पूर्णता',

    'Farmer details':
      'किसान विवरण',

    'Enter your details carefully. Select your crop and quantity first to find suitable procurement centres.':
      'अपनी जानकारी सावधानी से भरें। उपयुक्त खरीद केंद्र खोजने के लिए पहले फसल और मात्रा चुनें।',

    'Full name':
      'पूरा नाम',

    'Mobile number':
      'मोबाइल नंबर',

    'Village':
      'गाँव',

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

    'Select crop and quantity first':
      'पहले फसल और मात्रा चुनें',

    'Only centres accepting your selected crop will be shown.':
      'केवल आपकी चुनी हुई फसल स्वीकार करने वाले केंद्र दिखाए जाएंगे।',

    'Farmer ID':
      'किसान आईडी',

    'Leave blank if you do not have one.':
      'यदि आपके पास नहीं है तो खाली छोड़ें।',

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

    'Login':
      'लॉगिन',

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

    /* =========================================================
       FARMER LOGIN
       ========================================================= */

    '← Back home':
      '← होम पर वापस जाएँ',

    'Back home':
      'होम पर वापस जाएँ',

    'Farmer Login - Kisan Queue Farmer Queue':
      'किसान लॉगिन - किसान क्यू',

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

    /* =========================================================
       SLOT BOOKING
       ========================================================= */

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

    'Choose manually':
      'मैन्युअल रूप से चुनें',

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

    /* =========================================================
       BOOKING TOKEN
       ========================================================= */

    'Your Token — Procurement Portal':
      'आपका टोकन — खरीद पोर्टल',

    'Loading your booking…':
      'आपकी बुकिंग लोड हो रही है…',

    'Loading your booking...':
      'आपकी बुकिंग लोड हो रही है...',

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

    /* =========================================================
       PROCUREMENT STATUS
       ========================================================= */

    'My Procurement Status — Procurement Portal':
      'मेरी खरीद स्थिति — खरीद पोर्टल',

    'Loading your status…':
      'आपकी स्थिति लोड हो रही है…',

    'Loading your status...':
      'आपकी स्थिति लोड हो रही है...',

    'No active booking':
      'कोई सक्रिय बुकिंग नहीं',

    "You don't have a procurement slot booked right now.":
      'अभी आपका कोई खरीद स्लॉट बुक नहीं है।',

    "Couldn't load your status":
      'आपकी स्थिति लोड नहीं हो सकी',

    'Check your internet connection and try again.':
      'अपना इंटरनेट कनेक्शन जाँचें और फिर प्रयास करें।',

    'Retry':
      'पुनः प्रयास करें',

    /* =========================================================
       FARMER DASHBOARD
       ========================================================= */

    'My Dashboard — SIH26032 Procurement Portal':
      'मेरा डैशबोर्ड — SIH26032 खरीद पोर्टल',

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

    'View token':
      'टोकन देखें',

    'Recent activity':
      'हाल की गतिविधि',

    /* =========================================================
       CENTRE FINDER
       ========================================================= */

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

    /* =========================================================
       LIVE QUEUE
       ========================================================= */

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

    /* =========================================================
       NOTIFICATIONS
       ========================================================= */

    'Notifications — Farmer Queue':
      'सूचनाएँ — किसान क्यू',

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

    /* =========================================================
       ALERTS
       ========================================================= */

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

    'Weather advisory':
      'मौसम सलाह',

    'Medium':
      'मध्यम',

    'Low':
      'कम',

    'Selected centre':
      'चयनित केंद्र',

    '2 hours ago':
      '2 घंटे पहले',

    'Yesterday':
      'कल',

    '3 days ago':
      '3 दिन पहले',

    'Timing change this week':
      'इस सप्ताह समय में बदलाव',

    'New quality check process':
      'नई गुणवत्ता जाँच प्रक्रिया',

    'All centres':
      'सभी केंद्र',

    'No alerts right now':
      'अभी कोई अलर्ट नहीं है',

    /* =========================================================
       STAFF LOGIN
       ========================================================= */

    'Staff Login — SIH26032 Procurement Portal':
      'स्टाफ लॉगिन — SIH26032 खरीद पोर्टल',

    'STAFF LOGIN PORTAL':
      'स्टाफ लॉगिन पोर्टल',

    'Run the centre floor from one screen.':
      'एक ही स्क्रीन से केंद्र का संचालन करें।',

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

    'Signed in':
      'साइन इन हो गया',

    'Redirecting to your dashboard…':
      'आपके डैशबोर्ड पर भेजा जा रहा है…',

    'Redirecting to your dashboard...':
      'आपके डैशबोर्ड पर भेजा जा रहा है...',

    /* =========================================================
       OPERATIONS DASHBOARD
       ========================================================= */

    "Today's Operations":
      'आज का संचालन',

    'Operations Dashboard — SIH26032 Procurement Portal':
      'ऑपरेशंस डैशबोर्ड — SIH26032 खरीद पोर्टल',

    'Loaded':
      'लोड हो गया',

    'Loading state':
      'लोडिंग स्थिति',

    'Empty-day state':
      'खाली-दिन स्थिति',

    'ALERT':
      'अलर्ट',

    'Counter 3 is offline — bookings are being redirected to Counters 1 and 2.':
      'काउंटर 3 ऑफलाइन है — बुकिंग काउंटर 1 और 2 पर भेजी जा रही हैं।',

    'Bookings today':
      'आज की बुकिंग',

    'Farmers waiting':
      'प्रतीक्षा कर रहे किसान',

    'Avg wait 22 min':
      'औसत प्रतीक्षा 22 मिनट',

    'Active counters':
      'सक्रिय काउंटर',

    'Counter 3 offline':
      'काउंटर 3 ऑफलाइन',

    'Completed today':
      'आज पूर्ण',

    'Pending cases':
      'लंबित मामले',

    'Needs review':
      'समीक्षा आवश्यक',

    'Bookings by hour':
      'घंटे के अनुसार बुकिंग',

    'Issue':
      'समस्या',

    'Pending':
      'लंबित',

    'No bookings yet today':
      'आज अभी कोई बुकिंग नहीं है',

    "Once farmers start booking slots at the selected procurement centre, they'll show up here.":
      'चयनित खरीद केंद्र पर किसान स्लॉट बुक करना शुरू करेंगे तो वे यहाँ दिखाई देंगे।',

    /* =========================================================
       QUEUE CONSOLE
       ========================================================= */

    'Queue Management — SIH26032 Procurement Portal':
      'कतार प्रबंधन — SIH26032 खरीद पोर्टल',

    'Queue management':
      'कतार प्रबंधन',

    'Queue date':
      'कतार की तारीख',

    'Manage bookings for the selected operating date.':
      'चयनित संचालन तारीख की बुकिंग प्रबंधित करें।',

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

    'Weighing discrepancy':
      'वज़न में अंतर',

    'Quality dispute':
      'गुणवत्ता विवाद',

    'Payment not confirmed':
      'भुगतान की पुष्टि नहीं हुई',

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

    /* =========================================================
       STATUS MANAGEMENT
       ========================================================= */

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

    /* =========================================================
       REPORTS
       ========================================================= */

    'Reports and Analytics — SIH26032 Procurement Portal':
      'रिपोर्ट्स और विश्लेषण — SIH26032 खरीद पोर्टल',

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
      'रिपोर्ट एक्सपोर्ट करें',

    'Total bookings':
      'कुल बुकिंग',

    'Avg waiting time':
      'औसत प्रतीक्षा समय',

    'Completed procurements':
      'पूर्ण खरीद',

    'Payment pending':
      'भुगतान लंबित',

    'Across all centres':
      'सभी केंद्रों में',

    'Bookings trend — by hour':
      'बुकिंग रुझान — घंटे के अनुसार',

    'Centre utilization':
      'केंद्र उपयोग',

    'Centre names are loaded from the procurement-centre directory.':
      'केंद्र के नाम खरीद-केंद्र निर्देशिका से लोड किए जाते हैं।',

    'Paid':
      'भुगतान हो गया',

    'No data for this period':
      'इस अवधि के लिए कोई डेटा नहीं है',

    'Reports will populate once bookings are recorded for the selected range.':
      'चयनित अवधि के लिए बुकिंग दर्ज होने के बाद रिपोर्ट यहाँ दिखाई देंगी।',

    /* =========================================================
       SETTINGS
       ========================================================= */

    'Settings — SIH26032 Procurement Portal':
      'सेटिंग्स — SIH26032 खरीद पोर्टल',

    'Language, display, notifications, and help — for this device only.':
      'भाषा, डिस्प्ले, सूचनाएँ और सहायता — केवल इस डिवाइस के लिए।',

    'Changes the language used across the staff portal.':
      'स्टाफ पोर्टल में उपयोग होने वाली भाषा बदलता है।',

    'Display and accessibility':
      'डिस्प्ले और सुगम्यता',

    'Font size':
      'फ़ॉन्ट आकार',

    'Adjusts text size across this portal.':
      'पूरे पोर्टल में टेक्स्ट का आकार बदलता है।',

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

    "Slot confirmations":
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

    'App information':
      'ऐप जानकारी',

    'Portal':
      'पोर्टल',

    'Version':
      'संस्करण',

    'Assigned centre from staff account':
      'स्टाफ खाते से निर्धारित केंद्र',

    'Data mode':
      'डेटा मोड',

    'Connected staff portal':
      'कनेक्टेड स्टाफ पोर्टल',

    'Send feedback':
      'फीडबैक भेजें',

    /* =========================================================
       COMMON BUTTONS / WORDS
       ========================================================= */

    'Logout':
      'लॉग आउट',

    'Log out':
      'लॉग आउट',

    'Submit':
      'जमा करें',

    'Save':
      'सहेजें',

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

    'Search':
      'खोजें',

    'Refresh':
      'रिफ्रेश करें',

    'Loading':
      'लोड हो रहा है...',

    'Select':
      'चुनें',

    'Select an option':
      'एक विकल्प चुनें',

    'Name':
      'नाम',

    'Phone':
      'फ़ोन',

    'Mobile':
      'मोबाइल',

    'Address':
      'पता',

    'Status':
      'स्थिति',

    'Time':
      'समय',

    'Action':
      'कार्रवाई',

    'Actions':
      'कार्रवाइयाँ',

    'Details':
      'विवरण',

    'Information':
      'जानकारी',

    'Centre details':
      'केंद्र विवरण',

    'Today':
      'आज',

    'Tomorrow':
      'कल',

    'Yesterday':
      'कल',

    'Date':
      'तारीख',

    'Time slot':
      'समय स्लॉट',

    'Booking':
      'बुकिंग',

    'Token':
      'टोकन',

    'Farmer':
      'किसान',

    'Staff':
      'स्टाफ',

    'Centre':
      'केंद्र',

    'Counter':
      'काउंटर',

    'Payment':
      'भुगतान',

    'Payments':
      'भुगतान',

    'Report':
      'रिपोर्ट',

    'Reports':
      'रिपोर्ट्स',

    'Analytics':
      'विश्लेषण',

    'Dashboard':
      'डैशबोर्ड',

    'Queue':
      'कतार',

    'Procurement':
      'खरीद',

    'Produce':
      'उपज',

    'Quantity':
      'मात्रा',

    'Village':
      'गाँव',

    'District':
      'जिला',

    'Location':
      'लोकेशन',

    'Role':
      'भूमिका',

    'Operator':
      'ऑपरेटर',

    'Supervisor':
      'सुपरवाइज़र',

    'Administrator':
      'प्रशासक',

    'Admin':
      'एडमिन'
  };


  /* ============================================================
     REVERSE DICTIONARY
     ============================================================ */

  var reverse = Object.create(null);

  Object.keys(DICT).forEach(function (en) {
    var hi = DICT[en];

    if (hi && hi !== en && !reverse[hi]) {
      reverse[hi] = en;
    }
  });


  /* ============================================================
     NORMALIZE TEXT
     ============================================================ */

  function norm(value) {
    return String(value == null ? '' : value)
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }


  /* ============================================================
     ESCAPE REGEX
     ============================================================ */

  function escapeRegExp(value) {
    return String(value).replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );
  }


  /* ============================================================
     TRANSLATE ONE STRING
     ============================================================ */

  function direct(value, lang) {

    var original = String(value == null ? '' : value);

    var n = norm(original);

    if (!n) {
      return original;
    }


    /* ----------------------------------------------------------
       HINDI
       ---------------------------------------------------------- */

    if (lang === 'hi') {

      /*
       * First try exact translation.
       */
      if (DICT[n] !== undefined) {
        return DICT[n];
      }


      /*
       * Then translate phrases inside longer strings.
       *
       * Longest phrases are replaced first so that:
       *
       * "Procurement Status Management"
       *
       * is handled before:
       *
       * "Status"
       */

      var result = original;

      var keys = Object.keys(DICT)
        .filter(function (key) {

          return (
            key &&
            key !== DICT[key] &&
            /[A-Za-z]/.test(key)
          );

        })
        .sort(function (a, b) {

          return b.length - a.length;

        });


      keys.forEach(function (key) {

        var translated = DICT[key];

        if (!translated || translated === key) {
          return;
        }

        var escaped = escapeRegExp(key);

        /*
         * Case-sensitive replacement.
         *
         * This prevents words inside larger English words
         * from being accidentally replaced.
         */

        result = result.replace(
          new RegExp(
            '(?<![A-Za-z])' +
            escaped +
            '(?![A-Za-z])',
            'g'
          ),
          translated
        );

      });


      /*
       * Extra common procurement phrases.
       */

      result = result
        .replace(
          /Kisan Procurement Centre/g,
          'किसान खरीद केंद्र'
        )
        .replace(
          /Procurement Centre/g,
          'खरीद केंद्र'
        )
        .replace(
          /procurement centre/g,
          'खरीद केंद्र'
        )
        .replace(
          /Procurement Center/g,
          'खरीद केंद्र'
        )
        .replace(
          /procurement center/g,
          'खरीद केंद्र'
        );


      return result;
    }


    /* ----------------------------------------------------------
       ENGLISH
       ---------------------------------------------------------- */

    if (reverse[n] !== undefined) {
      return reverse[n];
    }


    var resultEn = original;

    var reverseKeys = Object.keys(reverse)
      .filter(function (key) {

        return key && reverse[key];

      })
      .sort(function (a, b) {

        return b.length - a.length;

      });


    reverseKeys.forEach(function (key) {

      var english = reverse[key];

      var escaped = escapeRegExp(key);

      resultEn = resultEn.replace(
        new RegExp(escaped, 'g'),
        english
      );

    });


    return resultEn
      .replace(
        /किसान खरीद केंद्र/g,
        'Kisan Procurement Centre'
      )
      .replace(
        /खरीद केंद्र/g,
        'Procurement Centre'
      );
  }


  /* ============================================================
     GET CURRENT LANGUAGE
     ============================================================ */

  function getLanguage() {

    try {

      var saved = localStorage.getItem(STORAGE_KEY);

      if (saved === 'hi' || saved === 'en') {
        return saved;
      }

    } catch (e) {}

    return 'en';
  }


  /* ============================================================
     SAVE LANGUAGE
     ============================================================ */

  function setLanguage(lang) {

    lang = lang === 'hi' ? 'hi' : 'en';

    try {

      localStorage.setItem(
        STORAGE_KEY,
        lang
      );

    } catch (e) {}

    document.documentElement.setAttribute(
      'lang',
      lang === 'hi' ? 'hi' : 'en'
    );

    document.documentElement.setAttribute(
      'data-language',
      lang
    );

    translatePage(lang);

    updateLanguageControls(lang);

    /*
     * Tell other scripts that the language changed.
     */

    try {

      window.dispatchEvent(
        new CustomEvent(
          'kq-language-change',
          {
            detail: {
              language: lang
            }
          }
        )
      );

    } catch (e) {}
  }


  /* ============================================================
     TRANSLATE TEXT NODE
     ============================================================ */

  function translateTextNode(node, lang) {

    if (!node || node.nodeType !== 3) {
      return;
    }

    /*
     * Do not modify script/style/code/pre elements.
     */

    var parent = node.parentElement;

    if (!parent) {
      return;
    }

    var tag = parent.tagName;

    if (
      tag === 'SCRIPT' ||
      tag === 'STYLE' ||
      tag === 'CODE' ||
      tag === 'PRE' ||
      tag === 'NOSCRIPT'
    ) {
      return;
    }


    var text = node.nodeValue;

    if (!text || !norm(text)) {
      return;
    }


    var translated = direct(
      text,
      lang
    );


    if (translated !== text) {
      node.nodeValue = translated;
    }
  }


  /* ============================================================
     TRANSLATE ATTRIBUTES
     ============================================================ */

  function translateAttributes(element, lang) {

    if (!element || element.nodeType !== 1) {
      return;
    }


    /*
     * Placeholder
     */

    if (element.hasAttribute('placeholder')) {

      var placeholder =
        element.getAttribute('placeholder');

      var translatedPlaceholder =
        direct(
          placeholder,
          lang
        );

      if (
        translatedPlaceholder !==
        placeholder
      ) {

        element.setAttribute(
          'placeholder',
          translatedPlaceholder
        );

      }
    }


    /*
     * Title
     */

    if (element.hasAttribute('title')) {

      var title =
        element.getAttribute('title');

      var translatedTitle =
        direct(
          title,
          lang
        );

      if (
        translatedTitle !== title
      ) {

        element.setAttribute(
          'title',
          translatedTitle
        );

      }
    }


    /*
     * aria-label
     */

    if (element.hasAttribute('aria-label')) {

      var aria =
        element.getAttribute('aria-label');

      var translatedAria =
        direct(
          aria,
          lang
        );

      if (
        translatedAria !== aria
      ) {

        element.setAttribute(
          'aria-label',
          translatedAria
        );

      }
    }


    /*
     * Input buttons
     */

    if (
      element.tagName === 'INPUT' &&
      (
        element.type === 'button' ||
        element.type === 'submit' ||
        element.type === 'reset'
      )
    ) {

      var inputValue =
        element.value;

      var translatedValue =
        direct(
          inputValue,
          lang
        );

      if (
        translatedValue !==
        inputValue
      ) {

        element.value =
          translatedValue;

      }
    }

  }


  /* ============================================================
     TRANSLATE PAGE
     ============================================================ */

  function translatePage(lang) {

    lang =
      lang === 'hi'
        ? 'hi'
        : 'en';


    /*
     * Translate normal visible text.
     */

    var walker =
      document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );


    var nodes = [];

    var current;

    while (
      (current = walker.nextNode())
    ) {

      nodes.push(current);

    }


    nodes.forEach(function (node) {

      translateTextNode(
        node,
        lang
      );

    });


    /*
     * Translate attributes.
     */

    var elements =
      document.querySelectorAll('*');

    elements.forEach(function (element) {

      translateAttributes(
        element,
        lang
      );

    });


    /*
     * Translate page title.
     */

    if (document.title) {

      document.title =
        direct(
          document.title,
          lang
        );

    }


    /*
     * Update HTML language.
     */

    document.documentElement.setAttribute(
      'lang',
      lang === 'hi'
        ? 'hi'
        : 'en'
    );

    document.documentElement.setAttribute(
      'data-language',
      lang
    );

  }


  /* ============================================================
     LANGUAGE SELECTOR
     ============================================================ */

  function updateLanguageControls(lang) {

    var selectors =
      document.querySelectorAll(
        '[data-language-selector], #languageSelect, #language-selector, select[name="language"]'
      );


    selectors.forEach(function (select) {

      if (
        select &&
        select.tagName === 'SELECT'
      ) {

        if (
          select.querySelector(
            'option[value="hi"]'
          )
        ) {

          select.value = lang;

        }

      }

    });


    /*
     * Buttons using data-lang.
     */

    var buttons =
      document.querySelectorAll(
        '[data-lang]'
      );


    buttons.forEach(function (button) {

      var buttonLang =
        button.getAttribute(
          'data-lang'
        );

      if (
        buttonLang === lang
      ) {

        button.classList.add(
          'active'
        );

        button.setAttribute(
          'aria-pressed',
          'true'
        );

      } else {

        button.classList.remove(
          'active'
        );

        button.setAttribute(
          'aria-pressed',
          'false'
        );

      }

    });

  }


  /* ============================================================
     SELECTOR EVENTS
     ============================================================ */

  function setupLanguageControls() {

    /*
     * Select dropdown.
     */

    document.addEventListener(
      'change',
      function (event) {

        var target =
          event.target;

        if (!target) {
          return;
        }


        if (
          target.matches &&
          target.matches(
            '[data-language-selector], #languageSelect, #language-selector, select[name="language"]'
          )
        ) {

          setLanguage(
            target.value
          );

        }

      }
    );


    /*
     * Buttons.
     */

    document.addEventListener(
      'click',
      function (event) {

        var target =
          event.target;

        if (!target) {
          return;
        }


        var button =
          target.closest
            ? target.closest(
                '[data-lang]'
              )
            : null;


        if (!button) {
          return;
        }


        var lang =
          button.getAttribute(
            'data-lang'
          );


        if (
          lang === 'hi' ||
          lang === 'en'
        ) {

          event.preventDefault();

          setLanguage(lang);

        }

      }
    );

  }


  /* ============================================================
     MUTATION OBSERVER
     ============================================================ */

  function setupObserver() {

    if (
      typeof MutationObserver ===
      'undefined'
    ) {
      return;
    }


    var observer =
      new MutationObserver(
        function (mutations) {

          var lang =
            getLanguage();


          mutations.forEach(
            function (mutation) {

              /*
               * Newly added nodes.
               */

              if (
                mutation.addedNodes &&
                mutation.addedNodes.length
              ) {

                mutation.addedNodes.forEach(
                  function (node) {

                    if (
                      node.nodeType === 3
                    ) {

                      translateTextNode(
                        node,
                        lang
                      );

                    }


                    if (
                      node.nodeType === 1
                    ) {

                      translateAttributes(
                        node,
                        lang
                      );


                      var walker =
                        document.createTreeWalker(
                          node,
                          NodeFilter.SHOW_TEXT,
                          null,
                          false
                        );


                      var child;

                      while (
                        (child =
                          walker.nextNode())
                      ) {

                        translateTextNode(
                          child,
                          lang
                        );

                      }


                      var children =
                        node.querySelectorAll
                          ? node.querySelectorAll('*')
                          : [];


                      children.forEach(
                        function (childElement) {

                          translateAttributes(
                            childElement,
                            lang
                          );

                        }
                      );

                    }

                  }
                );

              }

            }
          );

        }
      );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
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

        translatePage(
          getLanguage()
        );

      },

    dictionary:
      DICT

  };


  /* ============================================================
     INITIALIZE
     ============================================================ */

  function initialize() {

    var lang =
      getLanguage();


    document.documentElement.setAttribute(
      'lang',
      lang
    );

    document.documentElement.setAttribute(
      'data-language',
      lang
    );


    setupLanguageControls();

    translatePage(lang);

    updateLanguageControls(lang);

    setupObserver();

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize
    );

  } else {

    initialize();

  }

})();
```
