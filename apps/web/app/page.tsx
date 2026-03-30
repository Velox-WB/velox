import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@velox/db'

export default async function HomePage() {
  const { userId, orgId } = await auth()

  // No autenticado → login
  if (!userId) redirect('/auth/sign-in')

  // Sin organización → crear/unirse
  if (!orgId) redirect('/auth/select-org')

  // Verificar si el setup está completo
  const org = await db.organization.findUnique({
    where: { clerkId: orgId },
    select: { setupCompleted: true, setupStep: true },
  })

  // Primera vez — no existe en DB todavía → crear y mandar a onboarding
  if (!org) redirect('/onboarding')

  // Setup incompleto → continuar onboarding
  if (!org.setupCompleted) redirect('/onboarding')

  // Todo listo → dashboard
  redirect('/dashboard')
}
