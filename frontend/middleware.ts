import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, supabase } = updateSession(request);
  const { data: { user } } = await supabase.auth.getUser();
  const isSignIn = request.nextUrl.pathname === "/sign-in";
  if (!user && !isSignIn) return NextResponse.redirect(new URL("/sign-in", request.url));
  if (user && isSignIn) return NextResponse.redirect(new URL("/dashboard", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
