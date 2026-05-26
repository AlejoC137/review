import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Lock, Play, ArrowRight } from 'lucide-react';

export default function RoadmapNode({ node, showStar }) {
  const navigate = useNavigate();

  const isCompleted = node.finished === 'completed';
  const isInProgress = node.finished === 'in_progress';
  const isLocked = node.finished === 'locked';

  let borderClass = isLocked ? "border-[#c2c7cf]" : "border-[#1c1c19]";
  let shadowClass = isLocked ? "shadow-none" : "shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] hover:shadow-[6px_6px_0_0_rgba(28,28,25,0.15)] hover:-translate-y-[1px]";
  let bgClass = "bg-[#fcf9f4]";

  let Icon = Lock;
  let statusText = "RESTRICTED";
  let accentColor = "bg-[#e5e2dd]";

  if (isCompleted) {
    Icon = Check;
    statusText = "VERIFIED";
    accentColor = "bg-[#493f36]";
    bgClass = "bg-[#f6f3ee]";
  } else if (isInProgress) {
    Icon = Play;
    statusText = "IN_PROGRESS";
    accentColor = "bg-[#0f4369]";
    bgClass = "bg-white";
  }

  const handleClick = () => {
    if (!isLocked) {
      navigate(`/module/${node.id}`);
    }
  };

  return (
    <div className="relative w-full group">
      {showStar && !isLocked && (
        <div className="absolute -top-3 -right-3 text-[#493f36] font-display text-2xl rotate-12 z-0 pointer-events-none opacity-90 drop-shadow-md hidden md:block">
          ★
        </div>
      )}

      <button
        className={`w-full flex flex-col md:flex-row items-stretch rounded-none border-2 transition-all duration-200 text-left overflow-hidden focus:outline-none relative z-10 ${borderClass} ${shadowClass} ${bgClass}`}
        onClick={handleClick}
        disabled={isLocked}
      >
        {/* 1. Name and Status */}
        <div className={`flex flex-col flex-1 min-w-[150px] p-3 md:p-5 border-b-2 md:border-b-0 md:border-r-2 ${isLocked ? 'border-[#c2c7cf]' : 'border-[#1c1c19]/20'}`}>
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className={`p-1 border-2 ${isLocked ? 'border-[#c2c7cf]' : 'border-[#1c1c19]'} ${accentColor}`}>
              <Icon size={10} strokeWidth={3} className={isLocked ? 'text-[#fcf9f4]' : 'text-white'} />
            </div>
            <span className={`text-[8px] md:text-[9px] font-display font-bold tracking-[0.2em] uppercase ${isLocked ? 'text-[#72777f]' : 'text-[#1c1c19]'}`}>
              ID_{node.id} // {statusText}
            </span>
          </div>
          <h3 className={`font-sans text-xs md:text-base font-semibold leading-tight ${isLocked ? 'text-[#72777f]' : 'text-[#1c1c19]'}`}>
            {node.title}
          </h3>

          {/* Progress bar to tie it to the aesthetic */}
          <div className="mt-auto pt-4 hidden md:block">
            <div className={`h-[4px] w-full max-w-[120px] overflow-hidden border-2 bg-[#e5e2dd] ${isLocked ? 'border-[#c2c7cf]/50' : 'border-[#1c1c19]'}`}>
              <div className={`h-full transition-all duration-700 ${isCompleted ? 'w-full bg-[#493f36]' : isInProgress ? 'w-1/3 bg-[#0f4369]' : 'w-0'}`}></div>
            </div>
          </div>
        </div>

        {/* 2. Image / Video Preview */}
        <div className={`w-full md:w-[150px] lg:w-[180px] shrink-0 min-h-[100px] md:min-h-[120px] border-b-2 md:border-b-0 md:border-r-2 ${isLocked ? 'border-[#c2c7cf]' : 'border-[#1c1c19]/20'} bg-[#e5e2dd] relative flex items-center justify-center overflow-hidden`}>
          {node.image_url ? (
            <img
              src={node.image_url}
              alt={node.title}
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80"
            />
          ) : (
            <div className={`absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#1c1c19_2px,#1c1c19_4px)] ${isLocked ? 'opacity-5' : ''}`}></div>
          )}

          {/* Overlay pattern for consistent technical aesthetic */}
          <div className={`absolute inset-0 opacity-5 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#1c1c19_2px,#1c1c19_4px)]`}></div>

          {!isLocked && <Play size={20} className="text-[#1c1c19]/50 relative z-10 group-hover:scale-110 group-hover:text-[#0f4369] transition-transform" />}
          {isLocked && <Lock size={20} className="text-[#72777f]/50 relative z-10" />}
        </div>

        {/* 3. Explanation */}
        <div className={`flex flex-col justify-center flex-[1.5] p-3 md:p-5 border-b-2 md:border-b-0 md:border-r-2 ${isLocked ? 'border-[#c2c7cf]' : 'border-[#1c1c19]/20'}`}>
          <p className={`text-[10px] md:text-xs leading-relaxed font-sans ${isLocked ? 'text-[#72777f]' : 'text-[#1c1c19]/80'} line-clamp-2 md:line-clamp-none`}>
            {node.description || "Este módulo incluye diagramas arquitectónicos y explicaciones fundamentales para construir componentes estructurales sólidos según nuestros planos del sistema."}
          </p>
        </div>

        {/* 4. Click to open */}
        <div className={`w-full md:w-[100px] lg:w-[120px] shrink-0 flex items-center justify-center p-3 md:p-4 bg-[#f6f3ee] transition-colors ${!isLocked && 'group-hover:bg-[#1c1c19]'}`}>
          <div className={`flex items-center md:flex-col gap-2 ${isLocked ? 'text-[#c2c7cf]' : 'text-[#1c1c19] group-hover:text-white transition-colors'}`}>
            <span className="text-[9px] md:text-[10px] font-display font-bold tracking-widest uppercase text-center block leading-tight">
              {isLocked ? 'BLOQUEADO' : 'ABRIR'}
            </span>
            {!isLocked && <ArrowRight size={14} md:size={16} strokeWidth={2} />}
          </div>
        </div>

      </button>
    </div>
  );
}
