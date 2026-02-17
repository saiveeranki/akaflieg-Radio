
export interface FlightScenario {
  callsign: string;
  aircraftType: string;
  location: string;
  mission: string;
  atis: string;
  currentPhase: 'PRE-FLIGHT' | 'TAXI' | 'TAKEOFF' | 'ENROUTE' | 'APPROACH' | 'LANDING' | 'EMERGENCY' | 'TRANSIT';
  objectives: string[];
}

export interface TranscriptionEntry {
  role: 'student' | 'atc';
  text: string;
  timestamp: number;
}

export interface ShowcaseStep {
  id: string;
  phase: string;
  frequency: string;
  pilotPrompt: string;
  atcResponse: string;
}

export interface InteractiveShowcase {
  title: string;
  description: string;
  scenario: FlightScenario;
  steps: ShowcaseStep[];
}

export enum RadioService {
  GROUND = '121.700',
  TOWER = '118.100',
  DELIVERY = '124.300',
  ATIS = '113.700',
  APPROACH = '134.500',
  INFO = '124.400'
}
