import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ServiceStatus = ({ error, onRetry }) => {
  const { isDark } = useTheme();
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(retryCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  const getStatusInfo = () => {
    if (!error) {
      return {
        status: 'healthy',
        icon: CheckCircle,
        color: '#10b981',
        title: 'AI Service Online',
        message: 'All systems operational'
      };
    }

    if (error.includes('overloaded') || error.includes('503')) {
      return {
        status: 'overloaded',
        icon: Clock,
        color: '#f59e0b',
        title: 'AI Service Busy',
        message: 'High demand detected. Retrying automatically...',
        retryAfter: 60
      };
    }

    if (error.includes('rate limit') || error.includes('429')) {
      return {
        status: 'rate_limited',
        icon: Clock,
        color: '#f59e0b',
        title: 'Rate Limited',
        message: 'Please wait before making another request',
        retryAfter: 30
      };
    }

    if (error.includes('quota')) {
      return {
        status: 'quota_exceeded',
        icon: AlertCircle,
        color: '#ef4444',
        title: 'Daily Limit Reached',
        message: 'AI usage quota exceeded for today'
      };
    }

    return {
      status: 'error',
      icon: AlertCircle,
      color: '#ef4444',
      title: 'Service Error',
      message: error || 'Unknown error occurred'
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  const handleRetry = () => {
    if (statusInfo.retryAfter) {
      setRetryCountdown(statusInfo.retryAfter);
    }
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className="p-4 rounded-lg border" style={{
      backgroundColor: isDark ? '#161b22' : '#ffffff',
      borderColor: isDark ? '#30363d' : '#e5e7eb'
    }}>
      <div className="flex items-start space-x-3">
        <Icon 
          className="h-5 w-5 mt-0.5 flex-shrink-0" 
          style={{ color: statusInfo.color }} 
        />
        
        <div className="flex-1">
          <h4 className="font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            {statusInfo.title}
          </h4>
          <p className="text-sm mt-1" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            {statusInfo.message}
          </p>
          
          {statusInfo.status === 'overloaded' && (
            <div className="mt-3">
              <div className="flex items-center space-x-2 text-xs" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Auto-retry with exponential backoff enabled</span>
              </div>
            </div>
          )}
          
          {(statusInfo.status === 'overloaded' || statusInfo.status === 'rate_limited') && onRetry && (
            <button
              onClick={handleRetry}
              disabled={retryCountdown > 0}
              className="mt-3 px-3 py-1 text-sm rounded border transition-colors"
              style={{
                backgroundColor: retryCountdown > 0 
                  ? (isDark ? '#21262d' : '#f8fafc')
                  : (isDark ? '#1e293b' : '#eff6ff'),
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: retryCountdown > 0 
                  ? (isDark ? '#6b7280' : '#9ca3af')
                  : (isDark ? '#60a5fa' : '#3b82f6')
              }}
            >
              {retryCountdown > 0 ? (
                `Retry in ${retryCountdown}s`
              ) : (
                'Try Again'
              )}
            </button>
          )}
          
          {statusInfo.status === 'quota_exceeded' && (
            <div className="mt-3 p-2 rounded" style={{
              backgroundColor: isDark ? '#2d1b1b' : '#fef2f2'
            }}>
              <p className="text-xs text-red-600">
                💡 Tip: Quota resets at midnight UTC. You can also try:
              </p>
              <ul className="text-xs text-red-600 mt-1 ml-4 list-disc">
                <li>Using shorter solution lengths</li>
                <li>Generating fewer solutions at once</li>
                <li>Coming back tomorrow</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceStatus;
