import { useState, useEffect } from 'react';
import { Search, Home, Dumbbell, TrendingUp, Target } from 'lucide-react';
import type { View } from '../App';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentView: (view: View) => void;
  onStartWorkout: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  setCurrentView,
  onStartWorkout,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = [
    {
      id: 'start-workout',
      label: 'Start New Workout',
      icon: Dumbbell,
      action: () => {
        onStartWorkout();
        onClose();
      },
    },
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: Home,
      action: () => {
        setCurrentView('dashboard');
        onClose();
      },
    },
    {
      id: 'workout',
      label: 'Go to Workout',
      icon: Dumbbell,
      action: () => {
        setCurrentView('workout');
        onClose();
      },
    },
    {
      id: 'progress',
      label: 'Go to Progress',
      icon: TrendingUp,
      action: () => {
        setCurrentView('progress');
        onClose();
      },
    },
    {
      id: 'goals',
      label: 'Go to Goals',
      icon: Target,
      action: () => {
        setCurrentView('goals');
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-4 duration-200">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white text-lg outline-none placeholder-gray-400"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
            ESC
          </kbd>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{cmd.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

