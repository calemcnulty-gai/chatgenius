import { authMiddleware } from "@clerk/nextjs";

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