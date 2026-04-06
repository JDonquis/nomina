# Project Mandates: Nomina - Sistema de Nómina de Laboratorio Médico

This file serves as the primary source of truth for the Gemini CLI agent. Adhere to these instructions for all tasks in this workspace.

## 🏗️ Architecture & Tech Stack

- **Backend (`/server`):** Laravel 12 (PHP 8.2), MariaDB, Sanctum Auth, API REST.
- **Frontend (`/client`):** React 19 (Vite), SPA, React Router, MUI, Tailwind CSS v3 (PostCSS).
- **Server Views:** Laravel Blade views use **Tailwind CSS v4**.
- **Database:** MariaDB for development, SQLite in-memory for testing.

## 🛠️ Development Workflow

- **Backend:** `cd server && php artisan serve` (:8000).
- **Frontend:** `cd client && npm run dev` (:5173).
- **Testing:** Always run `php artisan test` after backend changes.
- **Linting:** Use `composer pint` for PHP and `npm run lint` for React.

## 📝 Coding Standards & Mandates

1.  **Language Policy:** 
    - Database columns, tables, and UI text should be in **Spanish** (e.g., `nombres`, `apellidos`).
    - Code variables, method names, and logic should be in **English** (e.g., `activePersonnel`, `calculateSalary()`).
2.  **Thin Controllers:** Keep Laravel controllers minimal. Business logic belongs in **Service** classes (located in `app/Services/`).
3.  **UI Consistency:**
    - Use the `ReusableForm` and `FuturisticButton` components in the React frontend.
    - Maintain the PWA standard for the frontend.
4.  **Security:**
    - Never commit `.env` files.
    - Always verify `AdminMiddleware` for admin-only routes.
5.  **Git:**
    - Follow a "why" over "what" philosophy for commit messages.
    - Do not stage or commit unless explicitly requested.

## 🔍 Key Models & Services

- **Core Model:** `ActivePersonnel.php` (Personal Activo).
- **Main Services:** `ActivePersonnelService.php`, `PaySheetService.php`.
- **Auth:** Managed via `AuthContext.jsx` on the frontend and Sanctum on the backend.

---
*Refer to `AGENTS.md` for more technical details on PWA manifest and server-side Vite configuration.*
