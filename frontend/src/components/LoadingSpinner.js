import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'medium', text = '', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-10 w-10',
    xlarge: 'h-16 w-16'
  };

  const gradientClasses = {
    small: 'from-primary-500 to-accent-purple',
    medium: 'from-primary-600 to-accent-purple',
    large: 'from-primary-600 via-accent-purple to-primary-700',
    xlarge: 'from-primary-600 via-accent-purple to-primary-700'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${gradientClasses[size]} rounded-full blur opacity-30 animate-pulse`}></div>

        {/* Main spinner */}
        <Loader2 className={`relative animate-spin text-transparent bg-gradient-to-r ${gradientClasses[size]} bg-clip-text ${sizeClasses[size]}`} />

        {/* Alternative spinner with border gradient */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-2 border-transparent bg-gradient-to-r ${gradientClasses[size]} animate-spin`}
             style={{
               mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
               maskComposite: 'xor',
               WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
               WebkitMaskComposite: 'xor'
             }}>
        </div>
      </div>

      {text && (
        <p className="mt-4 text-sm text-secondary-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
