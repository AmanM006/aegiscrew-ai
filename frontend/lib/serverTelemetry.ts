import type {
  CrewStateResponse,
  AstronautStateResponse,
  TelemetryFrame,
  RiskAssessment,
  RiskFactor,
  PredictionResult,
  Countermeasure,
  CrewPatternAlert,
  AuditEntry,
} from '@/types/telemetry'

let _activeScenario = 'nominal'
let _seq = 1
const _auditLogs: AuditEntry[] = [
  {
    sequence: 1,
    timestamp: new Date().toISOString(),
    astronaut_id: 'FLEET',
    event_type: 'SCENARIO_TRIGGERED',
    summary: 'AegisCrew AI Flight Medical Data Recorder Initialized (NASA-HDBK-2203)',
    data_snapshot: { scenario: 'nominal', status: 'ONLINE' },
  },
]

export function getActiveScenario(): string {
  return _activeScenario
}

export function setActiveScenario(sc: string): string {
  _activeScenario = sc
  appendAuditLog('FLEET', 'SCENARIO_TRIGGERED', 'Mission Scenario Activated: ' + sc.toUpperCase(), { scenario: sc })
  return sc
}

export function getAuditLogs(limit: number = 50): { entries: AuditEntry[]; total_logged: number } {
  return {
    entries: _auditLogs.slice(-limit).reverse(),
    total_logged: _auditLogs.length,
  }
}

export function appendAuditLog(
  astronaut_id: string,
  event_type: 'SCENARIO_TRIGGERED' | 'COUNTERMEASURE_PRESCRIBED' | 'CREW_WIDE_ALERT' | 'BRIEFING_GENERATED' | 'CLINICAL_CHAT_QUERY',
  summary: string,
  data_snapshot: Record<string, unknown> = {}
) {
  _seq++
  _auditLogs.push({
    sequence: _seq,
    timestamp: new Date().toISOString(),
    astronaut_id,
    event_type,
    summary,
    data_snapshot,
  })
}

interface CrewProfileDef {
  id: string
  name: string
  role: string
  age: number
  gender: string
  baseline_hr: number
  baseline_hrv: number
  baseline_spo2: number
  baseline_pvt_ms: number
  target_sleep_hours: number
}

const CREW_PROFILES: CrewProfileDef[] = [
  { id: 'ASTRO-01', name: 'Elena Vance', role: 'Commander / Command Pilot', age: 42, gender: 'Female', baseline_hr: 58, baseline_hrv: 62.5, baseline_spo2: 98.5, baseline_pvt_ms: 215, target_sleep_hours: 8.0 },
  { id: 'ASTRO-02', name: 'Mark Jensen', role: 'Flight Engineer / Lead EVA Specialist', age: 39, gender: 'Male', baseline_hr: 62, baseline_hrv: 58.0, baseline_spo2: 98.0, baseline_pvt_ms: 225, target_sleep_hours: 8.0 },
  { id: 'ASTRO-03', name: 'Dr. Aris Thorne', role: 'Science Officer / Astrobiologist', age: 45, gender: 'Non-Binary', baseline_hr: 66, baseline_hrv: 52.0, baseline_spo2: 98.2, baseline_pvt_ms: 220, target_sleep_hours: 8.0 },
  { id: 'ASTRO-04', name: 'Sara Lin', role: 'Payload Specialist / Systems Engineer', age: 34, gender: 'Female', baseline_hr: 55, baseline_hrv: 65.0, baseline_spo2: 98.6, baseline_pvt_ms: 212, target_sleep_hours: 8.0 },
]

export function buildCrewState(scenario: string = _activeScenario): CrewStateResponse {
  const crewList: AstronautStateResponse[] = []
  let crewWideAlert: CrewPatternAlert | null = null

  for (const p of CREW_PROFILES) {
    const history: TelemetryFrame[] = []
    const nowMs = Date.now()

    for (let i = 47; i >= 0; i--) {
      const tSec = nowMs - i * 30 * 60 * 1000
      const phase = (48 - i) / 48 * Math.PI * 2
      history.push({
        timestamp_utc: new Date(tSec).toISOString(),
        mission_day: 142,
        crew_id: p.id,
        vitals: {
          heart_rate_bpm: p.baseline_hr + Math.sin(phase) * 3 + (Math.random() * 2 - 1),
          hrv_rmssd_ms: p.baseline_hrv + Math.cos(phase) * 4 + (Math.random() * 2 - 1),
          spo2_percent: p.baseline_spo2 - Math.random() * 0.4,
          core_temp_c: 36.8 + Math.sin(phase) * 0.2,
          blood_pressure: '118/76',
        },
        circadian: {
          sleep_hours_last_night: p.target_sleep_hours,
          sleep_debt_72h_hrs: 1.2 + (Math.random() * 0.4),
          target_sleep_hours: p.target_sleep_hours,
          pvt_reaction_time_ms: p.baseline_pvt_ms + Math.sin(phase) * 8,
          circadian_phase_shift_hrs: 0.2,
        },
        radiation: {
          daily_radiation_mgy: 0.18 + Math.random() * 0.04,
          cumulative_radiation_msv: 42.5,
          spe_alert_status: 'NOMINAL',
        },
        atmosphere: {
          cabin_co2_ppm: 2450 + Math.sin(phase) * 150,
          cabin_o2_percent: 21.0,
          cabin_pressure_kpa: 101.3,
        },
        cognitive: {
          pvt_reaction_time_ms: p.baseline_pvt_ms + Math.sin(phase) * 8,
          fatigue_index: 12.0,
          cognitive_load_score: 18.0,
        },
        composite_readiness_score: 95.0,
        status_traffic_light: 'GREEN',
      })
    }

    const latest = { ...history[history.length - 1] }
    const anomalies: RiskFactor[] = []
    const contributing_features: string[] = []
    let fatScore = 8
    let cvxScore = 12
    let radScore = 6
    let mlScore = 38
    let isAnomaly = false
    let hoursToRed: number | null = null
    let hoursToAmber: number | null = null
    let predicted6h = 'STABLE'
    const countermeasures: Countermeasure[] = []

    if (scenario === 'spe') {
      crewWideAlert = {
        pattern_type: 'ENVIRONMENTAL',
        affected_crew: ['ASTRO-01', 'ASTRO-02', 'ASTRO-03', 'ASTRO-04'],
        affected_names: ['Elena Vance', 'Mark Jensen', 'Dr. Aris Thorne', 'Sara Lin'],
        shared_features: ['SPE Active', 'Radiation Flux'],
        likely_root_cause: 'Coronal Mass Ejection (SPE). Simultaneous fleet-wide dosimetry elevation confirms space weather event — NOT isolated health issue.',
        severity: 'CRITICAL',
        recommendation: 'Initiate PROT-RAD-SPE-03. Immediate EVA halt & central storm shelter ingress.',
      }

      if (p.id === 'ASTRO-02') {
        latest.radiation.daily_radiation_mgy = 87.4
        latest.radiation.spe_alert_status = 'EMERGENCY'
        latest.vitals.heart_rate_bpm = 102.0
        latest.vitals.hrv_rmssd_ms = 18.5
        radScore = 88
        cvxScore = 80
        fatScore = 17
        mlScore = 51
        isAnomaly = true
        contributing_features.push('Radiation Flux Spike (z=12.0σ)', 'Low HRV (autonomic stress) (z=11.3σ)', 'Elevated Heart Rate (z=9.4σ)')
        hoursToRed = 0.8
        predicted6h = 'RED'
        anomalies.push({
          category: 'RADIATION',
          severity: 'CRITICAL',
          description: 'SPE ACTIVE. Daily flux 87.4 mGy/day. Immediate shelter ingress required.',
          value: 87.4,
          threshold: 50.0,
          protocol_id: 'PROT-RAD-SPE-03',
        })
        countermeasures.push({
          protocol_id: 'PROT-RAD-SPE-03',
          title: 'Solar Particle Event (SPE) Storm Shelter Ingress & Radioprotection',
          category: 'RADIATION',
          clinical_action: 'Immediate EVA termination. All crew ingress to water-wall storm shelter within 15 minutes. Administer radioprotective antioxidant therapy.',
          operational_impact: 'All EVA activities frozen. Scientific payload operations suspended. Continuous active dosimeter monitoring.',
          urgency: 'IMMEDIATE',
          citations: ['NASA NSCR-2020', 'NASA SP-2010-3407 Sec 4.3.1'],
        })
      } else {
        latest.radiation.daily_radiation_mgy = p.id === 'ASTRO-01' ? 22.1 : p.id === 'ASTRO-03' ? 18.7 : 15.3
        latest.radiation.spe_alert_status = 'WARNING'
        radScore = p.id === 'ASTRO-01' ? 43 : 35
        contributing_features.push('Radiation Flux Spike (z=12.0σ)')
        anomalies.push({
          category: 'RADIATION',
          severity: 'HIGH',
          description: 'SPE ACTIVE. Daily flux ' + latest.radiation.daily_radiation_mgy.toFixed(1) + ' mGy/day. Shelter ingress required.',
          value: latest.radiation.daily_radiation_mgy,
          threshold: 5.0,
          protocol_id: 'PROT-RAD-SPE-03',
        })
      }
    } else if (scenario === 'co2_spike') {
      crewWideAlert = {
        pattern_type: 'ENVIRONMENTAL',
        affected_crew: ['ASTRO-01', 'ASTRO-02', 'ASTRO-03', 'ASTRO-04'],
        affected_names: ['Elena Vance', 'Mark Jensen', 'Dr. Aris Thorne', 'Sara Lin'],
        shared_features: ['Low SpO2', 'PVT Degradation', 'HRV Autonomic Stress', 'Cabin CO2'],
        likely_root_cause: 'ECLSS CO2 scrubber degradation causing fleet-wide hypercapnia. Simultaneous CO2 elevation across all crew confirms cabin systems failure — NOT individual physiological event.',
        severity: 'CRITICAL',
        recommendation: 'Initiate PROT-CO2-HYPERCAPNIA-02. Amine Swing Bed scrubber override. Halt physical exercise.',
      }

      latest.atmosphere.cabin_co2_ppm = 5120.0
      latest.vitals.spo2_percent = p.id === 'ASTRO-02' ? 94.9 : p.id === 'ASTRO-03' ? 94.2 : 95.8
      latest.vitals.heart_rate_bpm = p.id === 'ASTRO-02' ? 84.0 : 79.0
      latest.vitals.hrv_rmssd_ms = 26.5
      latest.circadian.pvt_reaction_time_ms = 358.0
      cvxScore = 82
      fatScore = 35
      mlScore = 72
      isAnomaly = true
      contributing_features.push('Elevated Cabin CO2 (z=7.5σ)', 'PVT Reaction Time Degradation (z=12.0σ)', 'Reduced SpO2 (z=6.5σ)')
      hoursToRed = 1.5
      predicted6h = 'RED'
      anomalies.push({
        category: 'CARDIOVASCULAR',
        severity: 'CRITICAL',
        description: 'Cabin CO2 5,120 ppm exceeds warning threshold 4,500 ppm. Acute hypercapnia risk.',
        value: 5120.0,
        threshold: 4500.0,
        protocol_id: 'PROT-CO2-HYPERCAPNIA-02',
      })
      countermeasures.push({
        protocol_id: 'PROT-CO2-HYPERCAPNIA-02',
        title: 'ECLSS CO2 Scrubber Override & Hypercapnia Management',
        category: 'ENVIRONMENTAL',
        clinical_action: 'Engage auxiliary Amine Swing Bed scrubber cycling. Increase cabin air exchange rate to 120% nominal. Provide supplemental O2 (28% FiO2) via mask if headache reported.',
        operational_impact: 'Halt all aerobic exercise. Reduce crew physical activity to basal level. Reschedule high-cognitive-load mission tasks.',
        urgency: 'IMMEDIATE',
        citations: ['NASA-STD-3001 Vol 2 Sec 6.3.2', 'NASA SP-2010-3407 Sec 3.1.4'],
      })
    } else if (scenario === 'sleep_deprivation') {
      if (p.id === 'ASTRO-01') {
        latest.circadian.sleep_debt_72h_hrs = 9.2
        latest.circadian.sleep_hours_last_night = 3.8
        latest.circadian.pvt_reaction_time_ms = 418.0
        latest.vitals.hrv_rmssd_ms = 24.1
        fatScore = 100
        cvxScore = 75
        mlScore = 56
        isAnomaly = true
        contributing_features.push('PVT Reaction Time Degradation (z=5.5σ)', 'Sleep Debt Accumulation (z=6.3σ)')
        hoursToRed = 0.5
        predicted6h = 'RED'
        anomalies.push({
          category: 'FATIGUE',
          severity: 'CRITICAL',
          description: '72-hr sleep debt 9.2 hrs exceeds critical threshold 7.0 hrs. Severe PVT degradation (418 ms).',
          value: 9.2,
          threshold: 7.0,
          protocol_id: 'PROT-CIRCADIAN-01',
        })
        countermeasures.push({
          protocol_id: 'PROT-CIRCADIAN-01',
          title: 'Targeted Circadian Phase Shift & Fatigue Mitigation Protocol',
          category: 'CIRCADIAN',
          clinical_action: 'Administer 10,000-lux blue-enriched white light (460 nm peak) for 45 minutes upon awakening. Prescribe 10 mg Zolpidem or 0.5 mg Melatonin for target sleep window.',
          operational_impact: 'Temporary operational restriction: no solo EVA or critical flight-control maneuvers for 24 hours. Reschedule pilot-in-command duties to ASTRO-02.',
          urgency: 'URGENT',
          citations: ['NASA SP-2010-3407 Sec 2.1.2', 'Flynn-Evans et al. 2021 npj Microgravity'],
        })
      }
    } else if (scenario === 'parmitano_eva') {
      if (p.id === 'ASTRO-02') {
        latest.vitals.heart_rate_bpm = 118.0
        latest.vitals.hrv_rmssd_ms = 9.2
        latest.vitals.spo2_percent = 93.1
        latest.vitals.core_temp_c = 38.1
        latest.circadian.pvt_reaction_time_ms = 395.0
        cvxScore = 95
        fatScore = 60
        mlScore = 88
        isAnomaly = true
        contributing_features.push('Severe SpO2 Drop (z=12.0σ)', 'HRV Collapse (z=12.0σ)', 'Acute Tachycardia (z=8.5σ)')
        hoursToRed = 0.2
        predicted6h = 'RED'
        anomalies.push({
          category: 'CARDIOVASCULAR',
          severity: 'CRITICAL',
          description: 'HISTORICAL EVA-23 INCIDENT: Liquid intrusion in helmet. SpO2 93.1% & severe tachycardia. Immediate airlock ingress required.',
          value: 93.1,
          threshold: 95.0,
          protocol_id: 'PROT-EVA-ABORT-23',
        })
        countermeasures.push({
          protocol_id: 'PROT-EVA-ABORT-23',
          title: 'EMU Helmet Water Intrusion & Immediate EVA Abort',
          category: 'EVA_EMERGENCY',
          clinical_action: 'IMMEDIATE EVA TERMINATION. Guide crew member to Quest airlock. Equalize pressure, remove helmet within 90 seconds. Prepare suction and aspiration protocol.',
          operational_impact: 'All spacewalk activities aborted. Partner astronaut (ASTRO-01) assists with visual guidance and tether management.',
          urgency: 'IMMEDIATE',
          citations: ['NASA Accident Investigation Report EVA-23 (July 2013)', 'NASA-STD-3001 Vol 1 Sec 4.2'],
        })
      }
    } else if (scenario === 'lunar_surface') {
      if (p.id === 'ASTRO-01' || p.id === 'ASTRO-02') {
        latest.radiation.daily_radiation_mgy = 0.62
        latest.radiation.spe_alert_status = 'WATCH'
        latest.vitals.heart_rate_bpm = 88.0
        latest.vitals.hrv_rmssd_ms = 34.5
        latest.circadian.pvt_reaction_time_ms = 295.0
        radScore = 38
        fatScore = 32
        cvxScore = 25
        mlScore = 48
        contributing_features.push('Elevated Lunar Surface GCR (z=3.2σ)')
        anomalies.push({
          category: 'RADIATION',
          severity: 'MODERATE',
          description: 'Elevated Lunar Surface Galactic Cosmic Ray (GCR) exposure. Continuous surface dosimeter tracking.',
          value: 0.62,
          threshold: 0.5,
          protocol_id: 'PROT-LUNAR-GCR-01',
        })
      }
    }

    const subWeighted = (fatScore * 0.35 + cvxScore * 0.35 + radScore * 0.30)
    const compositeRisk = (subWeighted * 0.60 + mlScore * 0.40)
    const readinessScore = Math.max(5, Math.min(100, 100 - compositeRisk))
    const status = readinessScore >= 80 ? 'GREEN' : readinessScore >= 50 ? 'AMBER' : 'RED'

    const riskAssessment: RiskAssessment = {
      crew_id: p.id,
      timestamp_utc: latest.timestamp_utc,
      fatigue_risk_score: fatScore,
      cardiovascular_risk_score: cvxScore,
      radiation_risk_score: radScore,
      ml_anomaly_score: mlScore,
      mission_readiness_score: readinessScore,
      status,
      anomalies,
      confidence: '94% model confidence · 1,440 samples',
      ml_result: {
        crew_id: p.id,
        is_anomaly: isAnomaly,
        anomaly_score: mlScore,
        confidence_str: '94% model confidence',
        contributing_features,
        training_samples: 1440,
      },
    }

    const prediction: PredictionResult = {
      crew_id: p.id,
      current_readiness: readinessScore,
      trend_per_hour: hoursToRed ? -4.5 : 0.0,
      hours_to_red: hoursToRed,
      hours_to_amber: hoursToAmber,
      predicted_status_in_6h: (predicted6h as 'STABLE' | 'AMBER' | 'RED'),
      prediction_basis: hoursToRed ? 'Sustained physiological anomaly trend' : 'Baseline equilibrium',
      confidence: 'HIGH',
    }

    crewList.push({
      profile: { ...p, baseline_hr: p.baseline_hr, baseline_hrv: p.baseline_hrv, baseline_spo2: p.baseline_spo2, baseline_pvt_ms: p.baseline_pvt_ms },
      latest_frame: latest,
      risk: riskAssessment,
      active_countermeasures: countermeasures,
      history_24h: history,
      prediction,
    })
  }

  const fleetReadiness = crewList.reduce((acc, c) => acc + c.risk.mission_readiness_score, 0) / crewList.length
  const fleetStatus = fleetReadiness >= 80 ? 'GREEN' : fleetReadiness >= 50 ? 'AMBER' : 'RED'

  return {
    mission_name: 'Artemis Mars Transit (Deep Space Habitat)',
    mission_elapsed_day: 142,
    comms_delay_seconds: 1200.0,
    autonomous_mode: true,
    crew: crewList,
    fleet_readiness: parseFloat(fleetReadiness.toFixed(1)),
    fleet_status: fleetStatus,
    active_scenario: scenario,
    crew_wide_alert: crewWideAlert,
  }
}
