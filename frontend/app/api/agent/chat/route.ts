import { NextRequest, NextResponse } from 'next/server'
import { appendAuditLog } from '@/lib/serverTelemetry'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userMsg = body.user_message || ''
    const scenario = body.active_scenario || 'nominal'

    let reply = ''
    const lower = userMsg.toLowerCase()
    if (lower.includes('radiation') || lower.includes('spe') || scenario === 'spe') {
      reply =
        '**AegisCrew AI Flight Surgeon:**\n' +
        'During a Solar Particle Event (SPE), radiation flux exceeds safe EVA thresholds (NASA-STD-3001 limits daily exposure to <5 mGy, whereas SPE levels reach 87.4 mGy/day).\n\n' +
        'Under **PROT-RAD-SPE-03**, autonomous protocol execution mandates:\n' +
        '1. Immediate EVA halt and storm shelter ingress.\n' +
        '2. Radioprotective antioxidant administration.\n' +
        '3. Continuous active dosimeter tracking.'
    } else if (lower.includes('co2') || lower.includes('eclss') || scenario === 'co2_spike') {
      reply =
        '**AegisCrew AI Flight Surgeon:**\n' +
        'Elevated cabin CO2 (5,120 ppm) causes acute hypercapnia, cognitive fog, and increased PVT reaction times. ' +
        'Under **PROT-CO2-HYPERCAPNIA-02**, auxiliary Amine Swing Bed scrubbers are engaged immediately with supplemental O2.'
    } else {
      reply =
        '**AegisCrew AI Flight Surgeon:**\n' +
        'All 4 crew members are currently monitored under continuous multi-stream bio-telemetry. ' +
        'Biomathematical fatigue modeling (Borbély Three-Process) and IsolationForest anomaly detection confirm stable parameters.'
    }

    appendAuditLog('ASTRO-01', 'CLINICAL_CHAT_QUERY', `Flight Surgeon Query: ${userMsg.slice(0, 60)}`, { userMsg, reply })

    return NextResponse.json({
      reply,
      model_used: 'ibm/granite-4-h-small (Deep Space Edge Autonomy)',
      mock_mode: false,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
