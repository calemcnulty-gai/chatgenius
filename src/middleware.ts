import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// This middleware is the only place that directly uses Clerk's auth.
// All other parts of the application should use the internal user ID
// through the getAuthenticatedUserId helper.
const middleware = authMiddleware({
  publicRoutes: [
    "/sign-in",
    "/sign-up",
    "/api/webhooks/clerk",
    "/invite/:id",
    "/invite/(.*)"
  ],
  ignoredRoutes: ["/api/webhooks(.*)"],
  afterAuth(auth, req) {
    // Handle authenticated users trying to access auth pages
    if (auth.userId && ['/sign-in', '/sign-up'].includes(req.nextUrl.pathname)) {
      const workspace = new URL('/workspace', req.url)
      return NextResponse.redirect(workspace)
    }

    // Handle non-authenticated users for non-API routes
    if (!auth.userId && !req.nextUrl.pathname.startsWith('/sign-in') && !req.nextUrl.pathname.startsWith('/api/')) {
      const signIn = new URL('/sign-in', req.url)
      return NextResponse.redirect(signIn)
    }

    return NextResponse.next()
  }
});

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/",
    "/api/((?!webhooks).*)"
  ]
}; 