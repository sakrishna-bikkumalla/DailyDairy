import React from 'react';

const LoadingSpinner = ({ heightClass = 'h-40', spinnerSize = 'w-8 h-8', borderColors = 'border-dairy-green-500 border-t-transparent' }) => {
  return (
    <div className={`flex items-center justify-center ${heightClass}`}>
      <div className={`${spinnerSize} border-2 ${borderColors} rounded-full animate-spin`} />
    </div>
  );
};

export default LoadingSpinner;
