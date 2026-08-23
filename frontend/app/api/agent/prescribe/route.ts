import { NextRequest, NextResponse } from 'next/server'
import { appendAuditLog } from '@/lib/serverTelemetry'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const crewId = body.crew_id || 'ASTRO-01'

    let prescription = ''
    if (crewId === 'ASTRO-02') {
      prescription =
        '### Clinical Countermeasures for ASTRO-02 (Mark Jensen)\n\n' +
        '#### 1. SPE Radiation Protection & Storm Shelter Ingress\n' +
        '- **Protocol ID:** NASA-STD-3001, Vol 1 Sec 4.3 & PROT-RAD-SPE-03\n' +
        '- **Action:** Immediate EVA abort. Ingress to central water-wall storm shelter within 15 minutes.\n' +
        '- **Radioprotection:** Administer 500 mg Amifostine / antioxidant cocktail if solar flux > 50 mGy.\n\n' +
        '#### 2. Autonomic Shock & Cardiovascular Stabilization\n' +
        '- **Protocol ID:** NASA SP-2010-3407, Sec 4.2.1\n' +
        '- **Action:** Continuous HR and HRV RMSSD monitoring. Target HR < 90 bpm.'
    } else {
      prescription =
        `### Clinical Countermeasures for ${crewId}\n\n` +
        '#### 1. Circadian Rhythm & Autonomic Stabilization\n' +
        '- **Protocol ID:** NASA-STD-3001, Section 2.3.1\n' +
        '- **Action:** Continuously monitor heart rate and HRV RMSSD. Ensure resting HR within 45-90 bpm.\n\n' +
        '#### 2. Respiratory & Oxygenation Maintenance\n' +
        '- **Protocol ID:** NASA-STD-3001, Section 2.3.2\n' +
        '- **Action:** Maintain cabin SpO2 > 96%. Ensure ambient CO2 < 3,000 ppm.'
    }

    appendAuditLog(crewId, 'COUNTERMEASURE_PRESCRIBED', `Clinical Protocol Prescribed for ${crewId}`, { crewId, prescription })

    return NextResponse.json({
      crew_id: crewId,
      prescription,
      countermeasures: [],
      model_used: 'ibm/granite-4-h-small',
      mock_mode: true,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
