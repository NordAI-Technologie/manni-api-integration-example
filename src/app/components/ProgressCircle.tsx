import React from 'react';

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  textClassName?: string;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  textClassName = "text-xl font-semibold"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className={`relative h-${size / 4} w-${size / 4}`}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-600"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={textClassName}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default ProgressCircle;