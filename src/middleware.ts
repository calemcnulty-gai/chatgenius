import { authMiddleware } from "@clerk/nextjs";

const middleware = authMiddleware({
  publicRoutes: [
    "/sign-in",
    "/sign-up",
    "/api/webhooks/clerk",
    "/invite/:id",
    "/invite/(.*)"
  ],
  ignoredRoutes: ["/api/webhooks(.*)"],
  debug: true,
  beforeAuth: (req) => {
    console.log('🔑 Middleware - Before Auth:', {
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries())
    });
    return null;
  },
  afterAuth: (auth, req) => {
    console.log('🔒 Middleware - After Auth:', {
      userId: auth.userId,
      isPublicRoute: auth.isPublicRoute,
      url: req.url,
      method: req.method
    });
    return null;
  }
});

export default middleware;

export const config = {
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
    "/",
    "/api/((?!webhooks).*)"
  ],
  runtime: 'nodejs'
}; 