import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/lib/trpc/router'
import { createTRPCContext } from '@/lib/trpc/router'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ path, error }) => {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[tRPC error] ${path}:`, error)
      }
    },
  })

export { handler as GET, handler as POST }
