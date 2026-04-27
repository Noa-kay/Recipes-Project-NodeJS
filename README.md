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
- CORS: `CLIENT_ORIGIN=*` by default; for Angular later use `http://localhost:4200`

## URLs (assignment style)
Primary routes (as in the spec):

- `/auth`, `/users`, `/recipes`, `/categories`, `/health`

The same routers are also mounted under **`/api/*`** (e.g. `/api/recipes`) for compatibility.

`GET /` returns a short JSON hint and pointers to this README and the Postman file.

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
| `CLIENT_ORIGIN` | CORS origin (`*` or `http://localhost:4200`) |

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
Render, Multer uploads, Socket.io, email, aggregates, etc.
