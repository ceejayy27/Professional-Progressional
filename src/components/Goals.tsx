import { useState, useEffect } from 'react';
import { useWorkoutStore } from '../store/store';
import { Goal } from '../types';
import { Plus, Target, CheckCircle, Circle, X } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '../lib/dateUtils';

export default function Goals() {
  const goals = useWorkoutStore((state) => state.goals);
  const loadGoals = useWorkoutStore((state) => state.loadGoals);
  const addGoal = useWorkoutStore((state) => state.addGoal);
  const updateGoal = useWorkoutStore((state) => state.updateGoal);
  const deleteGoal = useWorkoutStore((state) => state.deleteGoal);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [goalDescription, setGoalDescription] = useState('');

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreateGoal = () => {
    if (!goalDescription.trim()) return;

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      type: 'custom',
      targetType: 'custom',
      targetValue: 1,
      currentValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      completed: false,
      description: goalDescription.trim(),
    };

    addGoal(goal);
    setGoalDescription('');
    setShowNewGoal(false);
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Goals</h1>
          <p className="text-base text-gray-600 dark:text-gray-400">Set and track your fitness goals</p>
        </div>
      </div>

      {showNewGoal ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Goal</h3>
          <textarea
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleCreateGoal();
              }
            }}
            placeholder="e.g., Bench press 225 lbs, Complete 50 workouts this month, Run a 5K..."
            className="w-full h-24 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-4"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateGoal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Create Goal
            </button>
            <button
              onClick={() => {
                setShowNewGoal(false);
                setGoalDescription('');
              }}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewGoal(true)}
          className="w-full mb-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Goal
        </button>
      )}

      {activeGoals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Goals</h2>
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} onDelete={deleteGoal} />
            ))}
          </div>
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Completed</h2>
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} onDelete={deleteGoal} />
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 && !showNewGoal && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No goals set yet. Create your first goal to get started!
          </p>
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: Goal;
  onUpdate: (id: string, updates: Partial<Goal>) => void;
  onDelete: (id: string) => void;
}) {
  const isComplete = goal.completed;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 border ${
        isComplete
          ? 'border-gray-300 dark:border-gray-600'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 flex items-start gap-4">
          <button
            onClick={() => onUpdate(goal.id, { completed: !goal.completed })}
            className="mt-1 flex-shrink-0"
          >
            {isComplete ? (
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="w-6 h-6 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
            )}
          </button>
          <div className="flex-1">
            <p
              className={`text-xl font-semibold mb-2 ${
                isComplete
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {goal.description}
            </p>
            {goal.startDate && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Started {format(parseLocalDate(goal.startDate), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}

