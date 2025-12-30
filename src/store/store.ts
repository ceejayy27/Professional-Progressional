import { create } from 'zustand';
import { Workout, Goal, ProgressionData } from '../types';
import { db } from '../lib/db';
import { parseLocalDate } from '../lib/dateUtils';

interface WorkoutState {
  workouts: Workout[];
  goals: Goal[];
  currentWorkout: Workout | null;
  currentSplit: string;
  
  addWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (id: string, updates: Partial<Workout>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  loadWorkouts: () => Promise<void>;
  
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  loadGoals: () => Promise<void>;
  
  setCurrentWorkout: (workout: Workout | null) => void;
  setCurrentSplit: (split: string) => void;
  
  getProgressionData: (exerciseName: string, limit?: number) => ProgressionData[];
  getWeeklyStats: () => { workouts: number; volume: number; time: number };
  getMonthlyStats: () => { workouts: number; volume: number; time: number };
  getMonthlyBreakdown: () => Array<{ month: string; year: number; workouts: number }>;
}

const getCurrentSplit = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('currentSplit') || '';
  }
  return '';
};

export const useWorkoutStore = create<WorkoutState>((setState, get) => ({
  workouts: [],
  goals: [],
  currentWorkout: null,
  currentSplit: getCurrentSplit(),
  
  setCurrentSplit: (split: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('currentSplit', split);
    }
    setState({ currentSplit: split });
  },

  loadWorkouts: async () => {
    const workouts = await db.getAllWorkouts();
    setState({ workouts });
  },

  addWorkout: async (workout) => {
    await db.saveWorkout(workout);
    const workouts = await db.getAllWorkouts();
    setState({ workouts });
  },

  updateWorkout: async (id, updates) => {
    await db.updateWorkout(id, updates);
    const workouts = await db.getAllWorkouts();
    setState({ workouts });
  },

  deleteWorkout: async (id) => {
    await db.deleteWorkout(id);
    const workouts = await db.getAllWorkouts();
    setState({ workouts });
  },

  loadGoals: async () => {
    const goals = await db.getAllGoals();
    setState({ goals });
  },

  addGoal: async (goal) => {
    await db.saveGoal(goal);
    const goals = await db.getAllGoals();
    setState({ goals });
  },

  updateGoal: async (id, updates) => {
    await db.updateGoal(id, updates);
    const goals = await db.getAllGoals();
    setState({ goals });
  },

  deleteGoal: async (id) => {
    await db.deleteGoal(id);
    const goals = await db.getAllGoals();
    setState({ goals });
  },

  setCurrentWorkout: (workout) => {
    setState({ currentWorkout: workout });
  },

  getProgressionData: (exerciseName, limit = 50) => {
    const { workouts } = get();
    const completedWorkouts = workouts.filter((w) => w.completed);
    const progression: ProgressionData[] = [];
    
    completedWorkouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        if (exercise.name.toLowerCase() === exerciseName.toLowerCase() && exercise.type === 'strength') {
          const sets = exercise.sets.filter((s) => s.completed && s.weight > 0 && s.reps > 0);
          if (sets.length > 0) {
            const maxWeight = Math.max(...sets.map((s) => s.weight));
            const maxReps = Math.max(...sets.map((s) => s.reps));
            const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
            const oneRepMax = maxWeight * (1 + maxReps / 30);
            
            progression.push({
              date: workout.date,
              maxWeight,
              maxReps,
              totalVolume,
              oneRepMax,
            });
          }
        }
      });
    });
    
    return progression
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
      .slice(-limit);
  },

  getWeeklyStats: () => {
    const { workouts } = get();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weeklyWorkouts = workouts.filter((w) => {
      const workoutDate = parseLocalDate(w.date);
      return workoutDate >= weekStart && w.completed;
    });
    
    const volume = weeklyWorkouts.reduce((sum, w) => {
      return sum + w.exercises.reduce((exSum, ex) => {
        return exSum + ex.sets.reduce((setSum, set) => {
          return setSum + (set.weight * set.reps);
        }, 0);
      }, 0);
    }, 0);
    
    return {
      workouts: weeklyWorkouts.length,
      volume,
      time: 0,
    };
  },

  getMonthlyStats: () => {
    const { workouts } = get();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthlyWorkouts = workouts.filter((w) => {
      const workoutDate = parseLocalDate(w.date);
      return workoutDate >= monthStart && w.completed;
    });
    
    const volume = monthlyWorkouts.reduce((sum, w) => {
      return sum + w.exercises.reduce((exSum, ex) => {
        return exSum + ex.sets.reduce((setSum, set) => {
          return setSum + (set.weight * set.reps);
        }, 0);
      }, 0);
    }, 0);
    
    return {
      workouts: monthlyWorkouts.length,
      volume,
      time: 0,
    };
  },

  getMonthlyBreakdown: () => {
    const { workouts } = get();
    const completedWorkouts = workouts.filter((w) => w.completed);
    const monthlyData: Record<string, { month: string; year: number; workouts: number }> = {};
    
    completedWorkouts.forEach((workout) => {
      const date = parseLocalDate(workout.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleString('default', { month: 'long' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          year: date.getFullYear(),
          workouts: 0,
        };
      }
      monthlyData[monthKey].workouts++;
    });
    
    return Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const monthA = new Date(`${a.month} 1, ${a.year}`).getMonth();
      const monthB = new Date(`${b.month} 1, ${b.year}`).getMonth();
      return monthB - monthA;
    });
  },
}));

