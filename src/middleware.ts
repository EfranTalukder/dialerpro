import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "pd_session";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/telnyx/webhook"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    isPublic(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return redirectToLogin(req);

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return NextResponse.next();
  } catch {
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
