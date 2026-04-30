# Recipes Server Project (Node.js + Express + MongoDB Atlas)

## Project Objective
This project is a **RESTful API** server built with **Express** and **MongoDB Atlas**.  
The primary testing interface is via **Postman** or **Thunder Client** (by importing the provided collection). While a basic UI is available for demonstration, the core focus is backend logic and API functionality.

## Project Description
A comprehensive RESTful API managing users, recipes, and categories.

- **Authentication:** JWT (JSON Web Tokens)
- **Roles:** `admin`, `user` (registered), and guest (unauthenticated)
- **Validation:** Schema validation using Joi
- **Error Handling:** Standardized format: `{ "error": { "message": "..." } }`
- **CORS:** Configurable via environment variables (see CORS section below)

## Authorization Levels and Permissions

| Role | Description | JWT Required |
|-----|--------|-----|
| **Guest** | Unauthenticated | No |
| **Registered User** | `role: user` (post-login) | Yes (for write operations) |
| **Administrator** | `role: admin` | Yes |

### Permission Matrix:
| Action | Guest | Registered User | Administrator |
|--------|:----:|:-----------:|:----:|
| Register / Login | Yes | — | — |
| View Public Recipes & Categories | Yes | Yes | Yes |
| View **Private** Recipes (Self) | No | Yes | Yes |
| Create Recipe / Upload Image | No | Yes | Yes |
| **Edit / Delete** Recipe | No | Only personal recipes | All recipes |
| User Management (List/Delete) | No | No | Yes |
| Password Management | No | Self only | Self or Others |

*Note: In the demo interface, "Edit" and "Delete" options appear dynamically for the recipe owner or an administrator.*

## CORS and Browser Access
- **Default:** `CLIENT_ORIGIN=*` in `.env`. The server reflects the request `Origin` header, allowing development from any local address or API tool.
- **Specific Clients (e.g., Angular):** To restrict access, set the specific address in `.env`:  
  `CLIENT_ORIGIN=http://localhost:4200`

## API Routing
Primary routes are accessible directly or via the **`/api/*`** prefix for compatibility:
- `/auth`, `/users`, `/recipes`, `/categories`, `/health`

`GET /` serves a basic interface from the `public/` directory for quick testing.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env`
3. **For Submission:** Set `MONGO_URI` to your Atlas connection string and ensure `USE_MEMORY_DB=false`.
4. `npm run dev` or `npm start`

## Environment Variables
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `USE_MEMORY_DB` | `true` = embedded MongoDB (local smoke tests only) |
| `JWT_SECRET` | Required for token encryption |
| `JWT_EXPIRES_IN` | Token duration (default: `7d`) |
| `CLIENT_ORIGIN` | CORS setting: `*` (all) or specific URL |

## Data Models
### User
Includes `username`, `password` (hashed), unique `email`, `address`, and `role` (`admin` | `user`).

### Recipe
Includes `name`, `description`, `categories` (array of refs), `preparationTime`, `difficulty` (1–5), `layers[]`, `instructions[]`, `image`, `isPrivate`, and `addedBy`.

### Category
Includes `code`, `description`, and `recipeCount`. Categories are updated automatically when recipes are modified.

## API Reference (Primary Paths)
| Resource | Method | URL | Auth |
|----------|--------|-----|------|
| Health | GET | `/health` | Guest |
| Auth | POST | `/auth/register` | Guest |
| Auth | POST | `/auth/login` | Guest |
| Users | GET | `/users` | Admin |
| Users | PATCH | `/users/:id/password` | Self / Admin |
| Users | DELETE | `/users/:id` | Admin |
| Recipes | GET | `/recipes` | Guest / User |
| Recipes | POST | `/recipes/upload-image` | User / Admin |
| Recipes | POST | `/recipes` | User / Admin |
| Recipes | PUT | `/recipes/:id` | Owner / Admin |
| Recipes | DELETE | `/recipes/:id` | Owner / Admin |
| Categories| GET | `/categories` | Guest / User |

## Testing
### Postman / Thunder Client
Import the following collection:  
`postman/Recipes-API.postman_collection.json`

### Automated Tests
Run `npm run smoke` while the server is active to execute the primary HTTP flow.

## Submission Package
1. **GitHub Repository:** [Noa-kay/Recipes-Project-NodeJS](https://github.com/Noa-kay/Recipes-Project-NodeJS)
2. **Environment File:** Provided `.env.example`.
3. **Database Export:** Atlas export file (JSON or Dump).
4. **Walkthrough:** 5-10 minute project video.

---

### Database Export Instructions
**Option A: Full Dump (Recommended)**
```bash
mongodump --uri="<MONGO_URI>" --out="./db-export"
