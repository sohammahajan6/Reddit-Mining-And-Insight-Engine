import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, isDark, toggleTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className={`p-3 rounded-xl bg-secondary-100 animate-pulse ${className}`}>
        <div className="w-5 h-5 bg-secondary-300 rounded"></div>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-3 rounded-xl transition-all duration-300 hover:scale-105 focus-ring
        ${isDark
          ? ''
          : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-600'
        }
        ${className}
      `}
      style={isDark ? {
        backgroundColor: '#21262d',
        color: '#8b949e'
      } : {}}
      onMouseEnter={(e) => {
        if (isDark) {
          e.currentTarget.style.backgroundColor = '#262c36';
          e.currentTarget.style.color = '#f0f6fc';
        }
      }}
      onMouseLeave={(e) => {
        if (isDark) {
          e.currentTarget.style.backgroundColor = '#21262d';
          e.currentTarget.style.color = '#8b949e';
        }
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <Sun 
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300 transform
            ${isDark 
              ? 'opacity-0 scale-0 rotate-90' 
              : 'opacity-100 scale-100 rotate-0'
            }
          `}
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300 transform
            ${isDark 
              ? 'opacity-100 scale-100 rotate-0' 
              : 'opacity-0 scale-0 -rotate-90'
            }
          `}
        />
      </div>
      
      {/* Glow effect */}
      <div 
        className={`
          absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none
          ${isDark 
            ? 'bg-blue-400/20 shadow-lg shadow-blue-400/25' 
            : 'bg-yellow-400/20 shadow-lg shadow-yellow-400/25'
          }
          ${isDark || !isDark ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </button>
  );
};

// Advanced theme toggle with dropdown for system preference
export const AdvancedThemeToggle = ({ className = '' }) => {
  const { theme, isDark, toggleTheme, setLightTheme, setDarkTheme, isLoading } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  if (isLoading) {
    return (
      <div className={`p-3 rounded-xl bg-secondary-100 animate-pulse ${className}`}>
        <div className="w-5 h-5 bg-secondary-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-3 rounded-xl transition-all duration-300 hover:scale-105 focus-ring
          ${isDark
            ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300'
            : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-600'
          }
        `}
        title="Theme options"
        aria-label="Theme options"
      >
        <div className="relative w-5 h-5">
          <Sun 
            className={`
              absolute inset-0 w-5 h-5 transition-all duration-300 transform
              ${isDark 
                ? 'opacity-0 scale-0 rotate-90' 
                : 'opacity-100 scale-100 rotate-0'
              }
            `}
          />
          <Moon 
            className={`
              absolute inset-0 w-5 h-5 transition-all duration-300 transform
              ${isDark 
                ? 'opacity-100 scale-100 rotate-0' 
                : 'opacity-0 scale-0 -rotate-90'
              }
            `}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className={`
            absolute right-0 top-full mt-2 z-20 min-w-[140px] rounded-xl shadow-large border
            ${isDark
              ? 'bg-gray-800 border-gray-700/50'
              : 'bg-white border-secondary-200/50'
            }
            backdrop-blur-md animate-fade-in-up
          `}>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (option.value === 'light') setLightTheme();
                    else if (option.value === 'dark') setDarkTheme();
                    else toggleTheme(); // For system, just toggle for now
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium
                    transition-all duration-200 first:rounded-t-xl last:rounded-b-xl
                    ${isActive
                      ? isDark 
                        ? 'bg-primary-900/20 text-primary-300' 
                        : 'bg-primary-50 text-primary-700'
                      : isDark
                        ? 'text-dark-600 hover:bg-dark-200/50 hover:text-dark-700'
                        : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
