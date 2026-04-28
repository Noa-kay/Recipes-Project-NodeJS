# Recipes Server Project (Node.js + Express + MongoDB Atlas)

**מגישה:** נועה

## מטרת הפרויקט (לפי המסמך)
שרת **API RESTful** ב־Express עם **MongoDB Atlas**.  
הבדיקה הנדרשת היא דרך **Postman** או **Thunder Client** (ייבוא הקולקציה מהפרויקט) — אין כאן אפליקציית דפדפן מלאה.

## Project description
RESTful API for users, recipes, and categories.

- JWT authentication
- Roles: `admin`, `user` (registered), guest (no token)
- Joi validation
- Errors: `{ "error": { "message": "..." } }`
- CORS: ראו סעיף **CORS** למטה.

## שלוש רמות משתמש והרשאות (API + דמו ב־`public/`)

| סוג | תיאור | JWT |
|-----|--------|-----|
| **אורח** | לא מחובר | ללא |
| **משתמש רשום** | `role: user` אחרי `/auth/register` או `/auth/login` | נדרש לפעולות כתיבה |
| **מנהל** | `role: admin` | נדרש |

מטריצת פעולות (השרת אוכף; הממשק מסתיר כפתורים כשאין הרשאה):

| פעולה | אורח | משתמש רשום | מנהל |
|--------|:----:|:-----------:|:----:|
| הרשמה / התחברות | כן | — | — |
| צפייה במתכונים ציבוריים, קטגוריות, בריאות | כן | כן | כן |
| צפייה במתכונים **פרטיים** (של עצמך) | לא | כן | כן |
| יצירת מתכון, העלאת תמונה | לא | כן | כן |
| **עריכה / מחיקה** של מתכון | לא | רק מתכונים שהוספת | כל המתכונים |
| רשימת כל המשתמשים, מחיקת משתמש | לא | לא | כן |
| שינוי סיסמה | לא | לעצמך בלבד | לעצמך או לאחרים (לפי לוגיקת השרת) |

בדף הדמו: אחרי התחברות, פתחי מתכון מהרשימה — אם את **בעלת המתכון** או **מנהלת**, יופיעו **עריכה** ו**מחיקה** מעל פרטי המתכון. עריכה פותחת את `/add-recipe.html?edit=...` באותו חלון.

## CORS וגישה מדפדפן

- ברירת מחדל: **`CLIENT_ORIGIN=*`** ב־`.env` — השרת משקף את כותרת `Origin` של הבקשה (`cors` עם `origin: true`), כך שאפשר לפתח מכל כתובת (דף סטטי מקומי, כלי API, או לקוח אחר) עם `credentials` / עוגיות אם יתווספו בעתיד.
- **מגבלה ל־Angular בלבד:** הגדירי ב־`.env`  
  `CLIENT_ORIGIN=http://localhost:4200`  
  (כתובת מלאה עם סכימה; לפרודקשן החליפי לכתובת האפליקציה).

## URLs (assignment style)
Primary routes (as in the spec):

- `/auth`, `/users`, `/recipes`, `/categories`, `/health`

The same routers are also mounted under **`/api/*`** (e.g. `/api/recipes`) for compatibility.

`GET /` מגיש דף גלישה בסיסי מתוך `public/` (התחברות, רשימת מתכונים והוספה).

## Setup
1. `npm install`
2. Copy `.env.example` to `.env`
3. For **submission**: set **`MONGO_URI`** to your Atlas connection string, **`USE_MEMORY_DB=false`**, allow cluster access from all IPs in Atlas.
4. `npm run dev` or `npm start`

## Environment variables
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 3000) |
| `MONGO_URI` | Atlas connection string (required if `USE_MEMORY_DB` is not `true`) |
| `USE_MEMORY_DB` | `true` = embedded MongoDB for local smoke tests only |
| `JWT_SECRET` | Required |
| `JWT_EXPIRES_IN` | Default `7d` |
| `CLIENT_ORIGIN` | מקור CORS: `*` = כל מקור (משקף `Origin`); אחרת כתובת מדויקת, למשל `http://localhost:4200` לאנגולר |

## Data models (summary)
### User
`username`, `password` (hashed, strong password validated), unique `email`, `address`, `role` (`admin` | `user`).

### Recipe
`name`, `description`, **`categories`** (array of Category refs — at least one), `preparationTime`, `difficulty` (1–5), `addedDate`, `layers[]`, `instructions[]`, `image`, `isPrivate`, `addedBy`.

API body accepts **either** `category` (single category **code** string) **or** `categories` (array of codes). Categories are created/linked automatically when saving recipes (no separate “add category” endpoint).

### Category
`code`, `description`, `recipeCount`, `recipes[]` — maintained when recipes change.

### הערות מודל (Referencing)
- **מתכון → משתמש:** `addedBy` מקשר ל־User (לא משכפלים פרטי משתמש במסמך המתכון).
- **קטגוריה → מתכונים:** לקטגוריה יש מערך `recipes` של מזהי מתכונים, לשליפה עם populate.

## API table (primary paths)
| Resource | Method | URL | Auth |
|----------|--------|-----|------|
| Health | GET | `/health` | Guest |
| Auth | POST | `/auth/register` | Guest |
| Auth | POST | `/auth/login` | Guest |
| Users | GET | `/users` | Admin |
| Users | PATCH | `/users/:id/password` | Self / Admin |
| Users | DELETE | `/users/:id` | Admin |
| Recipes | GET | `/recipes?search=...&limit=&page=` | Guest / User |
| Recipes | GET | `/recipes/:id` | Guest / User |
| Recipes | GET | `/recipes/max-time/:minutes` | Guest / User |
| Recipes | POST | `/recipes/upload-image` | User / Admin — `multipart/form-data`, field `image`; returns `{ url }` (saved under `public/uploads/recipes`, served as static files) |
| Recipes | POST | `/recipes` | User / Admin |
| Recipes | PUT | `/recipes/:id` | Owner / Admin |
| Recipes | DELETE | `/recipes/:id` | Owner / Admin |
| Categories | GET | `/categories` | Guest / User |
| Categories | GET | `/categories/with-recipes` | Guest / User |
| Categories | GET | `/categories/:key` (code or name) | Guest / User |

Same paths work with the `/api` prefix (e.g. `/api/recipes`).

## Postman / Thunder Client
Import:

- `postman/Recipes-API.postman_collection.json`

Folders: **Auth**, **Users**, **Recipes**, **Categories**, **Health**.

Optional CLI smoke (same HTTP flows): `npm run smoke` (server must be running).

Repository: [Noa-kay/Recipes-Project-NodeJS](https://github.com/Noa-kay/Recipes-Project-NodeJS)

## Error format
```json
{
  "error": {
    "message": "..."
  }
}
```

## Optional extras (not required)
Recipe **image upload** is implemented (`POST /recipes/upload-image`, files under `public/uploads/recipes`). Still optional for deployment: **Render**, Socket.io, email, aggregates, etc.

## Submission package (teacher notes)

Submit all of the following:

1. **GitHub repository link**  
   Current repo: [Noa-kay/Recipes-Project-NodeJS](https://github.com/Noa-kay/Recipes-Project-NodeJS)
2. **Environment file**  
   Include `.env.example` in GitHub (already included).  
   For grading, also send a real `.env` file separately (not committed) with:
   - `PORT=3000`
   - `MONGO_URI=<your-atlas-uri>`
   - `USE_MEMORY_DB=false`
   - `JWT_SECRET=<strong-secret>`
   - `JWT_EXPIRES_IN=7d`
   - `CLIENT_ORIGIN=*` (or `http://localhost:4200`)
3. **Database export file** (from Atlas)
4. **5-10 minute video** walkthrough

## How to export DB for submission

> Replace placeholders (`<...>`) with your values.

### Option A - Full database export (recommended)

```bash
mongodump --uri="<MONGO_URI>" --out="./db-export"
```

Then zip the folder:

```bash
zip -r db-export.zip db-export
```

Submit `db-export.zip`.

### Option B - Single JSON export per collection

```bash
mongoexport --uri="<MONGO_URI>" --db="recipes_db" --collection="users" --out="users.json" --jsonArray
mongoexport --uri="<MONGO_URI>" --db="recipes_db" --collection="recipes" --out="recipes.json" --jsonArray
mongoexport --uri="<MONGO_URI>" --db="recipes_db" --collection="categories" --out="categories.json" --jsonArray
```

Zip the JSON files and submit.

## 5-10 minute video checklist (exact flow)

1. **Project structure tour**  
   Show folders: `src/config`, `src/models`, `src/controllers`, `src/routes`, `src/middlewares`, `src/validations`, `postman`, `scripts`, and explain each in 1-2 sentences.
2. **Main flow files**  
   Open `src/server.js` and `src/app.js`, explain app startup, DB connect, routes mount, error middlewares.
3. **Authentication + authorization**  
   Show `src/middlewares/auth.js` and explain JWT + roles (`admin`, `user`, guest).
4. **One full request demo in Postman/Thunder**
   - `POST /auth/register` (or `POST /auth/login`) to get token
   - `POST /recipes` with Bearer token
   - `GET /recipes` to verify result  
   Explain "request -> route -> validation -> controller -> model (MongoDB) -> response".
5. **Categories behavior**
   Show `GET /categories/with-recipes` and explain automatic category updates from recipe create/delete.
6. **Error handling**
   Trigger one error (for example bad body) and show response format:  
   `{ "error": { "message": "..." } }`.

## Final pre-submit checklist

- `npm install` completed
- `.env` configured to Atlas (`USE_MEMORY_DB=false`)
- Server starts with `npm run dev`
- Postman collection works (`postman/Recipes-API.postman_collection.json`)
- README and API table updated
- DB export file prepared (`db-export.zip` or JSON zip)
- Video recording (5-10 min) prepared
