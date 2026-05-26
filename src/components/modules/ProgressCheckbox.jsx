import React, { useState } from 'react';
import { useRoadmapProgress } from '../../hooks/useRoadmapProgress';
import { Power, Loader2, Play, Lock } from 'lucide-react';

export default function ProgressCheckbox({ moduleId, currentStatus }) {
  const { updateNodeStatus } = useRoadmapProgress();
  const [loading, setLoading] = useState(false);

  const isCompleted = currentStatus === 'completed';
  const isLocked = currentStatus === 'locked';

  const handleToggle = async () => {
    if (isLocked) return;
    setLoading(true);
    try {
      const newStatus = isCompleted ? 'in_progress' : 'completed';
      await updateNodeStatus(moduleId, newStatus);
    } finally {
      setLoading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="text-[10px] font-display font-bold tracking-widest text-[#72777f] border-2 border-[#c2c7cf] bg-[#fcf9f4] px-6 py-3 cursor-not-allowed uppercase flex items-center">
        <Lock size={12} className="mr-2" strokeWidth={2.5} /> MODULE_LOCKED
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || isLocked}
      className={`relative flex items-center justify-between px-4 py-2 border-2 border-[#1c1c19] font-display font-bold text-[10px] sm:text-xs tracking-widest uppercase overflow-hidden group w-full shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] active:translate-y-[2px] active:shadow-none transition-all
        ${isCompleted 
          ? 'bg-[#f6f3ee] text-[#1c1c19]' 
          : 'bg-[#0f4369] text-white'
        }
      `}
    >
      <div className="flex items-center space-x-2 z-10">
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isCompleted ? (
        <Power size={14} strokeWidth={2.5} className="text-[#493f36]" />
      ) : (
        <Play size={14} strokeWidth={2.5} className="fill-current" />
      )}

      <span>
        {loading ? 'PROCESSING...' 
          : isCompleted 
            ? 'VERIFIED_OK' 
            : 'EXEC_COMPLETION'}
      </span>
      </div>

      <div className={`w-6 h-6 border-2 border-[#1c1c19] transition-all duration-300 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] ${isCompleted ? 'bg-[#493f36] translate-x-0' : 'bg-[#fcf9f4] -translate-x-1'} `}></div>
    </button>
  );
}
