import { NextResponse } from 'next/server'
import { getAuditLogs } from '@/lib/serverTelemetry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const logs = getAuditLogs(500)
  return NextResponse.json(logs.entries)
}
