# موقع مؤمن المدهون — Moamen Al-Madhoun Portfolio

موقع معرض أعمال ثنائي اللغة (عربي / English) لمصوّر ومونتير الفيديو **مؤمن المدهون** من غزة.
شعار ثلاثي الأبعاد (Three.js)، معرض أعمال دوّار، شركاء ومؤسسات، ونموذج طلب مشروع عبر واتساب.
موقع ثابت بالكامل (HTML/CSS/JS) — لا يحتاج خادماً ويعمل مجاناً على **GitHub Pages**.

Bilingual (AR/EN) static portfolio for photographer & video editor Moamen Al-Madhoun — 3D logo, works gallery, partners, WhatsApp request form. No build step, no backend.

## البنية / Structure
```
index.html          الصفحة الرئيسية
css/style.css       التصميم
js/app.js           المنطق + 3D + لوحة التحرير
data/content.json   كل المحتوى (الأعمال، الشركاء، التواصل، النبذة)
assets/             الشعار والأيقونات
assets/uploads/     الصور التي تضيفها (الصورة الشخصية، أغلفة الأعمال...)
```

## التشغيل محلياً / Run locally
```
python3 -m http.server 8000
# ثم افتح http://localhost:8000
```
(لا تفتح index.html مباشرة بنقرتين، لأن المتصفح يمنع قراءة data/content.json من file://)

## النشر على GitHub Pages
1. أنشئ مستودعاً باسم `moamen-almadhoun-portfolio` وارفع الملفات (أو استخدم الأوامر أدناه).
2. Settings ← Pages ← Source: **Deploy from a branch** ← Branch: `main` / `(root)` ← Save.
3. بعد دقيقة يصبح الموقع على `https://<username>.github.io/moamen-almadhoun-portfolio/`.
4. **مهم:** عدّل رابط `og:image` و`og:url` في `index.html` ليطابق اسم المستخدم الفعلي (يظهر في معاينة المشاركة على واتساب/فيسبوك).

```
git init -b main
git add .
git commit -m "Initial commit: Moamen Al-Madhoun portfolio"
git remote add origin https://github.com/<username>/moamen-almadhoun-portfolio.git
git push -u origin main
```

## إضافة الصورة الشخصية والأعمال
**الطريقة السهلة (لوحة التحرير):**
1. افتح الموقع وأضف `#admin` للرابط (أو اضغط زر التحرير في الموقع).
2. عدّل النبذة، أضف الصورة الشخصية، الأعمال، الشركاء، وروابط التواصل.
3. اضغط **تنزيل المحتوى** ← ينزل ملف `moamen-site-content.zip`.
4. فك الضغط وانسخ مجلد `data/` ومجلد `assets/uploads/` إلى المستودع (استبدل الموجود)، ثم Commit و Push.

**الطريقة اليدوية:** ضع الصورة في `assets/uploads/moamen.webp` ثم في `data/content.json` اجعل `"photo": "assets/uploads/moamen.webp"`.

- الفيديوهات: تُضاف كرابط (YouTube / Vimeo / Google Drive) في حقل `link` — لا يتم رفعها للمستودع.
- الصور: يُفضّل عرض 1600px كحد أقصى وحجم أقل من 400KB (WebP أو JPG).
- الأعمال المعلّمة `"sample": true` نماذج تجريبية؛ احذفها أو استبدلها بأعمال حقيقية.
- لوحة التحرير تعمل في متصفح من يفتحها فقط ولا تغيّر الموقع المنشور إلا بعد رفع الملفات إلى GitHub.

## نطاق خاص / Custom domain
أضف ملف `CNAME` يحتوي النطاق، وفعّله من Settings ← Pages.

## الهوية
أزرق كحلي + أبيض + سماوي · خطوط Montserrat و Tajawal · "Capture · Create · Inspire".
