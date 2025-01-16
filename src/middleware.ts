import { authMiddleware } from "@clerk/nextjs";

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
  ignoredRoutes: ["/api/webhooks(.*)"]
});

export default middleware;

export const config = {
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
    "/",
    "/api/((?!webhooks).*)"
  ]
}; 