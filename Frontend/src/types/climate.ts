export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export type AddressResolutionState = 'MANUAL' | 'RESOLVING...' | 'LOCATED' | 'UNRESOLVED';

export type LocationStatus = 'INITIALIZING' | 'REQUESTING LOCATION' | 'LOCATION LOCKED' | 'LOCATION UNAVAILABLE';

export type AppView = 'HERO' | 'AREA' | 'WEATHER' | 'RISK' | 'ALERTS' | 'ASSISTANT' | 'PROFILE';

export type InitPhase =
  | 'IDLE'
  | 'INITIALIZING'
  | 'ESTABLISHING_LINK'
  | 'RESOLVING_LOCATION'
  | 'BUILDING_RISK_PROFILE'
  | 'READY'
  | 'ERROR';

export interface Coordinates {
  lat: number;
  lng: number;
  label?: string;
  city?: string;
  country?: string;
}

export interface ForecastDay {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  condition: string;
  precipProb: number;
}

export interface ClimateConditions {
  temperature: number;
  feelsLike?: number;
  humidity: number;
  windSpeed: number;
  windDirection?: number;
  pressure?: number;
  uvIndex?: number;
  precipitationChance: number;
  rainfallMm?: number;
  risk: RiskLevel;
  conditionDescription: string;
  source: 'live' | 'station' | 'satellite';
  lastUpdated: string;
  forecast?: ForecastDay[];
}

export interface TelemetryState {
  orbitalLat: number;
  orbitalLon: number;
  surfaceLock: boolean;
  satLinkOnline: boolean;
  systemOnline: boolean;
  utcTimestamp: string;
}

export interface OperatorForm {
  name: string;
  phone: string;
  address: string;
}

export interface SystemRiskReport {
  id: string;
  timestamp: string;
  operator: OperatorForm;
  coordinates: Coordinates;
  conditions: ClimateConditions;
  riskScore: number;
  riskLevel: RiskLevel;
  advisories: string[];
}

export interface AlertItem {
  id: string;
  type: 'HEATWAVE' | 'HEAVY_RAIN' | 'AIR_QUALITY' | 'GALE_FORCE_WIND' | 'DROUGHT';
  severity: RiskLevel;
  title: string;
  message: string;
  time: string;
  status: 'ACTIVE' | 'SENT' | 'READ' | 'RESOLVED';
  advisory: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  contextTags?: string[];
}
