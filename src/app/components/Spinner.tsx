import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'border-blue-600' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-2',
    lg: 'h-16 w-16 border-t-2 border-b-2'
  };

  return (
    <div 
      className={`animate-spin rounded-full ${sizeClasses[size]} ${color}`}
      role="status"
      aria-label="Chargement"
    />
  );
};

export default Spinner;