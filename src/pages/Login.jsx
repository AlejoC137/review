import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';

const CarouselContent = ({ slide }) => {
  const slides = [
    {
      title: "Bienvenido a Arca Review",
      content: (
        <div className="text-[#1c1c19]/80 font-sans mb-8 leading-relaxed space-y-3 text-sm min-h-[140px]">
          <p>
            <strong>Arca Review</strong> es la herramienta definitiva para la gestión e implementación de protocolos BIM (Building Information Modeling).
          </p>
          <p>
            Nuestra plataforma está diseñada para acompañarte en todo el ciclo de vida de tus proyectos: desde la planificación y diseño (Pre-BEP), hasta la gestión de recursos, seguimiento de entregables y revisión esquemática.
          </p>
        </div>
      )
    },
    {
      title: "Colaboración Eficiente",
      content: (
        <div className="text-[#1c1c19]/80 font-sans mb-8 leading-relaxed space-y-3 text-sm min-h-[140px]">
          <div className="bg-[#e5e2dd] w-full h-24 mb-4 border-2 border-[#1c1c19] flex items-center justify-center overflow-hidden relative group">
            <span className="text-[#1c1c19]/50 font-mono text-xs uppercase tracking-widest">[Placeholder Imagen]</span>
            <div className="absolute inset-0 bg-[#0f4369]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <p>
            Conecta a tu equipo, centraliza la documentación y estandariza los flujos de trabajo de manera ágil y visual. 
          </p>
        </div>
      )
    },
    {
      title: "Control Total",
      content: (
        <div className="text-[#1c1c19]/80 font-sans mb-8 leading-relaxed space-y-3 text-sm min-h-[140px]">
          <div className="bg-[#e5e2dd] w-full h-24 mb-4 border-2 border-[#1c1c19] flex items-center justify-center overflow-hidden relative group">
            <span className="text-[#1c1c19]/50 font-mono text-xs uppercase tracking-widest">[Placeholder Imagen]</span>
            <div className="absolute inset-0 bg-[#0f4369]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <p>
            Mantén el control total sobre los cambios de esquemas, los módulos de desarrollo y las métricas clave del proyecto BIM en tiempo real.
          </p>
        </div>
      )
    }
  ];

  const current = slides[slide] || slides[0];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl md:text-2xl font-bold text-[#1c1c19] uppercase mb-4 font-mono tracking-wider">{current.title}</h2>
      {current.content}
    </div>
  );
};

export default function Login() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans" style={{ backgroundColor: '#fcf9f4' }}>
      <div className="absolute top-8 left-8 bottom-8 right-8 border-2 border-[#c2c7cf]/30 pointer-events-none md:block hidden">
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#72777f]" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#72777f]" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#72777f]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#72777f]" />
      </div>

      <div className="relative z-10 w-full px-4 flex justify-center">
        {showWelcome ? (
          <div className="w-full max-w-md bg-[#fcf9f4] border-2 border-[#1c1c19] relative shadow-[8px_8px_0_0_rgba(28,28,25,0.2)] p-8">
             <div className="absolute -top-3 -left-3 w-12 h-6 bg-[#0f4369] border border-[#1c1c19] -rotate-12 z-20 flex items-center justify-center">
               <span className="text-[8px] text-white font-bold tracking-widest font-mono">NEW</span>
             </div>
             
             <CarouselContent slide={currentSlide} />

             {/* Carousel Dots */}
             <div className="flex justify-center gap-2 mb-6">
               {[0, 1, 2].map((idx) => (
                 <button
                   key={idx}
                   onClick={() => setCurrentSlide(idx)}
                   className={`w-2 h-2 rounded-none border border-[#1c1c19] transition-all ${currentSlide === idx ? 'bg-[#0f4369] scale-125' : 'bg-[#c2c7cf] hover:bg-[#72777f]'}`}
                   aria-label={`Ir a diapositiva ${idx + 1}`}
                 />
               ))}
             </div>

             <div className="flex flex-col gap-3">
               <div className="flex gap-3">
                 <button 
                   onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                   disabled={currentSlide === 0}
                   className="flex-1 bg-[#fcf9f4] text-[#1c1c19] border-2 border-[#1c1c19] hover:bg-[#e5e2dd] p-2 text-xs font-bold uppercase tracking-widest transition-all active:translate-y-[2px] font-mono disabled:opacity-30 disabled:hover:bg-[#fcf9f4] disabled:active:translate-y-0"
                 >
                   &lt; Ant
                 </button>
                 <button 
                   onClick={() => setCurrentSlide(prev => Math.min(2, prev + 1))}
                   disabled={currentSlide === 2}
                   className="flex-1 bg-[#fcf9f4] text-[#1c1c19] border-2 border-[#1c1c19] hover:bg-[#e5e2dd] p-2 text-xs font-bold uppercase tracking-widest transition-all active:translate-y-[2px] font-mono disabled:opacity-30 disabled:hover:bg-[#fcf9f4] disabled:active:translate-y-0"
                 >
                   Sig &gt;
                 </button>
               </div>
               
               <button 
                 onClick={() => navigate('/admin/user-create')}
                 className="w-full bg-[#e5e2dd] text-[#1c1c19] border-2 border-[#1c1c19] hover:bg-[#d5d2cd] p-3 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center active:translate-y-[2px] font-mono mt-2"
               >
                 Nuevo Usuario
               </button>
               <button 
                 onClick={() => setShowWelcome(false)}
                 className="w-full bg-[#0f4369] text-white border-2 border-transparent hover:border-[#1c1c19] p-3 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center active:translate-y-[2px] font-mono"
               >
                 Acceder
               </button>
             </div>
          </div>
        ) : (
          <LoginForm />
        )}
      </div>

      <div className="absolute bottom-12 right-12 text-[10px] text-[#72777f] hidden md:block uppercase tracking-widest text-right font-mono">
        <span className="block mb-1 text-[#493f36] font-bold">Draft No. 1.0</span>
        BIM Implementation Protocol
      </div>
    </div>
  );
}
