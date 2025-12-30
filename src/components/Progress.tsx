import { useState, useEffect, useMemo } from 'react';
import { useWorkoutStore } from '../store/store';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Sparkles, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { parseLocalDate } from '../lib/dateUtils';
import type { View } from '../App';

interface ExerciseProgression {
  exerciseName: string;
  data: Array<{
    date: string;
    maxWeight: number;
    maxReps: number;
    totalVolume: number;
    oneRepMax: number;
  }>;
  insight: string;
  trend: 'up' | 'down' | 'stable';
}

interface ProgressProps {
  setCurrentView?: (view: View) => void;
}

export default function Progress({ setCurrentView }: ProgressProps) {
  const workouts = useWorkoutStore((state) => state.workouts);
  const getProgressionData = useWorkoutStore((state) => state.getProgressionData);
  const setCurrentWorkout = useWorkoutStore((state) => state.setCurrentWorkout);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<string | null>(null);

  // Group exercises by split (workout type)
  const exercisesBySplit = useMemo(() => {
    const splitMap: Record<string, Set<string>> = {};
    workouts
      .filter((w) => w.completed)
      .forEach((workout) => {
        const split = workout.type;
        if (!splitMap[split]) {
          splitMap[split] = new Set();
        }
        workout.exercises.forEach((ex) => {
          if (ex.type === 'strength') {
            splitMap[split].add(ex.name);
          }
        });
      });
    return splitMap;
  }, [workouts]);

  // Get all unique exercises (for backward compatibility)
  const allExercises = useMemo(() => {
    const exerciseSet = new Set<string>();
    Object.values(exercisesBySplit).forEach((exerciseSetForSplit) => {
      exerciseSetForSplit.forEach((ex) => exerciseSet.add(ex));
    });
    return Array.from(exerciseSet).sort();
  }, [exercisesBySplit]);

  // Get exercises for selected split
  const exercisesForSplit = useMemo(() => {
    if (!selectedSplit) return [];
    return Array.from(exercisesBySplit[selectedSplit] || []).sort();
  }, [selectedSplit, exercisesBySplit]);

  useEffect(() => {
    if (selectedSplit && exercisesForSplit.length > 0 && !selectedExercise) {
      setSelectedExercise(exercisesForSplit[0]);
    } else if (!selectedSplit && allExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(allExercises[0]);
    }
  }, [selectedSplit, exercisesForSplit, allExercises, selectedExercise]);

  const progressionData = useMemo(() => {
    if (!selectedExercise) return null;
    
    const rawData = getProgressionData(selectedExercise, 100);
    if (rawData.length === 0) return null;

    const chartData = rawData.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      fullDate: d.date,
      maxWeight: d.maxWeight || 0,
      maxReps: d.maxReps || 0,
      oneRepMax: d.oneRepMax || 0,
      totalVolume: d.totalVolume,
    }));

    if (chartData.length >= 2) {
      const recent = chartData.slice(-3);
      const older = chartData.slice(0, 3);
      const recentAvg = recent.reduce((sum, d) => sum + (d.oneRepMax || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, d) => sum + (d.oneRepMax || 0), 0) / older.length;
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';

      const insight = generateInsight(selectedExercise, chartData, trend, change);

      return {
        exerciseName: selectedExercise,
        data: chartData,
        trend,
        insight,
      } as ExerciseProgression;
    }

    return {
      exerciseName: selectedExercise,
      data: chartData,
      trend: 'stable' as const,
      insight: 'Keep tracking! More data needed for insights.',
    } as ExerciseProgression;
  }, [selectedExercise, getProgressionData]);

  function generateInsight(
    _exerciseName: string,
    data: Array<{ oneRepMax: number; maxWeight: number; maxReps: number }>,
    trend: 'up' | 'down' | 'stable',
    _change: number
  ): string {
    if (data.length < 2) {
      return 'Continue tracking this exercise to see progression insights.';
    }

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];

    const weightChange = latest.maxWeight - previous.maxWeight;
    const repsChange = latest.maxReps - previous.maxReps;

    if (trend === 'up') {
      if (weightChange > 0 && repsChange >= 0) {
        return `Great progress! You've increased both weight (${weightChange.toFixed(0)} lbs) and maintained or improved reps. This indicates strong strength gains.`;
      } else if (weightChange > 0) {
        return `Strength is improving! You're lifting ${weightChange.toFixed(0)} lbs more. Consider focusing on rep progression next.`;
      } else {
        return `Rep performance is improving while maintaining weight. This shows increased muscular endurance.`;
      }
    } else if (trend === 'down') {
      return `Recent performance has decreased. This could indicate fatigue, need for deload, or training adaptation. Consider reviewing your recovery and programming.`;
    } else {
      return `Performance is stable. To continue progressing, consider progressive overload: gradually increase weight or reps in upcoming sessions.`;
    }
  }

  const handleAutofillWorkout = (split: string) => {
    // Get the most recent workout of this split type
      const recentWorkout = workouts
      .filter((w) => w.completed && w.type === split)
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())[0];

    if (recentWorkout) {
      // Create a new workout with the same exercises but empty sets for user to fill in
      const newWorkout = {
        id: `workout-${Date.now()}`,
        name: recentWorkout.name,
        type: split as 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | 'cardio' | 'custom',
        date: format(new Date(), 'yyyy-MM-dd'),
        exercises: recentWorkout.exercises
          .filter((ex) => ex.type === 'strength')
          .map((ex, index) => ({
            ...ex,
            id: `ex-${Date.now()}-${index}`,
            sets: [
              {
                id: `set-${Date.now()}-${index}-0`,
                weight: 0,
                reps: 0,
                completed: false,
              },
            ],
            order: index,
          })),
        completed: false,
      };
      setCurrentWorkout(newWorkout);
      if (setCurrentView) {
        setCurrentView('workout');
      }
    }
  };

  const getSplitDisplayName = (split: string) => {
    const splitMap: Record<string, string> = {
      push: 'Push',
      pull: 'Pull',
      legs: 'Legs',
      upper: 'Upper',
      lower: 'Lower',
      full: 'Full Body',
      cardio: 'Cardio',
      custom: 'Custom',
    };
    return splitMap[split] || split.charAt(0).toUpperCase() + split.slice(1);
  };

  if (allExercises.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Progress</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No workout data yet. Complete some workouts to see your progression!
          </p>
        </div>
      </div>
    );
  }

  const splits = Object.keys(exercisesBySplit).filter((split) => exercisesBySplit[split].size > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Progress</h1>
        <p className="text-base text-gray-600 dark:text-gray-400">Track your strength progression over time</p>
      </div>

      {/* Split Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Group by Split</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedSplit(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedSplit === null
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            All Exercises
          </button>
          {splits.map((split) => (
            <button
              key={split}
              onClick={() => {
                setSelectedSplit(split);
                setSelectedExercise(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedSplit === split
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              {getSplitDisplayName(split)}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {selectedSplit ? `${getSplitDisplayName(selectedSplit)} Exercises` : 'All Exercises'}
          </h2>
          {selectedSplit && (
            <button
              onClick={() => handleAutofillWorkout(selectedSplit)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Autofill {getSplitDisplayName(selectedSplit)} Workout
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(selectedSplit ? exercisesForSplit : allExercises).map((exercise) => (
            <button
              key={exercise}
              onClick={() => setSelectedExercise(exercise)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedExercise === exercise
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              {exercise}
            </button>
          ))}
        </div>
      </div>

      {progressionData && (
        <>
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Insight</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{progressionData.insight}</p>
              </div>
              <div className="flex items-center gap-2">
                {progressionData.trend === 'up' && (
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
                {progressionData.trend === 'down' && (
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                {progressionData.trend === 'stable' && (
                  <Minus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {progressionData.exerciseName} - Estimated 1RM
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressionData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  stroke="#6b7280"
                  className="dark:stroke-gray-400"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="oneRepMax"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Est. 1RM (lbs)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Performance</h2>
            <div className="space-y-2">
              {progressionData.data.slice(-5).reverse().map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{entry.date}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.maxWeight} lbs × {entry.maxReps} reps
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {entry.oneRepMax.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">lbs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
