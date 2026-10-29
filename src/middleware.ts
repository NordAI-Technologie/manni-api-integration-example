import { NextRequest, NextResponse } from "next/server";
import { checkDemoAccess } from "./server/access-control";

export async function middleware(request: NextRequest) {
  return (await checkDemoAccess(request)) || NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
