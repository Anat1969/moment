# רגע — יומן הטיול

אפליקציית PWA לתיעוד חוויות בזמן אמת: תמונה, קול, תמלול ומיקום.
כל בן משפחה מתקין בטלפון שלו, וכולם רואים את אותו יומן.

## מה יש כאן

- **קפטור** — תמונה מהמצלמה, הקלטת קול עם תמלול לעברית, מיקום GPS ושם מקום אוטומטי
- **גלויה** — כל רגע מוצג ככרטיס עם בול זמן, יום בטיול, מיקום ושם המתעד
- **ציר זמן** — לפי ימי הטיול, 23.7 עד 19.8
- **מפה** — כל הרגעים כנקודות, עם קו המסלול
- **שיתוף** — קישור לכל יום, לצפייה בלבד, בלי כניסה
- **בלי רשת** — הרגעים נשמרים במכשיר ועולים אוטומטית כשחוזרת קליטה

## תמלול — איך זה חינמי

התמלול נעשה ב-Web Speech API של הדפדפן. אין מפתח, אין תשלום.
עובד ב-Chrome אנדרואיד ובדסקטופ. ב-Safari ב-iPhone לרוב לא זמין —
לכן **קובץ הקול עצמו נשמר תמיד**, וניתן לכתוב את הטקסט ידנית או לערוך אחר כך.

## התקנה

```bash
npm install
cp .env.example .env      # ולמלא את שני הערכים
npm run dev
```

### Supabase

1. Supabase → הפרויקט → **SQL Editor** → New query
2. להדביק את כל `supabase/schema.sql` → **Run**
3. **Settings → API** → להעתיק `Project URL` ו-`anon public` לתוך `.env`

הסכמה יוצרת את הטבלה `captures`, את דלי האחסון `moments`, ומפעילה סנכרון חי.

### פריסה ל-Vercel

```bash
git init && git add -A && git commit -m "Moment"
git branch -M main
git remote add origin https://github.com/Anat1969/moment.git
git push -u origin main
```

ב-Vercel: Import Project → בחירת הריפו → הוספת שני משתני הסביבה
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) → Deploy.

### התקנה בטלפון

לפתוח את הכתובת בדפדפן → תפריט → "הוספה למסך הבית".
אנדרואיד: Chrome. אייפון: Safari (חובה Safari, לא Chrome).

## אבטחה

אין מסך התחברות. ההגנה היא בכתובת עצמה — מי שלא מכיר אותה לא מגיע.
זה מספיק ליומן משפחתי. אם רוצים הגנה אמיתית, צריך להוסיף Supabase Auth
ולשנות את מדיניות ה-RLS בקובץ `schema.sql` מ-`true` לבדיקת משתמש מחובר.

## מבנה

```
src/
  App.tsx              מסך ראשי, ימים, לשוניות, שיתוף
  lib/
    types.ts           מבנה הנתונים
    trip.ts            לוח הטיול — מספרי ימים ואזורים
    supabase.ts        חיבור
    store.ts           טעינה, סנכרון חי, תור לא־מקוון
    speech.ts          הקלטה ותמלול
    geo.ts             מיקום ושם מקום
    idb.ts             אחסון מקומי
  components/
    Postcard.tsx       הגלויה
    CaptureSheet.tsx   מסך התיעוד
    MapView.tsx        המפה
supabase/schema.sql    כל מה שצריך להריץ בשרת
```

## שינוי תאריכי הטיול

`src/lib/trip.ts` — הקבועים `TRIP_START`, `TRIP_END` ומערך `LEGS`.
