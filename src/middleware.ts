import { defineMiddleware } from "astro:middleware";
import { isAdminRequest } from "./lib/adminAuth";

const isAdminPage = (pathname: string) =>
  pathname === "/admin" || (pathname.startsWith("/admin/") && pathname !== "/admin/login");

const isProtectedEventWrite = (pathname: string, method: string) =>
  pathname === "/api/event" && ["POST", "PUT", "DELETE"].includes(method.toUpperCase());

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;
  const pathname = url.pathname;
  const method = request.method;

  const needsAdmin = isAdminPage(pathname) || isProtectedEventWrite(pathname, method);
  if (!needsAdmin) {
    return next();
  }

  if (isAdminRequest(context.cookies)) {
    return next();
  }

  if (isAdminPage(pathname)) {
    const nextTarget = `${pathname}${url.search}`;
    const loginUrl = new URL("/admin/login", url);
    loginUrl.searchParams.set("next", nextTarget);
    return Response.redirect(loginUrl, 302);
  }

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
});
