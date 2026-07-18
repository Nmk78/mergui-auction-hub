import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

const isAuthPage = createRouteMatcher(["/login", "/register"]);
const isProtectedRoute = createRouteMatcher(["/seller(.*)", "/buyer(.*)"]);

const authProxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authenticated = await convexAuth.isAuthenticated();
  if (isAuthPage(request) && authenticated) {
    return nextjsMiddlewareRedirect(request, "/auctions");
  }
  if (isProtectedRoute(request) && !authenticated) {
    return nextjsMiddlewareRedirect(
      request,
      `/login?next=${encodeURIComponent(request.nextUrl.pathname)}`,
    );
  }
});

export default process.env.NEXT_PUBLIC_CONVEX_URL
  ? authProxy
  : function demoProxy() {
      return NextResponse.next();
    };

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api)(.*)"],
};
