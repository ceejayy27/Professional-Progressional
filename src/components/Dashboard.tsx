import { useState, useEffect } from 'react';
import { useWorkoutStore } from '../store/store';
import { format, startOfWeek, eachDayOfInterval, isSameDay, startOfMonth, getDate } from 'date-fns';
import { Check, Edit2, Target, Trash2 } from 'lucide-react';
import { parseLocalDate } from '../lib/dateUtils';
import type { View } from '../App';

interface DashboardProps {
  setCurrentView: (view: View) => void;
}

export default function Dashboard({ setCurrentView }: DashboardProps) {
  const workouts = useWorkoutStore((state) => state.workouts);
  const monthlyBreakdown = useWorkoutStore((state) => state.getMonthlyBreakdown());
  const goals = useWorkoutStore((state) => state.goals);
  const currentSplit = useWorkoutStore((state) => state.currentSplit);
  const setCurrentSplit = useWorkoutStore((state) => state.setCurrentSplit);
  const setCurrentWorkout = useWorkoutStore((state) => state.setCurrentWorkout);
  const deleteWorkout = useWorkoutStore((state) => state.deleteWorkout);
  const loadWorkouts = useWorkoutStore((state) => state.loadWorkouts);
  const loadGoals = useWorkoutStore((state) => state.loadGoals);

  const [editingSplit, setEditingSplit] = useState(false);
  const [splitInput, setSplitInput] = useState(currentSplit);

  useEffect(() => {
    loadWorkouts();
    loadGoals();
  }, [loadWorkouts, loadGoals]);

  useEffect(() => {
    setSplitInput(currentSplit);
  }, [currentSplit]);

  const activeGoals = goals.filter((g) => !g.completed).slice(0, 3);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
  });

  const handleStartWorkout = () => {
    setCurrentWorkout({
      id: `workout-${Date.now()}`,
      name: 'New Workout',
      type: 'custom',
      date: format(new Date(), 'yyyy-MM-dd'),
      exercises: [],
      completed: false,
    });
    setCurrentView('workout');
  };

  const handleSaveSplit = () => {
    setCurrentSplit(splitInput);
    setEditingSplit(false);
  };

  const hasWorkoutOnDate = (date: Date) => {
    return workouts.some((w) => {
      if (!w.completed) return false;
      const workoutDate = parseLocalDate(w.date);
      return isSameDay(workoutDate, date);
    });
  };

  const weeklyWorkouts = workouts.filter((w) => {
    const workoutDate = parseLocalDate(w.date);
    return workoutDate >= weekStart && w.completed;
  }).length;

  // Calculate current month stats
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const daysInMonthUpToToday = getDate(today);
  
  const monthlyWorkouts = workouts.filter((w) => {
    const workoutDate = parseLocalDate(w.date);
    return workoutDate >= currentMonthStart && w.completed;
  }).length;

  const handleDeleteWorkout = async (workoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this workout?')) {
      await deleteWorkout(workoutId);
      await loadWorkouts();
    }
  };

  const getWorkoutTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      push: 'Push',
      pull: 'Pull',
      legs: 'Legs',
      upper: 'Upper',
      lower: 'Lower',
      full: 'Full Body',
      cardio: 'Cardio',
      custom: 'Custom',
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <div className="mb-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-base text-gray-600 dark:text-gray-400">Track your fitness journey</p>
          </div>
          <button
            onClick={handleStartWorkout}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Start Workout
          </button>
        </div>
      </div>

      {/* Active Goals at the top */}
      {activeGoals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Goals</h2>
          </div>
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{goal.description}</p>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((goal.currentValue / (goal.targetValue || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">This Week</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white">{weeklyWorkouts}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">workouts</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">This Month</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white">{monthlyWorkouts}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">workouts</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Split</h2>
          {!editingSplit && (
            <button
              onClick={() => {
                setSplitInput(currentSplit);
                setEditingSplit(true);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
        {editingSplit ? (
          <div className="space-y-3">
            <input
              type="text"
              value={splitInput}
              onChange={(e) => setSplitInput(e.target.value)}
              placeholder="e.g., Push/Pull/Legs, Upper/Lower"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveSplit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingSplit(false);
                  setSplitInput(currentSplit);
                }}
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {currentSplit || 'No split set. Click edit to add your current training split.'}
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">This Week</h2>
          <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            {format(new Date(), 'MMMM yyyy')}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const hasWorkout = hasWorkoutOnDate(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={index}
                className={`border-2 p-3 text-center rounded-lg ${
                  isToday
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : hasWorkout
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {format(day, 'EEE')}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {format(day, 'd')}
                </div>
                {hasWorkout && (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Workouts</h2>
        {workouts.filter((w) => w.completed).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No workouts recorded yet. Start your first workout!
          </p>
        ) : (
          <div className="space-y-2">
            {workouts
              .filter((w) => w.completed)
              .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
              .slice(0, 5)
              .map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                  onClick={() => {
                    // Create a copy for editing (mark as not completed so it can be saved)
                    const workoutForEditing = { ...workout, completed: false };
                    setCurrentWorkout(workoutForEditing);
                    setCurrentView('workout');
                  }}
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {getWorkoutTypeDisplay(workout.type)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(parseLocalDate(workout.date), 'MMM d, yyyy')} • {workout.exercises.length} exercises
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">sets</div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteWorkout(workout.id, e)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete workout"
                    >
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Monthly Progression</h2>
        <div className="space-y-2">
          {/* Current Month Stats */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {format(today, 'MMMM yyyy')}
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {monthlyWorkouts} / {daysInMonthUpToToday}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Workouts Completed This Month
            </p>
          </div>
          
          {/* Historical Months */}
          {monthlyBreakdown.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No previous months recorded yet.
            </p>
          ) : (
            monthlyBreakdown
              .filter((month) => {
                // Filter out current month from historical list
                const monthDate = new Date(`${month.month} 1, ${month.year}`);
                return !(monthDate.getMonth() === today.getMonth() && monthDate.getFullYear() === today.getFullYear());
              })
              .slice(0, 5)
              .map((month, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {month.month} {month.year}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {month.workouts}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
