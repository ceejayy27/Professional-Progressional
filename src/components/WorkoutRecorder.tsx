import { useState, useEffect, useRef } from 'react';
import { useWorkoutStore } from '../store/store';
import { Workout, Exercise } from '../types';
import { format } from 'date-fns';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { parseWorkoutLog } from '../lib/parser';
import type { View } from '../App';

interface ExerciseSet {
  id: string;
  weight: number | '';
  reps: number | '';
}

interface ExerciseEntry {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  usePlates?: boolean;
}

interface CardioEntry {
  id: string;
  cardioType: string;
  distance: number | '';
  time: number | '';
  calories: number | '';
}

interface WorkoutRecorderProps {
  setCurrentView?: (view: View) => void;
}

export default function WorkoutRecorder({ setCurrentView }: WorkoutRecorderProps) {
  const currentWorkout = useWorkoutStore((state) => state.currentWorkout);
  const setCurrentWorkout = useWorkoutStore((state) => state.setCurrentWorkout);
  const addWorkout = useWorkoutStore((state) => state.addWorkout);
  const updateWorkout = useWorkoutStore((state) => state.updateWorkout);
  const loadWorkouts = useWorkoutStore((state) => state.loadWorkouts);

  const workouts = useWorkoutStore((state) => state.workouts);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState<Workout['type']>('custom');
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [cardioEntries, setCardioEntries] = useState<CardioEntry[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const isEditing = currentWorkout?.completed || false;

  useEffect(() => {
    if (!currentWorkout) {
      const newWorkout: Workout = {
        id: `workout-${Date.now()}`,
        name: workoutName || 'New Workout',
        type: workoutType,
        date: workoutDate,
        exercises: [],
        completed: false,
      };
      setCurrentWorkout(newWorkout);
      if (!workoutName) {
        setWorkoutName('New Workout');
      }
    } else {
      const loadedExercises: ExerciseEntry[] = [];
      const loadedCardio: CardioEntry[] = [];
      
      currentWorkout.exercises.forEach((ex) => {
        if (ex.type === 'cardio') {
          ex.sets.forEach((set) => {
            loadedCardio.push({
              id: ex.id,
              cardioType: ex.name,
              distance: set.distance || '',
              time: set.duration || '',
              calories: set.notes ? parseFloat(set.notes) || '' : '',
            });
          });
        } else {
          const sets: ExerciseSet[] = ex.sets
            .filter((s) => s.weight !== undefined && s.reps !== undefined)
            .map((set): ExerciseSet => ({
              id: `set-${Date.now()}-${Math.random()}`,
              weight: (typeof set.weight === 'number' ? set.weight : '') as number | '',
              reps: (typeof set.reps === 'number' ? set.reps : '') as number | '',
            }));
          if (sets.length > 0) {
            loadedExercises.push({
              id: ex.id,
              name: ex.name,
              sets,
              notes: ex.notes,
              usePlates: false,
            });
          }
        }
      });
      
      setExercises(loadedExercises);
      setCardioEntries(loadedCardio);
      setWorkoutName(currentWorkout.name);
      setWorkoutType(currentWorkout.type);
      setWorkoutDate(currentWorkout.date);
      setWorkoutNotes(currentWorkout.notes || '');
    }
  }, [currentWorkout, setCurrentWorkout]);

  // Get previous note for an exercise
  const getPreviousNote = (exerciseName: string): string | undefined => {
    const completedWorkouts = workouts.filter((w) => w.completed);
    for (let i = completedWorkouts.length - 1; i >= 0; i--) {
      const workout = completedWorkouts[i];
      const exercise = workout.exercises.find(
        (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase() && ex.type === 'strength'
      );
      if (exercise?.notes) {
        return exercise.notes;
      }
    }
    return undefined;
  };

  const handleAddExercise = () => {
    const newExercise: ExerciseEntry = {
      id: `ex-${Date.now()}-${exercises.length}`,
      name: '',
      sets: [
        {
          id: `set-${Date.now()}-${Math.random()}`,
          weight: '',
          reps: '',
        },
      ],
      usePlates: false,
    };
    setExercises([...exercises, newExercise]);
  };

  const handleUpdateExerciseNotes = (id: string, notes: string) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, notes } : ex)));
  };

  const handleTogglePlates = (id: string) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, usePlates: !ex.usePlates } : ex)));
  };

  // Parse plate notation (e.g., "2p35" = 2 plates + 35 = 125 lbs)
  const parsePlateNotation = (input: string | number): number => {
    if (typeof input === 'number') return input;
    if (!input || typeof input !== 'string') return 0;
    const match = input.match(/(\d+)p(\d+)/);
    if (match) {
      const plates = parseInt(match[1]);
      const extra = parseInt(match[2]);
      // Each plate = 45 lbs per side, so 2 plates = 90 lbs per side = 180 lbs total
      return plates * 90 + extra;
    }
    return parseFloat(input) || 0;
  };

  // Convert weight to plate notation
  const toPlateNotation = (weight: number): string => {
    if (!weight || weight === 0) return '';
    const plates = Math.floor(weight / 90);
    const extra = weight % 90;
    if (plates > 0 && extra > 0) {
      return `${plates}p${extra}`;
    } else if (plates > 0) {
      return `${plates}p0`;
    }
    return weight.toString();
  };

  const handleUpdateExerciseName = (id: string, name: string) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, name } : ex)));
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: `set-${Date.now()}-${Math.random()}`,
                  weight: '',
                  reps: '',
                },
              ],
            }
          : ex
      )
    );
  };

  const handleUpdateSet = (exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set) => (set.id === setId ? { ...set, ...updates } : set)),
            }
          : ex
      )
    );
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.filter((set) => set.id !== setId),
            }
          : ex
      )
    );
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleAddCardio = () => {
    const newCardio: CardioEntry = {
      id: `cardio-${Date.now()}-${cardioEntries.length}`,
      cardioType: '',
      distance: '',
      time: '',
      calories: '',
    };
    setCardioEntries([...cardioEntries, newCardio]);
  };

  const handleUpdateCardio = (id: string, updates: Partial<CardioEntry>) => {
    setCardioEntries(cardioEntries.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDeleteCardio = (id: string) => {
    setCardioEntries(cardioEntries.filter((c) => c.id !== id));
  };

  const handleSaveWorkout = async () => {
    if (!currentWorkout) return;

    const exerciseList: Exercise[] = [];
    let exerciseIndex = 0;

    // Add strength exercises
    exercises
      .filter((ex) => ex.name.trim() && ex.sets.length > 0)
      .forEach((ex) => {
        const sets = ex.sets
          .filter((set) => {
            const weight = typeof set.weight === 'number' ? set.weight : parseFloat(String(set.weight));
            const reps = typeof set.reps === 'number' ? set.reps : parseFloat(String(set.reps));
            return !isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0;
          })
          .map((set) => ({
            id: set.id,
            weight: typeof set.weight === 'number' ? set.weight : parseFloat(String(set.weight)),
            reps: typeof set.reps === 'number' ? set.reps : parseFloat(String(set.reps)),
            completed: true,
          }));

        if (sets.length > 0) {
          exerciseList.push({
            id: ex.id,
            name: ex.name.trim(),
            type: 'strength' as const,
            muscleGroups: [],
            sets,
            order: exerciseIndex++,
            notes: ex.notes,
          });
        }
      });

    // Add cardio exercises
    cardioEntries
      .filter((c) => c.cardioType.trim())
      .forEach((cardio) => {
        const distance = typeof cardio.distance === 'number' ? cardio.distance : parseFloat(String(cardio.distance)) || 0;
        const time = typeof cardio.time === 'number' ? cardio.time : parseFloat(String(cardio.time)) || 0;
        const calories = typeof cardio.calories === 'number' ? cardio.calories : parseFloat(String(cardio.calories)) || 0;

        exerciseList.push({
          id: cardio.id,
          name: cardio.cardioType.trim(),
          type: 'cardio' as const,
          muscleGroups: [],
          sets: [
            {
              id: `set-${cardio.id}`,
              weight: 0,
              reps: 0,
              completed: true,
              distance,
              duration: time,
              notes: calories > 0 ? calories.toString() : undefined,
            },
          ],
          order: exerciseIndex++,
        });
      });

    const completedWorkout: Workout = {
      ...currentWorkout,
      name: workoutName || currentWorkout.name,
      type: workoutType,
      date: workoutDate,
      exercises: exerciseList,
      completed: true,
      notes: workoutNotes.trim() || undefined,
    };

    if (isEditing) {
      await updateWorkout(currentWorkout.id, completedWorkout);
    } else {
      await addWorkout(completedWorkout);
    }
    
    setCurrentWorkout(null);
    setWorkoutName('');
    setWorkoutType('custom');
    setWorkoutDate(format(new Date(), 'yyyy-MM-dd'));
    setExercises([]);
    setCardioEntries([]);
    await loadWorkouts();
    
    // Navigate back to dashboard after saving
    if (setCurrentView) {
      setCurrentView('dashboard');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);

    try {
      const importedWorkouts = parseWorkoutLog(importText);
      for (const workout of importedWorkouts) {
        await addWorkout(workout);
      }
      await loadWorkouts();
      setImportText('');
      setShowImport(false);
      alert(`Successfully imported ${importedWorkouts.length} workout(s)!`);
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing workouts. Please check the format.');
    } finally {
      setIsImporting(false);
    }
  };

  const hasValidExercises = 
    exercises.some(
      (ex) =>
        ex.name.trim() &&
        ex.sets.some((set) => {
          const weight = typeof set.weight === 'number' ? set.weight : parseFloat(String(set.weight));
          const reps = typeof set.reps === 'number' ? set.reps : parseFloat(String(set.reps));
          return !isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0;
        })
    ) ||
    cardioEntries.some((c) => c.cardioType.trim());

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Workout</h1>
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {showImport ? 'Cancel Import' : 'Import'}
          </button>
        </div>

        {showImport && (
          <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">Import Workouts</h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your workout log here..."
              className="w-full h-32 p-4 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono mb-3 resize-none"
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim() || isImporting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg"
            >
              {isImporting ? 'Importing...' : 'Import Workouts'}
            </button>
          </div>
        )}

        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="Workout Name"
          className="text-3xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white w-full mb-4 focus:ring-0 placeholder-gray-400"
        />
        <textarea
          value={workoutNotes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          placeholder="Workout notes (optional)"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 resize-none"
          rows={2}
        />
        <div className="flex items-center gap-6">
          <select
            value={workoutType}
            onChange={(e) => setWorkoutType(e.target.value as Workout['type'])}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
          >
            <option value="push">Push</option>
            <option value="pull">Pull</option>
            <option value="legs">Legs</option>
            <option value="upper">Upper</option>
            <option value="lower">Lower</option>
            <option value="full">Full Body</option>
            <option value="cardio">Cardio</option>
            <option value="custom">Custom</option>
          </select>
          <input
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
          />
        </div>
      </div>

      {workoutType === 'cardio' ? (
        <div className="space-y-4 mb-8">
          {cardioEntries.map((cardio, index) => (
            <CardioCard
              key={cardio.id}
              cardio={cardio}
              cardioNumber={index + 1}
              onUpdate={(updates) => handleUpdateCardio(cardio.id, updates)}
              onDelete={() => handleDeleteCardio(cardio.id)}
            />
          ))}
          <button
            onClick={handleAddCardio}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Cardio Activity
          </button>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {exercises.map((exercise, exerciseIndex) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseNumber={exerciseIndex + 1}
              onUpdateName={(name) => handleUpdateExerciseName(exercise.id, name)}
              onAddSet={() => handleAddSet(exercise.id)}
            onUpdateSet={(setId, updates) => handleUpdateSet(exercise.id, setId, updates)}
            onDeleteSet={(setId) => handleDeleteSet(exercise.id, setId)}
            onDelete={() => handleDeleteExercise(exercise.id)}
            onUpdateNotes={(notes) => handleUpdateExerciseNotes(exercise.id, notes)}
            onTogglePlates={() => handleTogglePlates(exercise.id)}
            previousNote={getPreviousNote(exercise.name)}
            usePlates={exercise.usePlates || false}
            parsePlateNotation={parsePlateNotation}
            toPlateNotation={toPlateNotation}
            autoFocus={exercises.length > 0 && exerciseIndex === exercises.length - 1}
          />
          ))}
        </div>
      )}

      {workoutType !== 'cardio' && (
        <button
          onClick={handleAddExercise}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Exercise
        </button>
      )}

      {hasValidExercises && (
        <button
          onClick={handleSaveWorkout}
          className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center transition-all z-40"
        >
          <Save className="w-5 h-5 mr-2" />
          {isEditing ? 'Update Workout' : 'Save Workout'}
        </button>
      )}
    </div>
  );
}

function CardioCard({
  cardio,
  cardioNumber,
  onUpdate,
  onDelete,
}: {
  cardio: CardioEntry;
  cardioNumber: number;
  onUpdate: (updates: Partial<CardioEntry>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          value={cardio.cardioType}
          onChange={(e) => onUpdate({ cardioType: e.target.value })}
          placeholder={`Cardio Type ${cardioNumber} (e.g., Running, Cycling, Rowing)`}
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold"
        />
        <button
          onClick={onDelete}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Distance (miles/km)
          </label>
          <input
            type="number"
            step="0.01"
            value={cardio.distance}
            onChange={(e) => {
              const value = e.target.value;
              onUpdate({ distance: value === '' ? '' : parseFloat(value) || '' });
            }}
            placeholder="0.00"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Time (minutes)
          </label>
          <input
            type="number"
            step="0.01"
            value={cardio.time}
            onChange={(e) => {
              const value = e.target.value;
              onUpdate({ time: value === '' ? '' : parseFloat(value) || '' });
            }}
            placeholder="0"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Calories
          </label>
          <input
            type="number"
            step="1"
            value={cardio.calories}
            onChange={(e) => {
              const value = e.target.value;
              onUpdate({ calories: value === '' ? '' : parseFloat(value) || '' });
            }}
            placeholder="0"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  exerciseNumber,
  onUpdateName,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onDelete,
  onUpdateNotes,
  onTogglePlates,
  previousNote,
  usePlates,
  parsePlateNotation,
  toPlateNotation,
  autoFocus = false,
}: {
  exercise: ExerciseEntry;
  exerciseNumber: number;
  onUpdateName: (name: string) => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, updates: Partial<ExerciseSet>) => void;
  onDeleteSet: (setId: string) => void;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
  onTogglePlates: () => void;
  previousNote?: string;
  usePlates: boolean;
  parsePlateNotation: (input: string) => number;
  toPlateNotation: (weight: number) => string;
  autoFocus?: boolean;
}) {
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [autoFocus]);

  const [weightInput, setWeightInput] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    exercise.sets.forEach((set) => {
      if (typeof set.weight === 'number' && set.weight > 0) {
        initial[set.id] = usePlates ? toPlateNotation(set.weight) : set.weight.toString();
      } else {
        initial[set.id] = '';
      }
    });
    setWeightInput(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.sets.length, usePlates]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-4">
        <input
          ref={nameInputRef}
          type="text"
          value={exercise.name}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder={`Exercise ${exerciseNumber}`}
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold"
        />
        <button
          onClick={onTogglePlates}
          className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            usePlates
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          title="Toggle plate notation (e.g., 2p35)"
        >
          Plates
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {previousNote && !exercise.notes && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Previous Note:</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">{previousNote}</p>
        </div>
      )}

      {exercise.notes && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Note:</p>
          <p className="text-sm text-blue-700 dark:text-blue-400">{exercise.notes}</p>
        </div>
      )}

      <div className="mb-4">
        <textarea
          value={exercise.notes || ''}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Add a note for this exercise..."
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
          rows={2}
        />
      </div>

      <div className="space-y-2 mb-4">
        {exercise.sets.map((set, setIndex) => (
          <div
            key={set.id}
            className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-16">
              Set {setIndex + 1}
            </span>
            {usePlates ? (
              <>
                <input
                  type="text"
                  value={weightInput[set.id] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWeightInput({ ...weightInput, [set.id]: value });
                    const parsedWeight = parsePlateNotation(value);
                    onUpdateSet(set.id, {
                      weight: parsedWeight > 0 ? parsedWeight : '',
                    });
                  }}
                  placeholder="2p35"
                  className="w-32 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">plates</span>
              </>
            ) : (
              <>
                <input
                  type="number"
                  step="0.01"
                  value={set.weight}
                  onChange={(e) => {
                    const value = e.target.value;
                    onUpdateSet(set.id, {
                      weight: value === '' ? '' : parseFloat(value) || '',
                    });
                  }}
                  placeholder="Weight"
                  className="w-32 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">lbs</span>
              </>
            )}
            <span className="text-gray-600 dark:text-gray-400">×</span>
            <input
              type="number"
              step="0.25"
              value={set.reps}
              onChange={(e) => {
                const value = e.target.value;
                onUpdateSet(set.id, {
                  reps: value === '' ? '' : parseFloat(value) || '',
                });
              }}
              placeholder="Reps"
              className="w-32 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
            />
            {exercise.sets.length > 1 && (
              <button
                onClick={() => onDeleteSet(set.id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onAddSet}
        className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
      >
        <Plus className="w-4 h-4 mx-auto mb-1" />
        Add Set
      </button>
    </div>
  );
}

