import React from 'react';

export default function RoadmapPath({ direction, finished }) {
  const isCompleted = finished === 'completed';
  const isInProgress = finished === 'in_progress';

  const colorClass = isCompleted
    ? 'bg-[#493f36]'
    : isInProgress
      ? 'bg-[#0f4369]'
      : 'bg-[#c2c7cf]';

  const dotClass = `w-2 h-2 rounded-none border-2 border-[#1c1c19] absolute -top-[5px] ${colorClass}`;

  if (direction === 'left') {
    return (
      <div className={`absolute right-4 w-12 md:w-20 h-[2px] z-10 ${finished === 'locked' ? 'bg-[#c2c7cf]' : 'bg-[#1c1c19]'}`}>
        <div className={`${dotClass} left-0`}></div>
      </div>
    );
  }

  return (
    <div className={`absolute left-4 w-12 md:w-20 h-[2px] z-10 ${finished === 'locked' ? 'bg-[#c2c7cf]' : 'bg-[#1c1c19]'}`}>
      <div className={`${dotClass} right-0`}></div>
    </div>
  );
}
