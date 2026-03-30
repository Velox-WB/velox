import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@velox/db'
import { SetupWizardClient } from '@/components/wizard/SetupWizardClient'

export default async function OnboardingPage() {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) redirect('/auth/sign-in')

  // Get or create organization in our DB
  let org = await db.organization.findUnique({
    where: { clerkId: orgId },
  })

  if (!org) {
    // First time — create org with defaults
    const clerkOrg = await fetch(`https://api.clerk.com/v1/organizations/${orgId}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    }).then(r => r.json()).catch(() => ({ name: 'Mi Empresa', slug: orgId }))

    const slug = (clerkOrg.slug || orgId).toLowerCase().replace(/[^a-z0-9-]/g, '-')

    org = await db.organization.create({
      data: {
        clerkId: orgId,
        name: clerkOrg.name || 'Mi Empresa',
        slug: `${slug}-${Date.now()}`,
      },
    })

    // Create user if needed + membership
    const user = await db.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { clerkId: userId, email: '', name: 'Propietario' },
    })

    await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      update: {},
      create: { organizationId: org.id, userId: user.id, role: 'OWNER' },
    })
  }

  if (org.setupCompleted) redirect('/dashboard')

  return (
    <SetupWizardClient
      orgId={org.id}
      initialStep={org.setupStep}
      initialSil={org.sil as Record<string, unknown> | null}
    />
  )
}
