darslik-metodist prompti bo'yicha fidbek
Prompt umuman kuchli yozilgan: rollar aniq ajratilgan, taqiqlar va Definition of Done joyida. Lekin bitta jiddiy muammo va beshta mayda kamchilik bor.
🔴 Asosiy muammo: prompt o'zi o'z standartini buzadi
Prompt metodistdan matnda kirill harflari bo'lmasligini talab qiladi, lekin promptning o'zida ~15 ta so'zda lotin va kirill harflari aralashgan: «ko'rinishда», «ekranга», «baholanган», «topilса», «keltirilадi», «misolда», «proyektorда» va boshqalar. Ko'zga bilinmaydi, lekin kompyuter uchun bular boshqa belgilar.
Nega bu xavfli: AI ko'rsatmadagi uslubni takrorlaydi. Ko'rsatmaning o'zi xato bilan yozilgan bo'lsa, model shu xatoni dars matniga ham olib kiradi. Yechim: prompt faylini o'zining grep-tekshiruvidan o'tkazib, kirillni tozalash.
🟡 Tuzatish tavsiya qilinadi

Siz-forma grep'i aybsizlarni ham ushlaydi. san\b qidiruvi «asosan» kabi oddiy so'zlarni ham topadi. Promptga aniq yozish kerak: «grep — faqat yo'l ko'rsatkich, yakuniy qaror qo'lda o'qib chiqiladi», aks holda model to'g'ri so'zlarni ham "tuzatishi" mumkin.
Muhim qoida noto'g'ri joyda turibdi. «Audio matnni o'zgartirsang — Mentor matnini ham o'zgartir» qoidasi apostrof bo'limi ichiga yashiringan. Bu esa har qanday tahrirga tegishli umumiy qoida. Uni asosiy checklistga ko'chirish kerak.
Qachon o'zi tuzatadi, qachon Quruvchiga qaytaradi — noaniq. 9.4 bandida «tuzating (yoki Quruvchiga qaytaring)» deyilgan, lekin mezon yo'q. Aniq qilish kerak: faqat requirements MATNI o'zgarsa — o'zi tuzatadi; ekran/komponent tuzilishini o'zgartirish kerak bo'lsa — Quruvchiga qaytaradi.
Qattiq satr raqamlari eskiradi. «RECAPS ~1440-satrda» degan raqamlar birinchi tahrirdan keyinoq siljib ketadi. Promptga aniq yozish kerak: «raqamlar taxminiy, satr raqami bilan emas, grep bilan qidiring».
Apostrof tuzatish usuli o'zi faylni buzadi. Hozirgi tartib: hamma qiyshiq apostrofni \' ga almashtir, keyin buzilgan joylarni qidirib tuzat. Ya'ni usul ataylab xato yaratadi. Teskarisi xavfsizroq: apostrof bor stringni butunlay qo'shtirnoqqa o'tkazish (RECAPS uchun 4-bandda shunday qilingan) — shunda escape umuman kerak bo'lmaydi.

✅ To'g'ri qilingan, tegmaslik kerak
Metodist / ⚡ Jonli / 🏗️ Quruvchi zonalarining ajratilishi va correct-indekslarga taqiq; «sen grep-runner emas, mulohaza qiluvchi metodistsan» yondashuvi va Htmllesson1 etaloni; metafora almashtirishda «❌ eski → ✅ yangi → 💡 nega» formati; grep-dalillar va esbuild bilan DoD.