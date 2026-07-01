import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = [
  "/dashboard", "/kesiswaan", "/gtk", "/arsip-dokumen",
  "/kurikulum", "/sarpras", "/kelembagaan", "/spmb",
  "/transisi-sd-smp", "/kegiatan-prestasi", "/monitoring",
  "/rekap-kecamatan", "/cetak-export", "/pengaturan",
  "/schools", "/teachers", "/certification", "/infrastructure",
  "/archives", "/ai", "/reports", "/gis",
  "/profile",
];

const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function addSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (req.method === "OPTIONS") {
    const res = NextResponse.json({}, { status: 200 });
    return addSecurityHeaders(res);
  }

  if (path === "/login") {
    const res = NextResponse.next();
    return addSecurityHeaders(res);
  }

  const isApiRoute = path.startsWith("/api/") && !path.startsWith("/api/auth/");

  if (isApiRoute) {
    const token = await getToken({ req });
    if (!token) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return addSecurityHeaders(res);
    }
    const res = NextResponse.next();
    return addSecurityHeaders(res);
  }

  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (isProtected) {
    const token = await getToken({ req });

    if (!token) {
      const res = NextResponse.redirect(new URL("/login", req.url));
      return addSecurityHeaders(res);
    }

    const role = token.role as string;

    if (path.startsWith("/pengaturan") && role !== "admin_kecamatan") {
      const res = NextResponse.redirect(new URL("/dashboard", req.url));
      return addSecurityHeaders(res);
    }

    if (role === "pegawai") {
      const allowedPaths = ["/dashboard", "/arsip-dokumen"];
      const isAllowed = allowedPaths.some((p) => path.startsWith(p));
      if (!isAllowed && path !== "/") {
        const res = NextResponse.redirect(new URL("/dashboard", req.url));
        return addSecurityHeaders(res);
      }
    }

    if (role === "guru_tendik") {
      const allowedPaths = ["/dashboard", "/certification", "/archives", "/profile"];
      const isAllowed = allowedPaths.some((p) => path.startsWith(p));
      if (!isAllowed && path !== "/") {
        const res = NextResponse.redirect(new URL("/dashboard", req.url));
        return addSecurityHeaders(res);
      }
    }
  }

  const res = NextResponse.next();
  return addSecurityHeaders(res);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/kesiswaan/:path*",
    "/gtk/:path*",
    "/arsip-dokumen/:path*",
    "/kurikulum/:path*",
    "/sarpras/:path*",
    "/kelembagaan/:path*",
    "/spmb/:path*",
    "/transisi-sd-smp/:path*",
    "/kegiatan-prestasi/:path*",
    "/monitoring/:path*",
    "/rekap-kecamatan/:path*",
    "/cetak-export/:path*",
    "/pengaturan/:path*",
    "/login",
    "/schools/:path*",
    "/teachers/:path*",
    "/certification/:path*",
    "/infrastructure/:path*",
    "/archives/:path*",
    "/ai/:path*",
    "/reports/:path*",
    "/gis/:path*",
    "/profile/:path*",
  ],
};
