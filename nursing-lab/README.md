# مختبر التمريض — منصة الاختبارات التفاعلية

تطبيق ويب أحادي الصفحة (SPA) خفيف وسريع موجه لطلاب التمريض والعلوم الطبية، يعمل بالكامل على المتصفح دون خادم خلفي أو واجهات برمجة مدفوعة، مع دعم التثبيت كتطبيق هاتف (PWA) والعمل دون اتصال بالإنترنت.

## أين توضع ملفات JSON؟

تُحمّل الأسئلة عبر `fetch()` من المسار `/data/*.json`.
في هيكل المشروع، ضع ملفات الشيتات العشرة داخل المجلد **`public/data/`** بالأسماء التالية:

- `public/data/01_vital-signs.json`
- `public/data/02_anatomy-of-the-airway.json`
- `public/data/03_respiration.json`
- `public/data/04_pain-management.json`
- `public/data/05_respiratory-mucus-sputum-cough.json`
- `public/data/06_blood-transfusion.json`
- `public/data/07_autonomic-nervous-system.json`
- `public/data/08_vertebral-column-spinal-cord.json`
- `public/data/09_kidney.json`
- `public/data/10_heart-and-liver.json`

## طريقة التشغيل محلياً

1. تثبيت الاعتماديات:
   ```bash
   npm install
   ```
2. تشغيل خادم التطوير:
   ```bash
   npm run dev
   ```
3. بناء نسخة الإنتاج الثابتة (تُحفظ في `dist/`):
   ```bash
   npm run build
   ```
4. تشغيل اختبارات المنطق البرمجي (الاختيار المتوازن والتصحيح الذكي):
   ```bash
   npx --yes tsx --test src/utils/questionSelection.test.ts src/utils/grading.test.ts
   ```

## تعديل الأوزان وحدود التصحيح

يمكن ضبط أوزان الأقسام (`30% / 40% / 30%`)، وعدد الأسئلة لكل شيت، وحدود التشابه للتصحيح الكتابي والأخطاء الإملائية من ملف واحد:
`src/config/examConfig.ts`
