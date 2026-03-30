# Velox — Motor de Ventas Inteligente

CRM B2B con Pipeline Kanban, Cotizador y Agente IA en tres fases.

---

## Inicio rápido (máquina limpia)

### Prerrequisitos

| Herramienta | Versión | Instalación |
|-------------|---------|-------------|
| Node.js     | v18+    | https://nodejs.org |
| npm         | v9+     | incluido con Node |
| Docker      | cualquiera | https://docs.docker.com/get-docker/ |

### 1. Clonar y preparar

```bash
git clone https://github.com/tu-usuario/velox.git
cd velox
chmod +x scripts/setup.sh
./scripts/setup.sh
```

El script hace todo automáticamente:
- Levanta PostgreSQL y Redis en Docker
- Instala dependencias npm
- Aplica el schema de base de datos
- Carga datos de prueba

### 2. Configurar API keys

Edita `.env.local` con tus credenciales:

```bash
# Clerk (autenticación) — https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Anthropic (Agente IA) — https://console.anthropic.com
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Levantar el servidor

```bash
npm run dev
```

Abre http://localhost:3000

---

## Estructura del proyecto

```
velox/
├── apps/
│   └── web/                    # Next.js 14 App Router
│       ├── app/
│       │   ├── onboarding/     # Setup Wizard (Sprint 1)
│       │   ├── dashboard/      # Dashboard + Pipeline
│       │   └── api/
│       │       ├── trpc/       # API type-safe
│       │       ├── ai/chat/    # Agente IA Fase 1
│       │       └── setup/save/ # Guardar progreso wizard
│       ├── components/
│       │   ├── wizard/         # Setup Wizard completo
│       │   │   └── steps/      # 6 pasos + pantalla final
│       │   ├── pipeline/       # Kanban B2B
│       │   ├── agent/          # Chat del Agente IA
│       │   └── ui/             # Primitivos de diseño
│       ├── lib/
│       │   ├── trpc/router.ts  # Todos los endpoints
│       │   └── ai/             # Helpers del Agente
│       └── workers/
│           └── pipelineScanner.ts  # Motor alertas Fase 2
├── packages/
│   └── db/
│       ├── prisma/
│       │   ├── schema.prisma   # Schema completo multi-tenant
│       │   └── seed.ts         # Datos de prueba
│       └── index.ts            # Prisma client singleton
├── docker-compose.yml          # PostgreSQL + Redis local
├── .env.example                # Template de variables
└── scripts/setup.sh            # Setup automático
```

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 + TypeScript |
| API | tRPC v11 (type-safe end-to-end) |
| Base de datos | PostgreSQL + Prisma ORM |
| Autenticación | Clerk (multi-tenant) |
| Agente IA | Anthropic Claude claude-sonnet-4-6 |
| Jobs / Alertas | BullMQ + Redis |
| Email | Resend |
| Estilos | Tailwind CSS |

---

## Fases del Agente IA

### ✅ Fase 1 — Agente conversacional
- Contexto dinámico: portafolio, ICP, pipeline en tiempo real
- Análisis de deals específicos con argumentos de valor
- Preparación de reuniones con briefing completo
- Manejo de objeciones con ROI cuantificado

### ✅ Fase 2 — Motor de alertas proactivas
- Escaneo automático cada 8 minutos via BullMQ
- Detección: inactividad > umbral, propuestas no abiertas, deals listos para cerrar
- Diagnóstico + acciones priorizadas + borrador de mensaje — generados por Claude
- Notificaciones push al vendedor responsable

### 🚧 Fase 3 — Predicción (próximo sprint)
- Modelo predictivo con 18 variables por deal
- Probability score IA vs. probabilidad manual del pipeline
- Cotizador IA con recomendación de portafolio por ICP
- Forecast predictivo con escenarios base/pesimista/optimista

---

## Comandos útiles

```bash
# Desarrollo
npm run dev              # Servidor Next.js en localhost:3000

# Base de datos
npm run db:studio        # Prisma Studio — explorador visual de datos
npm run db:push          # Aplicar cambios del schema sin migración
npm run db:migrate       # Crear migración nombrada
npm run db:seed          # Recargar datos de prueba

# Workers (Fase 2)
node --loader ts-node/esm apps/web/workers/pipelineScanner.ts

# Docker
docker compose up -d     # Levantar servicios
docker compose down      # Detener servicios
docker compose down -v   # Reset completo (borra datos)
```

---

## Configuración de Clerk (multi-tenant)

1. Crear aplicación en https://dashboard.clerk.com
2. Habilitar **Organizations** en el dashboard de Clerk
3. Configurar **Organization Switcher** en las opciones de sesión
4. Copiar las API keys a `.env.local`

Velox usa Organizations de Clerk como tenants — cada empresa es una organización independiente con datos completamente aislados.

---

## Variables de entorno requeridas

```bash
# .env.local (NO commitear)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
ANTHROPIC_API_KEY=sk-ant-...
REDIS_URL=redis://localhost:6379
```

Ver `.env.example` para la lista completa.

---

## Seguridad

- **Row Level Security**: todas las tablas tienen RLS por `organization_id`
- **Multi-tenant**: los datos de cada empresa son completamente aislados a nivel de base de datos
- **Audit log**: cada acción queda registrada en `audit_logs`
- **API keys cifradas**: los secrets nunca se exponen al cliente

---

Construido con el DAT v1.0 — Velox Motor de Ventas
