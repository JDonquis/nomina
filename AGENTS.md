# Nomina - Sistema de Nómina de Laboratorio Médico

## Arquitectura

```
Nomina/
├── server/     # Laravel 12 backend (API)
└── client/    # React 19 frontend (SPA)
```

- **Backend** (`server/`): Laravel 12 + PHP 8.2, API REST via `api.php`, Sanctum auth, MariaDB, Maatwebsite/Excel, Intervention/image
- **Frontend** (`client/`): React 19 + Vite, React Router, MUI, Tailwind CSS v3, PWA (VitePWA)

## Comandos de Desarrollo

```bash
# Backend (desde server/)
cd server
composer install
php artisan key:generate
php artisan migrate --force
npm install && npm run build        # build assets (Tailwind CSS para views)
php artisan serve                  #dev server en :8000

# Frontend (desde client/) - separado del servidor
cd client
npm install
npm run dev                        # Vite dev en :5173

# Tests (desde server/)
composer test                      #等价于 php artisan test
php artisan test                  # Unit + Feature tests
```

## Base de Datos

- **Desarrollo**: MariaDB (definido en `.env`, `DB_CONNECTION=mariadb`)
- **Testing**: SQLite en memoria (`phpunit.xml` DB_CONNECTION=sqlite, DB_DATABASE=:memory:)

## Frontend

- API base: `http://localhost:8000/api`
- Token storage: `localStorage.tokenNomina`
- Pages lazy-loaded: `FeDeVidaPage`, `MovimientosPage`, `PersonalActivoPage`, `ConfiguracionPage`
- Admin-only routes requieren permiso `is_admin` (middleware `AdminMiddleware`)

## Linting

- **PHP**: `composer pint` (en server/)
- **JS/React**: `npm run lint` (en client/)

## Notas Importantes

- `server/package.json` usa **Tailwind CSS v4** (vite) para assets del servidor (Blade views)
- `client/` usa **Tailwind CSS v3** (postcss) para la SPA React
- Server Vite ignora `storage/framework/views/**` (artisan view cache)
- PWA manifest: app name "Nómina - Sistema de Laboratorio"
