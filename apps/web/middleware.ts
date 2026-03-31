import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  publicRoutes: ["/auth/sign-in(.*)", "/auth/sign-up(.*)"]
})

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}