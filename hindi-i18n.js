/* Kisan Queue - shared, bidirectional Hindi/English translation layer. */
(function () {
  'use strict';

  var KEY = 'kq_language';

  var DICT = {
    'English':'English','हिंदी':'हिंदी','हिन्दी':'हिन्दी','Hindi':'हिंदी',
    'Farmer login':'किसान लॉगिन','Staff login':'स्टाफ लॉगिन','Home / Farmer / My Profile':'होम / किसान / मेरी प्रोफ़ाइल','My profile':'मेरी प्रोफ़ाइल',
    '← Back home':'← होम पर वापस जाएँ','Back home':'होम पर वापस जाएँ','Home':'होम','Log out':'लॉग आउट','Dashboard':'डैशबोर्ड','Settings':'सेटिंग्स',
    'Queue management':'कतार प्रबंधन','Status management':'स्थिति प्रबंधन','Reports':'रिपोर्ट','Reports and Analytics':'रिपोर्ट और विश्लेषण',
    'Notifications':'सूचनाएँ','Alerts & centre announcements':'अलर्ट और केंद्र घोषणाएँ','Live queue':'लाइव कतार','Centre finder':'केंद्र खोजें',
    'Book a procurement slot':'खरीद स्लॉट बुक करें','Book a slot':'स्लॉट बुक करें','Booking token':'बुकिंग टोकन','Procurement status':'खरीद स्थिति',
    'Find a procurement centre':'खरीद केंद्र खोजें','Find centre':'केंद्र खोजें','Use my location':'मेरी लोकेशन का उपयोग करें','Search manually':'मैन्युअल रूप से खोजें',
    'Choose a procurement centre':'खरीद केंद्र चुनें','Choose a date':'तारीख चुनें','Available time slots':'उपलब्ध समय स्लॉट','Review your booking':'अपनी बुकिंग की समीक्षा करें',
    'Produce details':'उपज विवरण','Crop / produce type':'फसल / उपज का प्रकार','Select crop':'फसल चुनें','Please select your crop type':'कृपया अपनी फसल का प्रकार चुनें',
    'Quantity (quintal)':'मात्रा (क्विंटल)','Enter your expected quantity':'अपेक्षित मात्रा दर्ज करें','Quantity (quintals)':'मात्रा (क्विंटल)','Enter quantity before selecting a centre.':'केंद्र चुनने से पहले मात्रा दर्ज करें।',
    'Crop':'फसल','Quantity':'मात्रा','Centre':'केंद्र','Date':'तारीख','Time slot':'समय स्लॉट','Back':'वापस','Continue':'जारी रखें','Cancel':'रद्द करें','Confirm booking':'बुकिंग की पुष्टि करें',
    'Slot booked!':'स्लॉट बुक हो गया!','Your slot is booked. Show your token at the centre.':'आपका स्लॉट बुक हो गया है। केंद्र पर अपना टोकन दिखाएँ।','Back to home':'होम पर वापस जाएँ','View my token':'मेरा टोकन देखें',
    'Confirm this booking?':'इस बुकिंग की पुष्टि करें?','Once confirmed, you\'ll receive a token for this slot.':'पुष्टि के बाद आपको इस स्लॉट के लिए टोकन मिलेगा।',
    'Loading…':'लोड हो रहा है…','Loading...':'लोड हो रहा है...','Loading your booking…':'आपकी बुकिंग लोड हो रही है…','Loading your status…':'आपकी स्थिति लोड हो रही है…','Loading your booking...':'आपकी बुकिंग लोड हो रही है...',
    'Loading your booking':'आपकी बुकिंग लोड हो रही है','Loading crops...':'फसलें लोड हो रही हैं...','Loaded':'लोड हो गया','Loading state':'लोडिंग स्थिति','Empty-day state':'खाली-दिन स्थिति',
    'tokens ahead of you':'आपसे आगे टोकन','Ahead of you':'आपसे आगे','This centre today':'आज इस केंद्र पर','This screen refreshes automatically every 15 seconds while you wait. Queue order is by slot time, then token number.':'आपके इंतज़ार के दौरान यह स्क्रीन हर 15 सेकंड में अपने आप अपडेट होती है। कतार का क्रम स्लॉट समय और फिर टोकन नंबर के अनुसार है।',
    'Open my token':'मेरा टोकन खोलें','Try again':'फिर से प्रयास करें','Retry':'पुनः प्रयास करें','Something went wrong.':'कुछ गलत हो गया।','No active booking':'कोई सक्रिय बुकिंग नहीं','You don\'t have a procurement slot booked right now.':'अभी आपका कोई खरीद स्लॉट बुक नहीं है।',
    'Couldn\'t load notifications':'सूचनाएँ लोड नहीं हो सकीं','Check your connection and try again.':'अपना कनेक्शन जाँचें और फिर प्रयास करें।','No notifications yet':'अभी कोई सूचना नहीं है','You\'ll see updates about your bookings and tokens here.':'आपकी बुकिंग और टोकन के अपडेट यहाँ दिखाई देंगे।',
    'Mark all as read':'सभी को पढ़ा हुआ चिह्नित करें','All':'सभी','Bookings':'बुकिंग','Queue':'कतार','Payments':'भुगतान','Centre notices':'केंद्र सूचनाएँ',
    'Namaste':'नमस्ते','Here\'s what\'s happening with your procurement.':'आपकी खरीद से जुड़ी जानकारी यहाँ दिखाई दे रही है।','Next step':'अगला कदम','Your booking':'आपकी बुकिंग','Live queue position':'लाइव कतार स्थिति','Payment status':'भुगतान स्थिति','Recent activity':'हाल की गतिविधि',
    'SIH26032 · Procurement made simple':'SIH26032 · खरीद को आसान बनाना','Book your procurement slot. Skip the wait.':'अपना खरीद स्लॉट बुक करें। इंतज़ार छोड़ें।','No more standing in line for hours without knowing when your turn will come. Book a slot, get a token, and track your status — all from your phone.':'अब घंटों लाइन में खड़े रहने की ज़रूरत नहीं। स्लॉट बुक करें, टोकन पाएं और अपनी स्थिति अपने फोन से ट्रैक करें।','Start booking →':'बुकिंग शुरू करें →','Check my status':'मेरी स्थिति देखें','Already have a token? Use "Check my status" to see your queue position.':'क्या आपके पास पहले से टोकन है? अपनी कतार स्थिति देखने के लिए "मेरी स्थिति देखें" चुनें।','Sample token card (illustration)':'नमूना टोकन कार्ड (चित्र)','Your nearest procurement centre · Live queue updates':'आपका निकटतम खरीद केंद्र · लाइव कतार अपडेट','How it works':'यह कैसे काम करता है','Register once':'एक बार पंजीकरण करें','Add your details and preferred procurement centre — takes less than two minutes.':'अपनी जानकारी और पसंदीदा खरीद केंद्र जोड़ें — इसमें दो मिनट से भी कम समय लगता है।','Pick a centre, date, and time that works for you. Get an instant digital token.':'अपने लिए सुविधाजनक केंद्र, तारीख और समय चुनें। तुरंत डिजिटल टोकन पाएं।','Track your status':'अपनी स्थिति ट्रैक करें','See your live queue position and procurement status — no need to call or ask around.':'अपनी लाइव कतार स्थिति और खरीद की स्थिति देखें — कॉल करने या पूछताछ करने की जरूरत नहीं।','Farmer helpline (toll-free):':'किसान हेल्पलाइन (टोल-फ्री):',
    'Unable to log in or register? Call our farmer helpline (toll-free):':'लॉगिन या पंजीकरण में परेशानी? हमारी किसान हेल्पलाइन (टोल-फ्री) पर कॉल करें:',
    'SIH26032 · Farmer Procurement Portal — a project for smoother, fairer procurement.':'SIH26032 · किसान खरीद पोर्टल — सरल और पारदर्शी खरीद के लिए एक परियोजना।',
    'Farmer details':'किसान विवरण','Enter your details carefully. Select your crop and quantity first to find suitable procurement centres.':'अपनी जानकारी सावधानी से भरें। उपयुक्त खरीद केंद्र खोजने के लिए पहले फसल और मात्रा चुनें।','NAME':'नाम','Full name':'पूरा नाम','MOBILE':'मोबाइल','Mobile number':'मोबाइल नंबर','VILLAGE':'गाँव','Village':'गाँव','DISTRICT':'जिला','District':'जिला',
    'Select the crop you want to take for procurement.':'वह फसल चुनें जिसे आप खरीद के लिए लाना चाहते हैं।','Procurement centre':'खरीद केंद्र','Select crop and quantity first':'पहले फसल और मात्रा चुनें','Only centres accepting your selected crop will be shown.':'केवल आपकी चुनी हुई फसल स्वीकार करने वाले केंद्र दिखाए जाएंगे।','FARMER ID':'किसान आईडी','Farmer ID':'किसान आईडी','Leave blank if you do not have one.':'यदि आपके पास नहीं है तो खाली छोड़ें।','PASSWORD (hashed on the server; never stored in the browser)':'पासवर्ड (सर्वर पर हैश किया जाता है; ब्राउज़र में कभी संग्रहीत नहीं होता)','Password':'पासवर्ड','Show':'दिखाएँ','Use letters and numbers. Do not use your mobile number.':'अक्षरों और संख्याओं का उपयोग करें। अपना मोबाइल नंबर न इस्तेमाल करें।','Confirm password':'पासवर्ड की पुष्टि करें','Already registered?':'पहले से पंजीकृत हैं?','Log in':'लॉगिन करें','Save profile':'प्रोफ़ाइल सहेजी गई','Edit profile':'प्रोफ़ाइल संपादित करें','Profile saved':'प्रोफ़ाइल सहेजी गई','Your farmer profile has been successfully saved.':'आपकी किसान प्रोफ़ाइल सफलतापूर्वक सहेज ली गई है।','Village / District':'गाँव / जिला','Continue to slot booking':'स्लॉट बुकिंग पर जाएँ',
    'Keep me logged in on this device':'इस डिवाइस पर मुझे लॉगिन रखें','New to Kisan Queue?':'Kisan Queue पर नए हैं?','Create an account':'खाता बनाएँ','Forgot your password? Please contact your procurement centre or helpline to have it reset.':'पासवर्ड भूल गए? इसे रीसेट कराने के लिए अपने खरीद केंद्र या हेल्पलाइन से संपर्क करें।',
    'Before you arrive':'पहुँचने से पहले','Arrive at least 10 minutes before your slot time.':'अपने स्लॉट समय से कम से कम 10 मिनट पहले पहुँचें।','Bring your farmer ID if you have one registered.':'यदि किसान आईडी पंजीकृत है तो उसे साथ लाएँ।','Show this token at the entry counter.':'प्रवेश काउंटर पर यह टोकन दिखाएँ।','Check the live queue page to see how many tokens are ahead of you.':'आपसे आगे कितने टोकन हैं यह देखने के लिए लाइव कतार पेज देखें।','This booking was cancelled. If this wasn\'t you, please contact the centre.':'यह बुकिंग रद्द कर दी गई है। यदि आपने इसे रद्द नहीं किया, तो केंद्र से संपर्क करें।','Book a new slot':'नया स्लॉट बुक करें','This slot has passed. You\'ll need to book a new slot to continue.':'यह स्लॉट बीत चुका है। आगे बढ़ने के लिए आपको नया स्लॉट बुक करना होगा।','Your booking is saved, but its queue token has not been generated yet.':'आपकी बुकिंग सुरक्षित है, लेकिन उसका कतार टोकन अभी नहीं बना है।','Generate my token':'मेरा टोकन बनाएँ','You do not have a booking yet.':'आपकी अभी कोई बुकिंग नहीं है।',
    'Alerts & centre announcements':'अलर्ट और केंद्र घोषणाएँ','Closures, delays, and important updates from your procurement centre.':'आपके खरीद केंद्र से बंद रहने, देरी और महत्वपूर्ण अपडेट।','Centre announcements will appear here':'केंद्र की घोषणाएँ यहाँ दिखाई देंगी','Live centre announcements are not configured yet':'लाइव केंद्र घोषणाएँ अभी कॉन्फ़िगर नहीं हैं','Weather advisory':'मौसम सलाह','Medium':'मध्यम','Low':'कम','Selected centre':'चयनित केंद्र','2 hours ago':'2 घंटे पहले','Yesterday':'कल','3 days ago':'3 दिन पहले','Timing change this week':'इस सप्ताह समय में बदलाव','New quality check process':'नई गुणवत्ता जाँच प्रक्रिया','All centres':'सभी केंद्र','No alerts right now':'अभी कोई अलर्ट नहीं है',
    'Today\'s Operations':'आज का संचालन','Bookings today':'आज की बुकिंग','Farmers waiting':'प्रतीक्षा कर रहे किसान','Avg wait 22 min':'औसत प्रतीक्षा 22 मिनट','Active counters':'सक्रिय काउंटर','Completed today':'आज पूर्ण','Pending cases':'लंबित मामले','Needs review':'समीक्षा आवश्यक','Bookings by hour':'घंटे के अनुसार बुकिंग','Issue':'समस्या','Pending':'लंबित','No bookings yet today':'आज अभी कोई बुकिंग नहीं है','Once farmers start booking slots at the selected procurement centre, they\'ll show up here.':'चयनित खरीद केंद्र पर किसान स्लॉट बुक करना शुरू करेंगे तो वे यहाँ दिखाई देंगे।','Counter 3 is offline — bookings are being redirected to Counters 1 and 2.':'काउंटर 3 बंद है — बुकिंग काउंटर 1 और 2 पर भेजी जा रही हैं।','12 more than yesterday':'कल से 12 अधिक','71% of today\'s bookings':'आज की बुकिंग का 71%','Counter 3 offline':'काउंटर 3 बंद है',
    'farmers waiting':'किसान प्रतीक्षा में','Call the next token to an available counter':'अगला टोकन उपलब्ध काउंटर पर बुलाएँ','Call next':'अगला बुलाएँ','Currently serving':'वर्तमान में सेवा','Waiting queue':'प्रतीक्षा कतार','On hold':'होल्ड पर','Escalate token':'टोकन एस्केलेट करें','Flag this booking for supervisor review.':'इस बुकिंग को सुपरवाइज़र समीक्षा के लिए चिन्हित करें।','Reason':'कारण','Weighing discrepancy':'वजन में अंतर','Quality dispute':'गुणवत्ता विवाद','Payment not confirmed':'भुगतान की पुष्टि नहीं','Farmer dispute':'किसान विवाद','Other':'अन्य','Note (optional)':'नोट (वैकल्पिक)','Escalate':'एस्केलेट करें','Mark as complete':'पूर्ण चिह्नित करें','Confirm this procurement is done.':'पुष्टि करें कि यह खरीद पूरी हो गई है।','Mark complete':'पूर्ण करें',
    'Procurement status management':'खरीद स्थिति प्रबंधन','Move each booking through checked-in, quality check, weighing, and acceptance.':'हर बुकिंग को चेक-इन, गुणवत्ता जाँच, वजन और स्वीकृति के चरणों से आगे बढ़ाएँ।','Active bookings':'सक्रिय बुकिंग','Needs attention':'ध्यान आवश्यक','Flag an issue':'समस्या चिन्हित करें','This will pause the booking for supervisor review.':'इससे बुकिंग सुपरवाइज़र समीक्षा तक रोक दी जाएगी।','Quality below standard':'गुणवत्ता मानक से कम','Documentation mismatch':'दस्तावेज़ में असंगति','Flag issue':'समस्या चिन्हित करें',
    'Track bookings, waiting time, and centre performance over time.':'समय के साथ बुकिंग, प्रतीक्षा समय और केंद्र के प्रदर्शन को ट्रैक करें।','Daily':'दैनिक','Weekly':'साप्ताहिक','Monthly':'मासिक','Export report':'रिपोर्ट निर्यात करें','Total bookings':'कुल बुकिंग','Avg waiting time':'औसत प्रतीक्षा समय','Completed procurements':'पूर्ण खरीद','Payment pending':'भुगतान लंबित','Across all centres':'सभी केंद्रों में','Bookings trend — by hour':'बुकिंग ट्रेंड — घंटे के अनुसार','Centre utilization':'केंद्र उपयोगिता','Centre names are loaded from the procurement-centre directory.':'केंद्रों के नाम खरीद केंद्र निर्देशिका से लोड किए जाते हैं।','Paid':'भुगतान हो गया','No data for this period':'इस अवधि के लिए कोई डेटा नहीं','Reports will populate once bookings are recorded for the selected range.':'चयनित अवधि में बुकिंग दर्ज होने के बाद रिपोर्ट यहाँ दिखाई देगी।','12 more than previous period':'पिछली अवधि से 12 अधिक','3 min less than previous period':'पिछली अवधि से 3 मिनट कम','71% of total bookings':'कुल बुकिंग का 71%',
    'Language, display, notifications, and help — for this device only.':'भाषा, डिस्प्ले, सूचनाएँ और सहायता — केवल इस डिवाइस के लिए।','Language':'भाषा','Display language':'डिस्प्ले भाषा','Changes the language used across the staff portal.':'स्टाफ पोर्टल में उपयोग होने वाली भाषा बदलें।','हिंदी (Hindi)':'हिंदी','Display and accessibility':'डिस्प्ले और सुगम्यता','Font size':'फ़ॉन्ट आकार','Adjust text size across this portal.':'पूरे पोर्टल में टेक्स्ट का आकार बदलें।','High contrast':'उच्च कंट्रास्ट','Increases color contrast for better visibility.':'बेहतर दृश्यता के लिए रंग कंट्रास्ट बढ़ाता है।','Reduced motion':'कम गति','Turns off animations and transitions.':'एनिमेशन और ट्रांज़िशन बंद करता है।','Notification preferences':'सूचना प्राथमिकताएँ','Slot confirmations':'स्लॉट पुष्टिकरण','When a farmer\'s slot booking is confirmed or changed.':'किसान की स्लॉट बुकिंग की पुष्टि या बदलाव होने पर।','Queue status changes':'कतार स्थिति बदलाव','When tokens are called, held, or escalated.':'टोकन बुलाए, होल्ड या एस्केलेट होने पर।','Payment updates':'भुगतान अपडेट','When a payment is completed or still pending.':'भुगतान पूरा होने या लंबित रहने पर।','Centre announcements':'केंद्र घोषणाएँ','Closures, delays, and weather-related advisories.':'बंद रहने, देरी और मौसम संबंधी सलाह।','Help and FAQ':'सहायता और FAQ','App information':'ऐप जानकारी','Portal':'पोर्टल','Version':'संस्करण','Assigned centre from staff account':'स्टाफ खाते से निर्धारित केंद्र','Data mode':'डेटा मोड','Connected staff portal':'कनेक्टेड स्टाफ पोर्टल','Send feedback':'फीडबैक भेजें',
    'Wheat':'गेहूँ','Maize':'मक्का','Mustard':'सरसों','Paddy':'धान','Kisan Procurement Centre':'किसान खरीद केंद्र','procurement centre':'खरीद केंद्र','Procurement Centre':'खरीद केंद्र','Centre Operator':'केंद्र ऑपरेटर','Ramesh Kumar':'रमेश कुमार','Suresh Yadav':'सुरेश यादव','Kheri Village':'खेड़ी गाँव',
    'My dashboard':'मेरा डैशबोर्ड','Farmer dashboard':'किसान डैशबोर्ड','Search centres':'केंद्र खोजें','Nearest centre':'निकटतम केंद्र','Selected crop':'चयनित फसल','Selected quantity':'चयनित मात्रा','Book now':'अभी बुक करें','Available':'उपलब्ध','Full':'भरा हुआ','Closed':'बंद','Open':'खुला','Refresh':'रिफ्रेश करें','Refresh queue':'कतार रिफ्रेश करें','Current token':'वर्तमान टोकन','Your token':'आपका टोकन','Waiting':'प्रतीक्षा में','Called':'बुलाया गया','Serving':'सेवा में','Completed':'पूर्ण','Cancelled':'रद्द','Held':'होल्ड','Skipped':'छोड़ा गया','Recall':'फिर से बुलाएँ','Resume':'फिर शुरू करें','Hold':'होल्ड','Complete':'पूर्ण करें','Skip':'छोड़ें','Serve':'सेवा शुरू करें','Call':'बुलाएँ','Logout':'लॉग आउट','Login':'लॉगिन','Submit':'जमा करें','Save':'सहेजें','Close':'बंद करें','Next':'अगला','Previous':'पिछला','Required':'आवश्यक','Optional':'वैकल्पिक','Success':'सफल','Error':'त्रुटि',

    /* Added: fill gaps found across page01-page16 so the whole app switches, not just parts of it. */
    '0 farmers waiting':'0 किसान प्रतीक्षा में','1.0.0 (demo)':'1.0.0 (डेमो)','10-digit mobile number':'10 अंकों का मोबाइल नंबर','22 min':'22 मिनट',
    'ALERT':'अलर्ट','Add any detail for the supervisor':'पर्यवेक्षक के लिए कोई भी विवरण जोड़ें','Adjusts text size across this portal.':'इस पोर्टल में टेक्स्ट का आकार समायोजित करता है।','Admin':'व्यवस्थापक',
    'Alerts — Farmer Queue':'अलर्ट — फार्मर क्यू','At least 8 characters':'कम से कम 8 अक्षर','Awaiting quality check':'गुणवत्ता जाँच की प्रतीक्षा में','Book a Slot — Procurement Portal':'स्लॉट बुक करें — खरीद पोर्टल',
    'Bookings are being redirected to Counters 1 and 2 — expect slightly longer waits today.':'बुकिंग काउंटर 1 और 2 पर भेजी जा रही हैं — आज थोड़ी अधिक प्रतीक्षा हो सकती है।','Can I undo marking a booking as complete?':'क्या बुकिंग को पूर्ण चिह्नित करने के बाद पूर्ववत किया जा सकता है?','Cancel booking':'बुकिंग रद्द करें',
    'Centre-specific closure notices will appear here when published by staff.':'स्टाफ द्वारा प्रकाशित होने पर केंद्र-विशिष्ट बंद होने की सूचनाएँ यहाँ दिखाई देंगी।','Centres now use a faster two-step quality check — average wait times should improve.':'केंद्र अब तेज़ दो-चरणीय गुणवत्ता जाँच का उपयोग कर रहे हैं — औसत प्रतीक्षा समय बेहतर होना चाहिए।',
    'Check indicative crop prices before planning your visit.':'अपनी यात्रा की योजना बनाने से पहले संकेतात्मक फसल मूल्य देख लें।','Check your internet connection and try again.':'अपना इंटरनेट कनेक्शन जाँचें और फिर प्रयास करें।','Choose manually':'मैन्युअल रूप से चुनें','Clear filters':'फ़िल्टर साफ़ करें',
    'Copy':'कॉपी करें','Couldn\'t load your status':'आपकी स्थिति लोड नहीं हो सकी','Download':'डाउनलोड करें','Enter district':'जिला दर्ज करें','Enter password':'पासवर्ड दर्ज करें','Enter village':'गाँव दर्ज करें',
    'Enter your full name':'अपना पूरा नाम दर्ज करें','Enter your password':'अपना पासवर्ड दर्ज करें','Enter your staff ID':'अपनी स्टाफ आईडी दर्ज करें','Farmer Login - Kisan Queue Farmer Queue':'किसान लॉगिन - Kisan Queue फार्मर क्यू',
    'Farmer Queue home':'फार्मर क्यू होम','Find a Centre — Farmer Queue':'केंद्र खोजें — फार्मर क्यू','Find a centre':'केंद्र खोजें',
    'Go to Queue management and use the "Call next" button, or call a specific waiting token directly from its card.':'"कतार प्रबंधन" पर जाएँ और "अगला बुलाएँ" बटन का उपयोग करें, या किसी प्रतीक्षारत टोकन को उसके कार्ड से सीधे बुलाएँ।',
    'Has data':'डेटा उपलब्ध है','How do I call the next token in the queue?':'मैं कतार में अगला टोकन कैसे बुलाऊँ?','Incorrect staff ID or password':'गलत स्टाफ आईडी या पासवर्ड',
    'Kavita Devi — Token #A227':'कविता देवी — टोकन #A227','Live Queue — Farmer Queue':'लाइव कतार — फार्मर क्यू','Location not available':'लोकेशन उपलब्ध नहीं',
    'Log in with your mobile number and password to book a slot, see your token and check the queue.':'स्लॉट बुक करने, अपना टोकन देखने और कतार जाँचने के लिए अपने मोबाइल नंबर और पासवर्ड से लॉगिन करें।','MANDI MARKET':'मंडी बाज़ार',
    'Manage bookings for the selected operating date.':'चयनित परिचालन तिथि के लिए बुकिंग प्रबंधित करें।','Manages all centres':'सभी केंद्रों का प्रबंधन करता है','Manoj Singh — Token #A231':'मनोज सिंह — टोकन #A231',
    'My Dashboard — SIH26032 Procurement Portal':'मेरा डैशबोर्ड — SIH26032 खरीद पोर्टल','My Procurement Status — Procurement Portal':'मेरी खरीद स्थिति — खरीद पोर्टल','My Profile - Kisan Queue Farmer Queue':'मेरी प्रोफ़ाइल - Kisan Queue फार्मर क्यू',
    'Need farmer access instead? That\'s a separate portal —':'किसान के रूप में लॉगिन करना है? वह एक अलग पोर्टल है —','No centre-specific alert is currently published.':'फ़िलहाल कोई केंद्र-विशिष्ट अलर्ट प्रकाशित नहीं है।','No centres found':'कोई केंद्र नहीं मिला','No-data state':'डेटा-रहित स्थिति',
    'Not from this screen. If a booking was completed by mistake, ask a supervisor to reopen it from the reports section.':'इस स्क्रीन से नहीं। यदि किसी बुकिंग को गलती से पूर्ण चिह्नित कर दिया गया है, तो पर्यवेक्षक से रिपोर्ट सेक्शन से इसे फिर से खोलने के लिए कहें।',
    'Notifications — Farmer Queue':'सूचनाएँ — फार्मर क्यू','Operations Dashboard — SIH26032 Procurement Portal':'संचालन डैशबोर्ड — SIH26032 खरीद पोर्टल','Operator':'ऑपरेटर','Optional farmer ID':'वैकल्पिक किसान आईडी','Oversees one centre':'एक केंद्र की देखरेख करता है',
    'Prices shown are indicative/demo values for the prototype. Connect an official mandi-price source before presenting them as live market prices.':'दिखाई गई कीमतें प्रोटोटाइप के लिए संकेतात्मक/डेमो मान हैं। इन्हें लाइव बाज़ार मूल्य के रूप में दिखाने से पहले किसी आधिकारिक मंडी-मूल्य स्रोत से जोड़ें।',
    'Procurement Portal — Book Your Slot':'खरीद पोर्टल — अपना स्लॉट बुक करें','Procurement Status Management — SIH26032 Procurement Portal':'खरीद स्थिति प्रबंधन — SIH26032 खरीद पोर्टल','Profile completion':'प्रोफ़ाइल पूर्णता',
    'Queue Management — SIH26032 Procurement Portal':'कतार प्रबंधन — SIH26032 खरीद पोर्टल','Queue date':'कतार तिथि','Redirecting to your dashboard…':'आपके डैशबोर्ड पर रीडायरेक्ट किया जा रहा है…',
    'Register your farmer details to access procurement centre services.':'खरीद केंद्र सेवाओं का उपयोग करने के लिए अपना किसान विवरण पंजीकृत करें।','Report it to your centre supervisor immediately so bookings can be redirected to the remaining active counters.':'तुरंत अपने केंद्र पर्यवेक्षक को सूचित करें ताकि बुकिंग को शेष सक्रिय काउंटरों पर भेजा जा सके।',
    'Reports and Analytics — SIH26032 Procurement Portal':'रिपोर्ट और विश्लेषण — SIH26032 खरीद पोर्टल','Run the centre floor from one screen.':'एक ही स्क्रीन से केंद्र का पूरा कामकाज चलाएँ।','Runs day-to-day queue':'दैनिक कतार का संचालन करता है',
    'SIH26032 Staff Procurement Portal':'SIH26032 स्टाफ खरीद पोर्टल','STAFF LOGIN PORTAL':'स्टाफ लॉगिन पोर्टल',
    'Sample announcements — centre alerts are not connected to a live data source yet. Your own booking and token updates are on the Notifications page.':'नमूना घोषणाएँ — केंद्र अलर्ट अभी लाइव डेटा स्रोत से जुड़े नहीं हैं। आपकी अपनी बुकिंग और टोकन अपडेट सूचनाएँ पेज पर हैं।',
    'Search by centre name or district':'केंद्र नाम या जिले से खोजें','Search centres by name or district':'नाम या जिले से केंद्र खोजें','Search village, district, or centre name':'गाँव, जिला या केंद्र नाम खोजें',
    'Search your nearest procurement centre — village, district or centre name':'अपना निकटतम खरीद केंद्र खोजें — गाँव, जिला या केंद्र का नाम','Select a role to continue':'जारी रखने के लिए एक भूमिका चुनें',
    'Select your role and enter your staff credentials. Your assigned procurement centre is loaded from your staff account.':'अपनी भूमिका चुनें और अपने स्टाफ क्रेडेंशियल दर्ज करें। आपका निर्धारित खरीद केंद्र आपके स्टाफ खाते से लोड होता है।',
    'Settings — SIH26032 Procurement Portal':'सेटिंग्स — SIH26032 खरीद पोर्टल','Share':'शेयर करें','Sign In':'साइन इन करें',
    'Sign in to manage today\'s queue, update procurement status, and track centre performance. This login page is for centre staff only — for farmer login use the public app.':'आज की कतार प्रबंधित करने, खरीद स्थिति अपडेट करने और केंद्र के प्रदर्शन को ट्रैक करने के लिए साइन इन करें। यह लॉगिन पेज केवल केंद्र स्टाफ के लिए है — किसान लॉगिन के लिए सार्वजनिक ऐप का उपयोग करें।',
    'Signed in':'साइन इन हो गया','Simulate a session-expired redirect →':'सत्र-समाप्ति रीडायरेक्ट का अनुकरण करें →','Staff':'स्टाफ','Staff ID':'स्टाफ आईडी','Staff Login — SIH26032 Procurement Portal':'स्टाफ लॉगिन — SIH26032 खरीद पोर्टल',
    'Staff accounts are created by an administrator. No passwords are stored in this page.':'स्टाफ खाते व्यवस्थापक द्वारा बनाए जाते हैं। इस पेज पर कोई पासवर्ड संग्रहीत नहीं होता।','Supervisor':'पर्यवेक्षक','Suresh Yadav — Token #A214':'सुरेश यादव — टोकन #A214',
    'The booking moves to "Needs attention" with your selected reason and note, so a supervisor can review it before it continues.':'बुकिंग आपके चुने गए कारण और नोट के साथ "ध्यान आवश्यक" में चली जाती है, ताकि आगे बढ़ने से पहले कोई पर्यवेक्षक इसकी समीक्षा कर सके।',
    'Today\'s Market Prices':'आज के बाज़ार मूल्य','Tokens ahead of you':'आपसे आगे टोकन','Try a different village, district, or clear your filters.':'कोई अलग गाँव, जिला आज़माएँ, या अपने फ़िल्टर साफ़ करें।',
    'Turn on location access in your browser settings, or search by village or district instead.':'अपने ब्राउज़र सेटिंग में लोकेशन एक्सेस चालू करें, या इसके बजाय गाँव या जिले से खोजें।','Type the password again':'पासवर्ड दोबारा टाइप करें','Updated today':'आज अपडेट किया गया','View token':'टोकन देखें',
    'What happens when I escalate a booking?':'जब कोई बुकिंग एस्केलेट की जाती है तो क्या होता है?','Who can I contact if a counter goes offline?':'यदि कोई काउंटर बंद हो जाए तो किससे संपर्क करें?','Your Token — Procurement Portal':'आपका टोकन — खरीद पोर्टल',
    'Your procurement centres are running normally.':'आपके खरीद केंद्र सामान्य रूप से चल रहे हैं।','Your session expired. Sign in again to continue.':'आपका सत्र समाप्त हो गया। जारी रखने के लिए फिर से साइन इन करें।','e.g. 25':'उदा. 25','e.g. OP001':'उदा. OP001','per quintal':'प्रति क्विंटल',
    '🌱 Gram':'🌱 चना','🌼 Mustard':'🌼 सरसों','🌽 Maize':'🌽 मक्का','🌾 Paddy':'🌾 धान','🌾 Wheat':'🌾 गेहूँ','🍚 Rice':'🍚 चावल','📍 Use my location':'📍 मेरी लोकेशन का उपयोग करें','🫘 Lentil':'🫘 दाल'
  };

  var reverse = Object.create(null);

  Object.keys(DICT).forEach(function (en) {
    var hi = DICT[en];
    if (hi && hi !== en && !reverse[hi]) {
      reverse[hi] = en;
    }
  });

  var originalText = new WeakMap();
  var originalAttrs = new WeakMap();
  var knownNodes = new WeakSet();
  var scheduled = false;
  /*
   * document.title lives in <head>, outside document.body, so the
   * walker never sees it. Track its canonical English value
   * separately and translate it whenever the language changes.
   */
  var originalTitle = null;

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function direct(s, lang) {
    var n = norm(s);

    if (!n) return s;

    if (lang === 'hi') {
      if (DICT[n] !== undefined) {
        return DICT[n];
      }

      return s
        .replace(/Kisan Procurement Centre/g, 'किसान खरीद केंद्र')
        .replace(/Procurement Centre/g, 'खरीद केंद्र')
        .replace(/procurement centre/g, 'खरीद केंद्र');
    }

    if (reverse[n] !== undefined) {
      return reverse[n];
    }

    return s
      .replace(/किसान खरीद केंद्र/g, 'Kisan Procurement Centre')
      .replace(/खरीद केंद्र/g, 'Procurement Centre');
  }

  function remember(el) {
    if (!el || originalAttrs.has(el)) return;

    originalAttrs.set(el, {
      placeholder: el.hasAttribute('placeholder')
        ? el.getAttribute('placeholder')
        : null,

      aria: el.hasAttribute('aria-label')
        ? el.getAttribute('aria-label')
        : null,

      title: el.hasAttribute('title')
        ? el.getAttribute('title')
        : null,

      value:
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
          ? el.value
          : null
    });
  }

  function capture(root, currentLang) {
    if (!root) return;

    currentLang = currentLang || 'en';

    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

    var t;

    while ((t = walker.nextNode())) {
      var p = t.parentElement;

      if (
        !p ||
        /^(SCRIPT|STYLE|NOSCRIPT)$/i.test(p.tagName)
      ) {
        continue;
      }

      if (!originalText.has(t)) {
        originalText.set(
          t,
          currentLang === 'hi'
            ? direct(t.nodeValue, 'en')
            : t.nodeValue
        );
      }

      knownNodes.add(t);
    }

    var els =
      root.nodeType === 1
        ? [root].concat(
            Array.from(
              root.querySelectorAll(
                'input[placeholder],textarea[placeholder],[aria-label],[title]'
              )
            )
          )
        : [];

    els.forEach(remember);
  }

  function translateRoot(root, lang) {
    if (!root) return;

    capture(root, lang);

    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

    var t;

    while ((t = walker.nextNode())) {
      var p = t.parentElement;

      if (
        !p ||
        /^(SCRIPT|STYLE|NOSCRIPT)$/i.test(p.tagName)
      ) {
        continue;
      }

      /*
       * Never translate the language selector itself.
       */
      if (p.closest && p.closest('.kq-i18n-control')) {
        continue;
      }

      var base = originalText.get(t);

      if (base === undefined) {
        originalText.set(t, t.nodeValue);
        base = t.nodeValue;
      }

      t.nodeValue =
        lang === 'hi'
          ? direct(base, 'hi')
          : direct(base, 'en');
    }

    var els =
      root.nodeType === 1
        ? [root].concat(
            Array.from(
              root.querySelectorAll(
                'input[placeholder],textarea[placeholder],[aria-label],[title]'
              )
            )
          )
        : [];

    els.forEach(function (el) {
      if (
        el.closest &&
        el.closest('.kq-i18n-control')
      ) {
        return;
      }

      remember(el);

      var a = originalAttrs.get(el);

      if (!a) return;

      if (a.placeholder !== null) {
        el.placeholder =
          lang === 'hi'
            ? direct(a.placeholder, 'hi')
            : direct(a.placeholder, 'en');
      }

      if (a.aria !== null) {
        el.setAttribute(
          'aria-label',
          lang === 'hi'
            ? direct(a.aria, 'hi')
            : direct(a.aria, 'en')
        );
      }

      if (a.title !== null) {
        el.title =
          lang === 'hi'
            ? direct(a.title, 'hi')
            : direct(a.title, 'en');
      }
    });
  }

  function apply(lang, root) {
    lang = lang === 'hi' ? 'hi' : 'en';

    localStorage.setItem(KEY, lang);

    translateRoot(
      root || document.body,
      lang
    );

    if (originalTitle !== null) {
      document.title =
        lang === 'hi'
          ? direct(originalTitle, 'hi')
          : originalTitle;
    }

    document.documentElement.lang = lang;

    document
      .querySelectorAll('#languageSelect,#langSelect')
      .forEach(function (s) {
        if (s.value !== lang) {
          s.value = lang;
        }
      });
  }

  /*
   * Creates the small bottom-left language button.
   *
   * The actual <select> remains on top of the globe,
   * but is transparent. Therefore the browser still
   * handles the normal dropdown when the globe is clicked.
   */
  function attachControl() {
    var existing =
      document.querySelector('.kq-i18n-control');

    var sel =
      document.getElementById('languageSelect') ||
      document.getElementById('langSelect');

    /*
     * If a language selector already exists on the page
     * (several pages render their own <select id="languageSelect">
     * or <select id="langSelect"> instead of using the floating
     * globe control), don't create a second one — but DO make sure
     * it actually drives the shared translation engine. Without this,
     * some pages only ran their own small, hand-written translation
     * snippet on 'change' (covering a handful of strings) and never
     * called the shared apply()/translateRoot(), so most of the page
     * — and the saved language preference — never updated.
     */
    if (sel) {
      if (!sel.dataset.kqBound) {
        sel.dataset.kqBound = '1';

        sel.addEventListener(
          'change',
          function () {
            apply(sel.value);
          }
        );
      }

      return;
    }

    /*
     * Remove any old/duplicate language controls.
     */
    if (existing) {
      existing.remove();
    }

    var wrap =
      document.createElement('div');

    wrap.className =
      'kq-i18n-control';

    var select =
      document.createElement('select');

    select.id =
      'languageSelect';

    select.setAttribute(
      'aria-label',
      'Language'
    );

    select.innerHTML =
      '<option value="en">English</option>' +
      '<option value="hi">हिन्दी</option>';

    wrap.appendChild(select);

    document.body.appendChild(wrap);

    select.addEventListener(
      'change',
      function () {
        apply(select.value);
      }
    );
  }

  function init() {
    /*
     * Capture the canonical DOM while it is still English.
     * This is important for Hindi -> English switching.
     */
    capture(
      document.body,
      'en'
    );

    originalTitle = document.title;

    attachControl();

    apply(
      localStorage.getItem(KEY) || 'en'
    );

    /*
     * Watch dynamically-created content.
     *
     * This fixes pages where JavaScript changes
     * textContent after the page has loaded.
     */
    var mo =
      new MutationObserver(
        function (mutations) {
          var lang =
            localStorage.getItem(KEY) || 'en';

          var added = [];
          var changed = [];

          mutations.forEach(
            function (m) {

              /*
               * Newly-added elements.
               */
              m.addedNodes.forEach(
                function (n) {

                  if (
                    n.nodeType === Node.ELEMENT_NODE &&
                    !n.classList.contains(
                      'kq-i18n-control'
                    )
                  ) {
                    capture(n, lang);
                    added.push(n);
                  }

                  /*
                   * textContent changes create
                   * TEXT_NODEs.
                   */
                  if (
                    n.nodeType === Node.TEXT_NODE
                  ) {
                    var parent =
                      n.parentElement;

                    if (
                      parent &&
                      !parent.closest(
                        '.kq-i18n-control'
                      )
                    ) {
                      changed.push(parent);
                    }
                  }
                }
              );

              /*
               * Detect characterData changes.
               */
              if (
                m.type === 'characterData'
              ) {
                var parent =
                  m.target.parentElement;

                if (
                  parent &&
                  !parent.closest(
                    '.kq-i18n-control'
                  )
                ) {
                  changed.push(parent);
                }
              }

              /*
               * Detect placeholder,
               * title and aria-label changes.
               */
              if (
                m.type === 'attributes'
              ) {
                if (
                  m.target &&
                  !m.target.closest(
                    '.kq-i18n-control'
                  )
                ) {
                  changed.push(m.target);
                }
              }
            }
          );

          if (
            (!added.length &&
              !changed.length) ||
            scheduled
          ) {
            return;
          }

          scheduled = true;

          requestAnimationFrame(
            function () {
              scheduled = false;

              added.forEach(
                function (n) {
                  translateRoot(
                    n,
                    lang
                  );
                }
              );

              changed.forEach(
                function (el) {
                  translateRoot(
                    el,
                    lang
                  );
                }
              );
            }
          );
        }
      );

    mo.observe(
      document.body,
      {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          'placeholder',
          'title',
          'aria-label'
        ]
      }
    );
  }

  if (
    document.readyState === 'loading'
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
