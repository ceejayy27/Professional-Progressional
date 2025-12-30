import { Workout, Exercise } from '../types';

interface ParsedSet {
  weight?: number;
  reps?: number;
  notes?: string;
}

function parseMultipleSets(setText: string): ParsedSet[] {
  const sets: ParsedSet[] = [];
  const parts = setText.split(',').map(s => s.trim());
  
  if (parts.length === 0) return sets;
  
  const firstPart = parts[0];
  const weightMatch = firstPart.match(/(\d+p?\d*\.?\d*)x/);
  
  if (!weightMatch) return sets;
  
  const baseWeightStr = weightMatch[1];
  let baseWeight = 0;
  if (baseWeightStr.includes('p')) {
    const [plates, extra] = baseWeightStr.split('p');
    baseWeight = (parseInt(plates) * 90) + (parseInt(extra) || 0);
  } else {
    baseWeight = parseFloat(baseWeightStr);
  }
  
  parts.forEach((part, index) => {
    if (index === 0) {
      const repsMatch = part.match(/x(\d+\.?\d*)/);
      if (repsMatch) {
        sets.push({ weight: baseWeight, reps: parseFloat(repsMatch[1]) });
      }
    } else {
      const reps = parseFloat(part);
      if (!isNaN(reps)) {
        sets.push({ weight: baseWeight, reps });
      }
    }
  });
  
  return sets;
}

export function parseWorkoutLog(text: string): Workout[] {
  const workouts: Workout[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentWorkout: Workout | null = null;
  let currentExercise: Exercise | null = null;
  let currentDate = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const dateMatch = line.match(/(\d{1,2}[\/\-])(\d{1,2}[\/\-])(\d{2,4})/);
    if (dateMatch) {
      const dateStr = dateMatch[0];
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]) < 100 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
        currentDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    
    if (line.match(/^(push|pull|legs|upper|lower|full|cardio)/i)) {
      if (currentWorkout) {
        workouts.push(currentWorkout);
      }
      currentWorkout = {
        id: `workout-${Date.now()}-${i}`,
        name: line,
        type: line.toLowerCase().includes('push') ? 'push' :
              line.toLowerCase().includes('pull') ? 'pull' :
              line.toLowerCase().includes('leg') ? 'legs' :
              line.toLowerCase().includes('upper') ? 'upper' :
              line.toLowerCase().includes('lower') ? 'lower' :
              line.toLowerCase().includes('cardio') ? 'cardio' : 'custom',
        date: currentDate,
        exercises: [],
        completed: true,
      };
      currentExercise = null;
      continue;
    }
    
    if (!currentWorkout) {
      currentWorkout = {
        id: `workout-${Date.now()}-${i}`,
        name: 'Imported Workout',
        type: 'custom',
        date: currentDate,
        exercises: [],
        completed: true,
      };
    }
    
    const setMatch = line.match(/(\d+p?\d*\.?\d*)x(\d+\.?\d*(?:,\d+\.?\d*)*)/);
    if (setMatch) {
      if (!currentExercise) {
        currentExercise = {
          id: `ex-${Date.now()}-${i}`,
          name: lines[i - 1] || 'Unknown Exercise',
          type: 'strength',
          muscleGroups: [],
          sets: [],
          order: currentWorkout.exercises.length,
        };
        currentWorkout.exercises.push(currentExercise);
      }
      
      const sets = parseMultipleSets(line);
      sets.forEach((set, setIndex) => {
        if (set.weight && set.reps) {
          currentExercise!.sets.push({
            id: `set-${Date.now()}-${i}-${setIndex}`,
            weight: set.weight,
            reps: set.reps,
            completed: true,
          });
        }
      });
    } else if (!line.match(/^\d/) && line.length > 2 && !dateMatch) {
      if (currentExercise && currentExercise.sets.length > 0) {
        currentExercise = null;
      }
    }
  }
  
  if (currentWorkout) {
    workouts.push(currentWorkout);
  }
  
  return workouts.filter(w => w.exercises.length > 0);
}

