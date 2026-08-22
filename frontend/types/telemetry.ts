// AegisCrew AI — Full TypeScript type definitions (v3 — ML + Correlation + Prediction)

export type TrafficLight = 'GREEN' | 'AMBER' | 'RED'
export type SPEAlertStatus = 'NOMINAL' | 'WATCH' | 'WARNING' | 'EMERGENCY'
export type Urgency = 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'IMMEDIATE'
export type RiskSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
export type ScenarioName = 'nominal' | 'spe' | 'co2_spike' | 'sleep_deprivation'

export interface AstronautVitals {
  heart_rate_bpm: number
  hrv_rmssd_ms: number
  spo2_percent: number
  core_temp_c: number
  blood_pressure?: string
}

export interface CircadianMetrics {
  sleep_hours_last_night: number
  sleep_debt_72h_hrs: number
  target_sleep_hours: number
  pvt_reaction_time_ms: number
  circadian_phase_shift_hrs: number
}

export interface RadiationDosimetry {
  daily_radiation_mgy: number
  cumulative_radiation_msv: number
  spe_alert_status: SPEAlertStatus
}

export interface CabinAtmosphere {
  cabin_co2_ppm: number
  cabin_o2_percent: number
  cabin_pressure_kpa: number
}

export interface CognitiveAcuity {
  pvt_reaction_time_ms: number
  fatigue_index: number
  cognitive_load_score: number
}

export interface TelemetryFrame {
  mission_day: number
  timestamp_utc: string
  crew_id: string
  vitals: AstronautVitals
  circadian: CircadianMetrics
  radiation: RadiationDosimetry
  atmosphere: CabinAtmosphere
  cognitive: CognitiveAcuity
  composite_readiness_score: number
  status_traffic_light: TrafficLight
}

export interface RiskFactor {
  category: string
  severity: RiskSeverity
  value: number
  threshold: number
  description: string
  protocol_id?: string
}

// IsolationForest ML anomaly result
export interface AnomalyResult {
  crew_id: string
  anomaly_score: number
  is_anomaly: boolean
  contributing_features: string[]
  confidence_str: string
  training_samples: number
}

// Cross-crew systemic pattern detection
export interface CrewPatternAlert {
  pattern_type: string
  affected_crew: string[]
  affected_names: string[]
  shared_features: string[]
  likely_root_cause: string
  severity: string
  recommendation: string
}

// Predictive trajectory
export interface PredictionResult {
  crew_id: string
  current_readiness: number
  trend_per_hour: number            // negative = degrading
  hours_to_red: number | null
  hours_to_amber: number | null
  predicted_status_in_6h: string   // "GREEN" | "AMBER" | "RED" | "STABLE"
  prediction_basis: string
  confidence: string
}

export interface RiskAssessment {
  crew_id: string
  timestamp_utc: string
  fatigue_risk_score: number
  cardiovascular_risk_score: number
  radiation_risk_score: number
  ml_anomaly_score: number
  mission_readiness_score: number
  status: TrafficLight
  anomalies: RiskFactor[]
  ml_result: AnomalyResult | null
  confidence: string
}

export interface Countermeasure {
  protocol_id: string
  title: string
  category: string
  clinical_action: string
  operational_impact: string
  urgency: Urgency
  citations: string[]
}

export interface CrewProfile {
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

export interface AstronautStateResponse {
  profile: CrewProfile
  latest_frame: TelemetryFrame
  risk: RiskAssessment
  active_countermeasures: Countermeasure[]
  history_24h: TelemetryFrame[]
  prediction: PredictionResult | null
}

export interface CrewStateResponse {
  mission_name: string
  mission_elapsed_day: number
  comms_delay_seconds: number
  autonomous_mode: boolean
  crew: AstronautStateResponse[]
  fleet_readiness: number
  fleet_status: TrafficLight
  active_scenario: string
  crew_wide_alert: CrewPatternAlert | null
}

export interface AgentBriefingResponse {
  briefing: string
  generated_at: string
  model_used: string
  mock_mode: boolean
}

export interface AgentPrescribeResponse {
  crew_id: string
  prescription: string
  countermeasures: Countermeasure[]
  model_used: string
  mock_mode: boolean
}

export interface AgentChatResponse {
  reply: string
  model_used: string
  mock_mode: boolean
}

export interface ScenarioDescription {
  [key: string]: string
}
