import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Clock, AlertTriangle, X } from 'lucide-react';
import { formatTime } from '../utils/sessionManager';

const SessionWarning = ({ isVisible, remainingTime, onExtend, onLogout, onDismiss }) => {
  const { isDark } = useTheme();
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  useEffect(() => {
    if (isVisible && remainingTime > 0) {
      setTimeLeft(remainingTime);
      
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            clearInterval(interval);
            onLogout();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, remainingTime, onLogout]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="relative w-full max-w-md rounded-lg shadow-xl border"
        style={{
          backgroundColor: isDark ? '#161b22' : '#ffffff',
          borderColor: isDark ? '#30363d' : '#d1d5db'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{
          borderColor: isDark ? '#30363d' : '#e5e7eb'
        }}>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold" style={{
              color: isDark ? '#f0f6fc' : '#111827'
            }}>
              Session Expiring
            </h3>
          </div>
          
          <button
            onClick={onDismiss}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatTime(timeLeft)}
              </span>
            </div>
            
            <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
              Your session will expire automatically for security reasons.
              Click "Stay Logged In" to continue your session.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onExtend}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Stay Logged In
            </button>
            
            <button
              onClick={onLogout}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Logout Now
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.max(0, (timeLeft / (5 * 60 * 1000)) * 100)}%` 
              }}
            />
          </div>
          <p className="text-xs text-center mt-2" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Session will expire automatically when timer reaches zero
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;
