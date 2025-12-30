export interface Set {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  duration?: number;
  distance?: number;
  notes?: string;
  restTime?: number;
  rpe?: number;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'custom';
  muscleGroups: string[];
  sets: Set[];
  order: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  type: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | 'cardio' | 'custom';
  date: string;
  exercises: Exercise[];
  completed: boolean;
  notes?: string;
  duration?: number;
}

export interface Goal {
  id: string;
  type: 'weekly' | 'monthly' | 'yearly' | 'custom';
  targetType: 'workouts' | 'volume' | 'weight' | 'custom';
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  description: string;
}

export interface ProgressionData {
  date: string;
  maxWeight: number;
  maxReps: number;
  totalVolume: number;
  oneRepMax: number;
}

