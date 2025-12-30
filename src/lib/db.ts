import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Workout, Goal } from '../types';

interface WorkoutDB extends DBSchema {
  workouts: {
    key: string;
    value: Workout;
    indexes: { 'by-date': string };
  };
  goals: {
    key: string;
    value: Goal;
  };
}

let dbInstance: IDBPDatabase<WorkoutDB> | null = null;

export const db = {
  async init(): Promise<IDBPDatabase<WorkoutDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<WorkoutDB>('workout-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
          workoutStore.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id' });
        }
      },
    });

    return dbInstance;
  },

  async getAllWorkouts(): Promise<Workout[]> {
    const db = await this.init();
    return db.getAll('workouts');
  },

  async saveWorkout(workout: Workout): Promise<void> {
    const db = await this.init();
    await db.put('workouts', workout);
  },

  async updateWorkout(id: string, updates: Partial<Workout>): Promise<void> {
    const db = await this.init();
    const workout = await db.get('workouts', id);
    if (workout) {
      await db.put('workouts', { ...workout, ...updates });
    }
  },

  async deleteWorkout(id: string): Promise<void> {
    const db = await this.init();
    await db.delete('workouts', id);
  },

  async getAllGoals(): Promise<Goal[]> {
    const db = await this.init();
    return db.getAll('goals');
  },

  async saveGoal(goal: Goal): Promise<void> {
    const db = await this.init();
    await db.put('goals', goal);
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    const db = await this.init();
    const goal = await db.get('goals', id);
    if (goal) {
      await db.put('goals', { ...goal, ...updates });
    }
  },

  async deleteGoal(id: string): Promise<void> {
    const db = await this.init();
    await db.delete('goals', id);
  },
};

