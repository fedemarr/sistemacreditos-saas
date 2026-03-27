# CreditOS — Sistema de Gestión de Créditos

SaaS profesional para financieras, mutuales, prestamistas y comercios que venden en cuotas.

---

## Stack Tecnológico

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Backend / DB / Auth**: Supabase (PostgreSQL)
- **Deploy**: Vercel + Supabase Cloud

---

## Estructura del Proyecto

```
creditos-saas/
├── app/
│   ├── (auth)/              # Rutas públicas (login)
│   └── (dashboard)/         # Rutas protegidas (dashboard)
├── components/
│   ├── layout/              # Sidebar, Header
│   ├── providers/           # ThemeProvider
│   ├── shared/              # Componentes reutilizables
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── supabase/            # Clientes Supabase
│   ├── calculadora/         # Lógica financiera (amortización, punitorios)
│   ├── actions/             # Server Actions (se completan por fase)
│   ├── validations/         # Schemas Zod (se completan por fase)
│   └── utils/               # Formatters, permisos
├── types/                   # Tipos TypeScript del dominio
├── hooks/                   # Custom hooks
└── middleware.ts            # Protección de rutas
```

---

## Setup Inicial

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repo>
cd creditos-saas
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Completar en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=CreditOS
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abrí `http://localhost:3000`.

> El middleware redirige automáticamente al login si no hay sesión activa.

---

## Fases de Desarrollo

| Fase | Contenido | Estado |
|------|-----------|--------|
| Fase 1 | Definición funcional y arquitectura | ✅ Completa |
| Fase 2 | Setup inicial del proyecto | ✅ Completa |
| Fase 3 | Base de datos (SQL + RLS) | 🔄 Siguiente |
| Fase 4 | Autenticación y roles | ⏳ Pendiente |
| Fase 5 | Módulo Clientes | ⏳ Pendiente |
| Fase 6 | Solicitudes de crédito | ⏳ Pendiente |
| Fase 7 | Créditos y cuotas | ⏳ Pendiente |
| Fase 8 | Cobranza y pagos | ⏳ Pendiente |
| Fase 9 | Mora y gestión | ⏳ Pendiente |
| Fase 10 | Dashboard y reportes | ⏳ Pendiente |
| Fase 11 | PDF, auditoría, exportación | ⏳ Pendiente |
| Fase 12 | Deploy y venta | ⏳ Pendiente |

---

## Regenerar tipos de Supabase

Después de crear las tablas en Supabase (Fase 3), ejecutar:

```bash
npx supabase gen types typescript --project-id TU_PROJECT_ID > types/database.types.ts
```

---

## Roles del Sistema

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso completo |
| `operador` | Clientes, solicitudes, pagos |
| `cobrador` | Cobranza y gestiones |
| `auditor` | Solo lectura + reportes |

---

## Seguridad

- ✅ Middleware de protección de rutas
- ✅ RLS (Row Level Security) en Supabase por empresa
- ✅ Service Role key solo en servidor
- ✅ Validaciones con Zod en frontend y backend
- ✅ Multi-tenant con `empresa_id` en cada tabla

---

## ⚠️ Importante

- **Nunca** subir `.env.local` a GitHub
- **Nunca** importar `lib/supabase/admin.ts` desde el frontend
- Datos crediticios están protegidos por Ley 25.326 (Argentina)
