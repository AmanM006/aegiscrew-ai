import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs } from '@/lib/serverTelemetry'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const logs = getAuditLogs(limit)
  return NextResponse.json(logs)
}
