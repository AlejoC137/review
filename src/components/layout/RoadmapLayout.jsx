import React from 'react';
import PhaseContainer from '../roadmap/PhaseContainer';

export default function RoadmapLayout({ roadmapData }) {
  if (!roadmapData || roadmapData.length === 0) return null;

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-24 relative mt-16 px-0 md:px-8">
      {/* Left drafting line connecting all phases - thin, hard line */}
      <div className="absolute left-[40px] top-0 bottom-0 w-[2px] bg-[#1c1c19] z-0"></div>

      {roadmapData.map((phase, index) => (
        <PhaseContainer 
          key={phase.id} 
          phase={phase} 
          index={index} 
          isLast={index === roadmapData.length - 1} 
        />
      ))}
    </div>
  );
}
