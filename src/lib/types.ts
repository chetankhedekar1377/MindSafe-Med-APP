export interface Symptom {
  id: string;
  name: string;
  date: string;
  severity: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  takenToday: boolean;
}
