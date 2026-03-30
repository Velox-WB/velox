#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# VELOX — Script de configuración inicial
# Prepara el entorno de desarrollo desde cero
# 
# Uso: chmod +x scripts/setup.sh && ./scripts/setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

echo -e "\n${BOLD}${BLUE}▸ VELOX — Setup inicial${NC}\n"

# ── Check prerequisites ────────────────────────────────────────────────────
echo -e "${YELLOW}Verificando prerrequisitos...${NC}"

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}✗ $1 no está instalado.${NC} Instala desde: $2"
    exit 1
  fi
  echo -e "${GREEN}✓ $1${NC}"
}

check_command "node"   "https://nodejs.org (v18+ requerido)"
check_command "npm"    "https://nodejs.org"
check_command "docker" "https://docs.docker.com/get-docker/"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js v18+ requerido. Versión actual: $(node -v)${NC}"
  exit 1
fi

echo ""

# ── .env setup ────────────────────────────────────────────────────────────
if [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}Creando .env.local desde .env.example...${NC}"
  cp .env.example .env.local
  echo -e "${GREEN}✓ .env.local creado${NC}"
  echo -e "${YELLOW}⚠️  IMPORTANTE: Edita .env.local y agrega tus API keys antes de continuar${NC}"
  echo ""
  echo "  Variables requeridas:"
  echo "  • NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  → https://dashboard.clerk.com"
  echo "  • CLERK_SECRET_KEY                   → https://dashboard.clerk.com"
  echo "  • ANTHROPIC_API_KEY                  → https://console.anthropic.com"
  echo ""
  read -p "  Presiona Enter cuando hayas configurado .env.local..."
else
  echo -e "${GREEN}✓ .env.local ya existe${NC}"
fi

# ── Docker services ───────────────────────────────────────────────────────
echo -e "\n${YELLOW}Iniciando servicios Docker (PostgreSQL + Redis)...${NC}"
docker compose up -d

echo -e "${YELLOW}Esperando que PostgreSQL esté listo...${NC}"
sleep 3

RETRIES=10
while [ $RETRIES -gt 0 ]; do
  if docker compose exec -T postgres pg_isready -U velox &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL listo${NC}"
    break
  fi
  RETRIES=$((RETRIES - 1))
  sleep 2
done

# ── Install dependencies ──────────────────────────────────────────────────
echo -e "\n${YELLOW}Instalando dependencias npm...${NC}"
npm install
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# Update .env.local with local DB URL if default
if grep -q 'USER:PASSWORD' .env.local; then
  echo -e "\n${YELLOW}Configurando DATABASE_URL para desarrollo local...${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/velox"|DATABASE_URL="postgresql://velox:velox_dev_pass@localhost:5432/velox"|' .env.local
    sed -i '' 's|DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/velox"|DIRECT_URL="postgresql://velox:velox_dev_pass@localhost:5432/velox"|' .env.local
    sed -i '' 's|REDIS_URL="redis://localhost:6379"|REDIS_URL="redis://localhost:6379"|' .env.local
  else
    sed -i 's|DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/velox"|DATABASE_URL="postgresql://velox:velox_dev_pass@localhost:5432/velox"|' .env.local
    sed -i 's|DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/velox"|DIRECT_URL="postgresql://velox:velox_dev_pass@localhost:5432/velox"|' .env.local
  fi
  echo -e "${GREEN}✓ DATABASE_URL configurado para localhost${NC}"
fi

# ── Database setup ────────────────────────────────────────────────────────
echo -e "\n${YELLOW}Generando Prisma client...${NC}"
cd packages/db && npx prisma generate && cd ../..
echo -e "${GREEN}✓ Prisma client generado${NC}"

echo -e "\n${YELLOW}Aplicando schema a la base de datos...${NC}"
cd packages/db && npx prisma db push && cd ../..
echo -e "${GREEN}✓ Schema aplicado${NC}"

echo -e "\n${YELLOW}Cargando datos de prueba (seed)...${NC}"
cd packages/db && npx ts-node --esm prisma/seed.ts && cd ../..
echo -e "${GREEN}✓ Datos de prueba cargados${NC}"

# ── Summary ───────────────────────────────────────────────────────────────
echo -e "\n${BOLD}${GREEN}════════════════════════════════════════"
echo -e "✅  Velox listo para desarrollo"
echo -e "════════════════════════════════════════${NC}"
echo ""
echo "  Para iniciar el servidor de desarrollo:"
echo ""
echo -e "  ${BOLD}npm run dev${NC}"
echo ""
echo "  Luego abre: http://localhost:3000"
echo ""
echo "  Servicios disponibles:"
echo "  • App:          http://localhost:3000"
echo "  • Prisma Studio: npm run db:studio"
echo "  • PostgreSQL:   localhost:5432 (velox / velox_dev_pass)"
echo "  • Redis:        localhost:6379"
echo ""
