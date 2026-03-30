import { PrismaClient, Plan, DealStage, LeadSource, MemberRole, ActivityType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Velox database...')

  // ── Demo Organization ──────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-empresa' },
    update: {},
    create: {
      clerkId: 'org_demo_001',
      name: 'Demo Empresa S.A.',
      slug: 'demo-empresa',
      plan: Plan.GROWTH,
      setupStep: 6,
      setupCompleted: true,
      monthlyGoal: 60000,
      sil: {
        business: {
          name: 'Demo Empresa S.A.',
          sector: 'Tecnología y software',
          description: 'Proveemos soluciones de software para automatizar procesos comerciales en PYMEs B2B de Centroamérica.',
          yearsInMarket: 5,
          teamSize: '2 a 5 vendedores',
          differentiators: 'Especialización en PYMEs, implementación en 30 días, soporte en español.',
          competitors: ['Salesforce', 'HubSpot', 'Pipedrive'],
        },
        portfolio: [
          { id: '1', name: 'Consultoría estratégica', category: 'Servicios', price: 5000, type: 'flagship' },
          { id: '2', name: 'Implementación módulo ventas', category: 'Software', price: 12000, type: 'upsell' },
          { id: '3', name: 'Capacitación equipo (4 sesiones)', category: 'Formación', price: 3200, type: 'addon' },
          { id: '4', name: 'Módulo operaciones', category: 'Software', price: 9500, type: 'upsell' },
          { id: '5', name: 'Soporte anual', category: 'Servicios', price: 2400, type: 'addon' },
        ],
        pains: [
          'Sin visibilidad del pipeline de ventas',
          'Procesos manuales de seguimiento',
          'Pérdida de oportunidades por falta de seguimiento',
          'Cotizaciones lentas y sin trazabilidad',
        ],
        valueProposition: {
          economic: 'ROI promedio 4.2x en 8 meses. Reducción 40% en tiempo administrativo. Incremento 25% en tasa de cierre.',
          functional: 'Pipeline visible en tiempo real. Cotizaciones en minutos. Seguimiento automatizado de prospectos.',
          emotional: 'El CEO duerme tranquilo sabiendo el estado real del pipeline. El vendedor llega preparado a cada reunión.',
          social: 'La empresa proyecta imagen profesional y de orden ante sus propios clientes.',
          timeToValue: '90 días para ver resultados medibles.',
        },
        segments: [
          {
            id: '1',
            name: 'PYMEs del sector salud',
            size: '11 a 50 empleados',
            revenue: '$500K a $3M USD',
            industries: ['Clínicas privadas', 'Laboratorios'],
            mainPain: 'Gestión manual de admisiones y cobros',
            recommendedProduct: 'Módulo operaciones',
          },
          {
            id: '2',
            name: 'Distribuidoras y comercio',
            size: '11 a 200 empleados',
            revenue: '$1M a $10M USD',
            industries: ['Distribución', 'Importación', 'Comercio'],
            mainPain: 'Sin control del equipo de ventas en campo',
            recommendedProduct: 'Implementación módulo ventas',
          },
        ],
        icp: {
          decisionMakers: ['CEO', 'Gerente General', 'Director Comercial'],
          regions: ['Costa Rica', 'Panamá', 'Guatemala'],
          businessModels: ['B2B'],
          positiveSignals: [
            'Más de 3 vendedores activos',
            'Gestiona pipeline en Excel o WhatsApp',
            'Ha crecido más del 20% en los últimos 2 años',
            'CEO vende directamente o supervisa ventas',
          ],
          negativeSignals: [
            'Facturación anual menor a $100K',
            'Solo quieren precio sin ver valor',
            'No tienen equipo de ventas definido',
          ],
          scoring: {
            companySize: 7,
            decisionMakerRole: 9,
            painUrgency: 8,
            budget: 6,
          },
        },
        commercialProcess: {
          avgCycle: 18,
          avgTicket: 15000,
          monthlyGoal: 60000,
          thresholds: { prospecto: 3, lead: 5, oportunidad: 7, propuesta: 10, forecast: 7, orden: 5 },
        },
      },
    },
  })

  // ── Demo User ──────────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { clerkId: 'user_demo_001' },
    update: {},
    create: {
      clerkId: 'user_demo_001',
      email: 'warren@demo-empresa.com',
      name: 'Warren R.',
    },
  })

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: user.id,
      role: MemberRole.OWNER,
    },
  })

  // ── Demo Contacts ──────────────────────────────────────────────────────────
  const contacts = await Promise.all([
    prisma.contact.create({ data: {
      organizationId: org.id, name: 'Carlos Mendoza', company: 'Constructora CM',
      role: 'CEO', email: 'c.mendoza@ccm.cr', phone: '+506 8888-1234',
      source: LeadSource.WHATSAPP, icpScore: 82,
    }}),
    prisma.contact.create({ data: {
      organizationId: org.id, name: 'Marta López', company: 'Distribuidora López',
      role: 'Gerente General', email: 'mlopez@distlopez.com',
      source: LeadSource.EMAIL, icpScore: 88,
    }}),
    prisma.contact.create({ data: {
      organizationId: org.id, name: 'Ing. Castro', company: 'Coop. Agroindustrial',
      role: 'Director General', email: 'castro@coopagrind.com',
      source: LeadSource.REFERIDO, icpScore: 95,
    }}),
    prisma.contact.create({ data: {
      organizationId: org.id, name: 'María Soto', company: 'MS Consultores',
      role: 'CEO', email: 'msoto@msconsultores.com',
      source: LeadSource.REFERIDO, icpScore: 79,
    }}),
    prisma.contact.create({ data: {
      organizationId: org.id, name: 'Fernando Quirós', company: 'Constructora Valle',
      role: 'Gerente General', email: 'fquiros@cvalle.com',
      source: LeadSource.REFERIDO, icpScore: 91,
    }}),
    prisma.contact.create({ data: {
      organizationId: org.id, name: 'Luis Araya', company: 'Hotel Colinas',
      role: 'Gerente de Operaciones', email: 'laraya@hotelcolinas.com',
      source: LeadSource.WEB, icpScore: 52,
    }}),
  ])

  // ── Demo Deals ─────────────────────────────────────────────────────────────
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)

  await Promise.all([
    prisma.deal.create({ data: {
      organizationId: org.id, contactId: contacts[0].id, assignedToId: user.id,
      name: 'Constructora CM — Módulo Ventas', stage: DealStage.LEAD,
      probabilityManual: 10, probabilityAi: 22, value: 44000, weightedValue: 9680,
      source: LeadSource.WHATSAPP, lastActivityAt: daysAgo(5), daysInStage: 5,
      aiSignals: { canal: 0.6, icpScore: 0.82, velocity: 0.3, inactivity: 0.2, decisor: 0.85 },
    }}),
    prisma.deal.create({ data: {
      organizationId: org.id, contactId: contacts[1].id, assignedToId: user.id,
      name: 'Distribuidora López — Suite', stage: DealStage.PROPUESTA,
      probabilityManual: 40, probabilityAi: 64, value: 38000, weightedValue: 24320,
      source: LeadSource.EMAIL, lastActivityAt: daysAgo(2), daysInStage: 2,
      aiSignals: { canal: 0.5, icpScore: 0.88, velocity: 0.75, inactivity: 0.8, decisor: 0.9 },
    }}),
    prisma.deal.create({ data: {
      organizationId: org.id, contactId: contacts[2].id, assignedToId: user.id,
      name: 'Coop. Agroindustrial — Suite Completa', stage: DealStage.FORECAST,
      probabilityManual: 60, probabilityAi: 71, value: 62000, weightedValue: 44020,
      source: LeadSource.REFERIDO, lastActivityAt: daysAgo(8), daysInStage: 8,
      aiSignals: { canal: 0.92, icpScore: 0.95, velocity: 0.6, inactivity: 0.55, decisor: 0.9 },
    }}),
    prisma.deal.create({ data: {
      organizationId: org.id, contactId: contacts[3].id, assignedToId: user.id,
      name: 'MS Consultores — Consultoría + Capacitación', stage: DealStage.FORECAST,
      probabilityManual: 60, probabilityAi: 64, value: 24000, weightedValue: 15360,
      source: LeadSource.REFERIDO, lastActivityAt: daysAgo(4), daysInStage: 4,
      aiSignals: { canal: 0.92, icpScore: 0.79, velocity: 0.65, inactivity: 0.65, decisor: 0.88 },
    }}),
    prisma.deal.create({ data: {
      organizationId: org.id, contactId: contacts[4].id, assignedToId: user.id,
      name: 'Constructora Valle — Suite Completa', stage: DealStage.ORDEN,
      probabilityManual: 80, probabilityAi: 93, value: 35000, weightedValue: 32550,
      source: LeadSource.REFERIDO, lastActivityAt: daysAgo(2), daysInStage: 2,
      aiSignals: { canal: 0.92, icpScore: 0.91, velocity: 0.9, inactivity: 0.85, decisor: 0.95 },
    }}),
    prisma.deal.create({ data: {
      organizationId: org.id, contactId: contacts[5].id, assignedToId: user.id,
      name: 'Hotel Colinas — CRM Básico', stage: DealStage.PROPUESTA,
      probabilityManual: 40, probabilityAi: 18, value: 12800, weightedValue: 2304,
      source: LeadSource.WEB, lastActivityAt: daysAgo(7), daysInStage: 7,
      aiSignals: { canal: 0.28, icpScore: 0.52, velocity: 0.3, inactivity: 0.12, decisor: 0.4 },
    }}),
  ])

  console.log('✅ Seed completado — organización, usuarios, contactos y deals creados.')
  console.log(`   Org ID: ${org.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
