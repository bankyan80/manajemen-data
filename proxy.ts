import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = [
  "/dashboard", "/kesiswaan", "/gtk", "/arsip-dokumen",
  "/kurikulum", "/sarpras", "/kelembagaan", "/spmb",
  "/transisi-sd-smp", "/kegiatan-prestasi", "/monitoring",
  "/rekap-kecamatan", "/cetak-export", "/pengaturan",
];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path === "/login") return NextResponse.next();

  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (isProtected) {
    const token = await getToken({ req });

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;

    if (path.startsWith("/pengaturan") && role !== "admin_kecamatan") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (role === "pegawai") {
      const allowedPaths = ["/dashboard", "/arsip-dokumen"];
      const isAllowed = allowedPaths.some((p) => path.startsWith(p));
      if (!isAllowed && path !== "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
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
  ],
};
