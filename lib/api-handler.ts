import { NextResponse } from 'next/server'

type ApiHandler = () => Promise<NextResponse>

export async function safeApi(handler: ApiHandler): Promise<NextResponse> {
  try {
    return await handler()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    console.error('[API Error]', err)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
