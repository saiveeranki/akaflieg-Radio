
export interface FlightScenario {
  callsign: string;
  aircraftType: string;
  location: string;
  mission: string;
  atis: string;
  currentPhase: 'PRE-FLIGHT' | 'TAXI' | 'TAKEOFF' | 'ENROUTE' | 'APPROACH' | 'LANDING';
  objectives: string[];
}

export interface TranscriptionEntry {
  role: 'student' | 'atc';
  text: string;
  timestamp: number;
}

export enum RadioService {
  GROUND = '121.700',
  TOWER = '118.100',
  DELIVERY = '124.300',
  ATIS = '113.700',
  APPROACH = '134.500'
}
