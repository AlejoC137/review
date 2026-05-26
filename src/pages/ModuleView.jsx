import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ModuleDetailCard from '../components/modules/ModuleDetailCard';
import { useRoadmapProgress } from '../hooks/useRoadmapProgress';
import { ArrowLeft } from 'lucide-react';



export default function ModuleView() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { getModuleDetail, loading } = useRoadmapProgress();
  const moduleData = getModuleDetail(moduleId);

  useEffect(() => {
    if (!loading && !moduleData) {
      navigate(-1);
    }
  }, [loading, moduleData, navigate]);

  return (
    <div className="container mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 px-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-xs font-display font-bold tracking-widest uppercase text-[#1c1c19] hover:bg-[#e5e2dd] transition-colors mb-8 group border-2 border-[#1c1c19] px-4 py-3 bg-[#fcf9f4] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] active:translate-y-[2px]"
      >
        <ArrowLeft className="mr-3 group-hover:-translate-x-1 transition-transform" size={16} strokeWidth={2.5} />
        Return_To_Drafting_Board
      </button>

      {moduleData ? (
        <ModuleDetailCard moduleData={moduleData} />
      ) : (
        <div className="font-display font-bold text-[#1c1c19] uppercase tracking-widest text-sm bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] px-6 py-3 inline-block mt-10">
          INITIALIZING_DATA...
        </div>
      )}
    </div>
  );
}
