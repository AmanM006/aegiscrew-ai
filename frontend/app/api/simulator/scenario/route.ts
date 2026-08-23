import { NextRequest, NextResponse } from 'next/server'
import { setActiveScenario } from '@/lib/serverTelemetry'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const scenario = body.scenario || 'nominal'
    setActiveScenario(scenario)
    return NextResponse.json({
      active_scenario: scenario,
      status: 'OK',
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
