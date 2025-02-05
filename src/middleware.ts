import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/sign-in",
    "/sign-up",
    "/api/webhooks/clerk",
    "/invite/:id",
    "/invite/(.*)"
  ],
  ignoredRoutes: ["/api/webhooks(.*)"],
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}; 