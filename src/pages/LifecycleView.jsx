import React, { useState } from 'react';
import ProjectLifecycleChart from '../components/lifecycle/ProjectLifecycleChart';



function LifecycleView() {
  return (
    <div className="flex-1 flex flex-col h-full relative overflow-auto p-8">
      <ProjectLifecycleChart />

      <footer className="text-[10px] text-slate-700 font-mono text-center p-4 bg-white border-t-2 border-[#1c1c19] mt-8">
        BIM INFRASTRUCTURE BLUEPRINT v3.0 • INTERACTIVE MODE ENABLED
      </footer>
    </div>
  );
}

export default LifecycleView;
