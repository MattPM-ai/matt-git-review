import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const installationId = searchParams.get("installation_id")
  const setupAction = searchParams.get("setup_action")
  const state = searchParams.get("state")
  
  // This route is deprecated - GitHub should redirect to setup URL instead
  // Redirect to the setup page to handle the flow properly
  if (installationId && setupAction) {
    const setupParams = new URLSearchParams({
      installation_id: installationId,
      setup_action: setupAction,
      ...(state && { state })
    })
    
    return NextResponse.redirect(
      new URL(`/github/setup?${setupParams.toString()}`, request.url)
    )
  }
  
  // Fallback to dashboard
  return NextResponse.redirect(new URL("/dashboard", request.url))
}