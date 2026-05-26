import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import RoadmapLayout from '../components/layout/RoadmapLayout';
import { useRoadmapProgress } from '../hooks/useRoadmapProgress';
import { useTranslation } from 'react-i18next';


export default function Dashboard() {
  const { roadmapData, loading, fetchProgress } = useRoadmapProgress();
  const { t } = useTranslation();

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {loading ? (
        <div className="h-full flex flex-col justify-center items-center">
          <div className="w-16 h-16 border-4 border-[#1c1c19] border-t-[#0f4369] animate-spin mb-4" />
          <div className="font-display font-bold text-[#1c1c19] uppercase tracking-widest text-sm bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] px-6 py-3">
            {t('dashboard.loading')}
          </div>
        </div>
      ) : (
        <div id="roadmap-container" className="relative z-10 w-full lg:max-w-7xl mx-auto min-h-full pb-32 pt-8 px-4 md:px-8">
          {/* Annotational marker in dashboard */}
          <div className="absolute top-0 right-0 text-[10px] font-display text-[#72777f] font-bold tracking-widest uppercase flex flex-col items-end px-4">
            <span>{t('dashboard.scale')}</span>
            <span className="text-[#493f36]">{t('dashboard.rev')}</span>
          </div>
          <RoadmapLayout roadmapData={roadmapData} />
        </div>
      )}
    </>
  );
}
