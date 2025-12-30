import { useEffect, useState } from 'react';
import { useWorkoutStore } from './store/store';
import Dashboard from './components/Dashboard';
import WorkoutRecorder from './components/WorkoutRecorder';
import Progress from './components/Progress';
import Goals from './components/Goals';
import Navigation from './components/Navigation';
import CommandPalette from './components/CommandPalette';
import InstallPrompt from './components/InstallPrompt';
import './App.css';

export type View = 'dashboard' | 'workout' | 'progress' | 'goals';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const loadWorkouts = useWorkoutStore((state) => state.loadWorkouts);
  const loadGoals = useWorkoutStore((state) => state.loadGoals);
  const setCurrentWorkout = useWorkoutStore((state) => state.setCurrentWorkout);

  useEffect(() => {
    loadWorkouts();
    loadGoals();
  }, [loadWorkouts, loadGoals]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette]);

  const handleStartWorkout = () => {
    setCurrentWorkout({
      id: `workout-${Date.now()}`,
      name: 'New Workout',
      type: 'custom',
      date: new Date().toISOString().split('T')[0],
      exercises: [],
      completed: false,
    });
    setCurrentView('workout');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        setCurrentView={setCurrentView}
        onStartWorkout={handleStartWorkout}
      />
      <main className="pb-20">
        {currentView === 'dashboard' && <Dashboard setCurrentView={setCurrentView} />}
        {currentView === 'workout' && <WorkoutRecorder setCurrentView={setCurrentView} />}
        {currentView === 'progress' && <Progress setCurrentView={setCurrentView} />}
        {currentView === 'goals' && <Goals />}
      </main>
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      <InstallPrompt />
    </div>
  );
}

export default App;
