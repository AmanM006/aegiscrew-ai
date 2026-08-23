import { NextResponse } from 'next/server'
import { buildCrewState, getActiveScenario } from '@/lib/serverTelemetry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const scenario = getActiveScenario()
  const state = buildCrewState(scenario)
  return NextResponse.json(state)
}
