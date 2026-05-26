import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminResourceList from '../components/modules/AdminResourceList';



export default function AdminResourceLabPage() {
  return (
    <div className="relative z-10 w-full lg:max-w-7xl mx-auto min-h-full pb-32 pt-8 px-4 md:px-8">
      {/* Annotational marker */}
      <div className="absolute top-0 right-0 text-[10px] font-display text-[#72777f] font-bold tracking-widest uppercase flex flex-col items-end px-4">
        <span>SCALE: 1:1</span>
        <span className="text-[#493f36]">CATALOG</span>
      </div>

      <div className="mt-8">
        <AdminResourceList onlyCategory="Recurso" />
      </div>
    </div>
  );
}
