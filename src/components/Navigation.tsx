import { Home, Dumbbell, TrendingUp, Target } from 'lucide-react';
import type { View } from '../App';

interface NavigationProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

export default function Navigation({ currentView, setCurrentView }: NavigationProps) {
  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: Home },
    { id: 'workout' as View, label: 'Workout', icon: Dumbbell },
    { id: 'progress' as View, label: 'Progress', icon: TrendingUp },
    { id: 'goals' as View, label: 'Goals', icon: Target },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-800/50 z-50">
      <div className="flex justify-around items-center h-16 px-2 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 scale-110'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-label={item.label}
            >
              <Icon size={22} className={isActive ? 'drop-shadow-sm' : ''} />
              <span className={`text-xs mt-0.5 font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

