export type LiftType = 'squat' | 'bench' | 'deadlift';

export interface CompetitionDetails {
  eventName: string;
  lifterName: string;
  weightClass: string;
  competitionDate: string;
  weighInTime: string;
}

export interface EquipmentSettings {
  squatRackHeight: string;
  squatStands: string;
  benchRackHeight: string;
  handOut: string;
  benchSafetyHeight: string;
}

export interface Attempt {
  '1': string;
  '2': string;
  '3': string;
}

export interface WarmupSet {
  weight: string;
  reps: string;
}

export interface Plate {
    weight: number;
    color: string;
    size: string;
}

export interface LiftState {
  attempts: Attempt;
  warmups: WarmupSet[];
  cues: string[];
  error: boolean;
  includeCollars: boolean;
}

export type LiftsState = Record<LiftType, LiftState>;

export interface AppState {
  details: CompetitionDetails;
  equipment: EquipmentSettings;
  lifts: LiftsState;
}