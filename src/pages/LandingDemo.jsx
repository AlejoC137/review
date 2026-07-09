import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Box, 
  Workflow, 
  ArrowRight, 
  PlayCircle,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingDemo = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      navigate('/roadmap');
    }
  }, [user, navigate]);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    // Attempt to log in with a demo user
    const { error } = await signIn('demo@arca.com', 'demo123');
    
    if (error) {
      console.warn("Usuario demo no encontrado", error);
      alert("El Modo Demo no está disponible en este momento porque el usuario de prueba no ha sido creado en la base de datos por el administrador.");
    } else {
      navigate('/roadmap');
    }
    setIsDemoLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fcf9f4] font-sans overflow-hidden text-[#1c1c19]">
      {/* Navbar Minimalista */}
      <nav className="w-full px-6 py-4 flex justify-between items-center border-b border-[#1c1c19]/10 bg-[#fcf9f4]/80 backdrop-blur-sm fixed top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0f4369] flex items-center justify-center border border-[#1c1c19]">
            <Box className="w-5 h-5 text-white" />
          </div>
          <span className="font-mono font-bold tracking-widest uppercase text-sm">Arca Review</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-mono uppercase font-bold text-[#1c1c19]/70 hover:text-[#1c1c19] transition-colors"
          >
            Acceder
          </button>
          <button 
            onClick={handleDemoLogin}
            disabled={isDemoLoading}
            className="bg-[#1c1c19] text-white px-5 py-2 text-xs font-mono uppercase tracking-widest hover:bg-[#0f4369] transition-colors flex items-center gap-2 border border-transparent disabled:opacity-50"
          >
            {isDemoLoading ? 'Cargando...' : 'Probar Demo'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative">
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#0f4369]/5 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#1c1c19]/5 to-transparent rounded-full blur-3xl -z-10" />

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e5e2dd] border border-[#1c1c19]/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#0f4369] animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1c1c19]/80">
                Plataforma BIM v1.0
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
              Gestión Integral <br/>
              <span className="text-[#0f4369] italic font-serif">Protocolos BIM</span>
            </h1>
            
            <p className="text-lg text-[#1c1c19]/70 max-w-lg leading-relaxed">
              Simplifica la colaboración, estandariza entregables y mantén el control total del ciclo de vida de tus proyectos de construcción con nuestra plataforma especializada.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleDemoLogin}
                disabled={isDemoLoading}
                className="bg-[#0f4369] text-white border-2 border-[#1c1c19] px-8 py-4 text-sm font-mono font-bold uppercase tracking-widest hover:bg-[#1c1c19] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-[4px_4px_0_0_rgba(28,28,25,1)]"
              >
                {isDemoLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Demo Interactiva
                  </>
                )}
              </button>
              <button 
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="bg-[#fcf9f4] text-[#1c1c19] border-2 border-[#1c1c19] px-8 py-4 text-sm font-mono font-bold uppercase tracking-widest hover:bg-[#e5e2dd] hover:-translate-y-1 transition-all flex items-center justify-center shadow-[4px_4px_0_0_rgba(28,28,25,0.2)]"
              >
                Ver Características
              </button>
            </div>
          </div>

          <div className="relative z-10 group perspective">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0f4369]/20 to-transparent transform rotate-3 scale-105 transition-transform group-hover:rotate-6 -z-10 border border-[#1c1c19]/10" />
            
            {/* Mockup de la UI */}
            <div className="bg-white border-2 border-[#1c1c19] shadow-[12px_12px_0_0_rgba(28,28,25,0.1)] overflow-hidden transition-transform duration-500 transform group-hover:-translate-y-2 group-hover:-rotate-1">
              <div className="bg-[#e5e2dd] border-b-2 border-[#1c1c19] px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#1c1c19]/20" />
                  <div className="w-3 h-3 rounded-full bg-[#1c1c19]/20" />
                  <div className="w-3 h-3 rounded-full bg-[#1c1c19]/20" />
                </div>
                <div className="ml-4 bg-white/50 border border-[#1c1c19]/20 px-3 py-0.5 text-[10px] font-mono text-[#1c1c19]/50 flex-1 text-center">
                  arca-review.app/dashboard
                </div>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4 bg-[#fcf9f4]">
                {/* Sidebar mock */}
                <div className="col-span-1 space-y-3">
                  <div className="h-8 bg-[#e5e2dd] border border-[#1c1c19]/10 rounded" />
                  <div className="h-8 bg-[#e5e2dd] border border-[#1c1c19]/10 rounded w-4/5" />
                  <div className="h-8 bg-[#e5e2dd] border border-[#1c1c19]/10 rounded w-full" />
                  <div className="h-32 bg-[#e5e2dd] border border-[#1c1c19]/10 rounded mt-8" />
                </div>
                {/* Main content mock */}
                <div className="col-span-2 space-y-4">
                  <div className="h-12 bg-[#0f4369]/10 border border-[#0f4369]/20 rounded flex items-center px-4">
                    <div className="h-4 w-1/3 bg-[#0f4369]/40 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-white border border-[#1c1c19]/10 shadow-sm p-3 space-y-2">
                       <div className="h-3 w-1/2 bg-[#1c1c19]/20 rounded" />
                       <div className="h-8 w-3/4 bg-[#1c1c19]/10 rounded" />
                    </div>
                    <div className="h-24 bg-white border border-[#1c1c19]/10 shadow-sm p-3 space-y-2">
                       <div className="h-3 w-1/2 bg-[#1c1c19]/20 rounded" />
                       <div className="h-8 w-3/4 bg-[#1c1c19]/10 rounded" />
                    </div>
                  </div>
                  <div className="h-40 bg-white border border-[#1c1c19]/10 shadow-sm mt-4 p-4">
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 w-6 rounded-full bg-[#0f4369]/20" />
                      <div className="h-6 w-full bg-[#1c1c19]/5 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-[#0f4369]/20" />
                      <div className="h-6 w-4/5 bg-[#1c1c19]/5 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-t-2 border-[#1c1c19]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Todo lo que necesitas para BIM</h2>
            <p className="text-[#1c1c19]/60 font-mono max-w-2xl mx-auto">Potencia tu flujo de trabajo, controla tus recursos y estandariza las revisiones con herramientas diseñadas para la construcción.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border-2 border-[#1c1c19] bg-[#fcf9f4] hover:-translate-y-2 transition-transform shadow-[6px_6px_0_0_rgba(28,28,25,1)] group">
              <div className="w-12 h-12 bg-[#0f4369] text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-mono uppercase">Pre-BEP & Roadmap</h3>
              <p className="text-[#1c1c19]/70 leading-relaxed text-sm">
                Define objetivos, requerimientos e hitos del proyecto. Establece un plan de ejecución BIM claro desde el día uno.
              </p>
            </div>

            <div className="p-8 border-2 border-[#1c1c19] bg-[#fcf9f4] hover:-translate-y-2 transition-transform shadow-[6px_6px_0_0_rgba(28,28,25,1)] group">
              <div className="w-12 h-12 bg-[#1c1c19] text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-mono uppercase">Esquemas & Revisiones</h3>
              <p className="text-[#1c1c19]/70 leading-relaxed text-sm">
                Controla la madurez de tu modelo. Revisa esquemas, especialidades y niveles de desarrollo (LOD) con facilidad.
              </p>
            </div>

            <div className="p-8 border-2 border-[#1c1c19] bg-[#fcf9f4] hover:-translate-y-2 transition-transform shadow-[6px_6px_0_0_rgba(28,28,25,1)] group">
              <div className="w-12 h-12 bg-[#0f4369] text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-mono uppercase">Librería de Recursos</h3>
              <p className="text-[#1c1c19]/70 leading-relaxed text-sm">
                Gestiona familias, materiales y componentes. Mantén tu estándar ordenado y accesible para todo el equipo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0f4369] text-white border-t-2 border-[#1c1c19] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">¿Listo para optimizar tus proyectos?</h2>
          <p className="text-white/70 mb-10 text-lg">
            Experimenta el Modo Demo y descubre cómo Arca Review puede transformar tu gestión BIM.
          </p>
          <button 
            onClick={handleDemoLogin}
            disabled={isDemoLoading}
            className="bg-[#fcf9f4] text-[#1c1c19] border-2 border-[#1c1c19] px-10 py-5 text-sm font-mono font-bold uppercase tracking-widest hover:bg-white hover:-translate-y-1 transition-all inline-flex items-center gap-3 shadow-[6px_6px_0_0_rgba(28,28,25,1)] disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isDemoLoading ? 'Accediendo...' : 'Ingresar al Modo Demo'}
            {!isDemoLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="bg-[#1c1c19] text-white/50 py-8 text-center font-mono text-xs border-t-4 border-[#0f4369]">
        <p>© {new Date().getFullYear()} Arca Review. BIM Implementation Protocol.</p>
      </footer>
    </div>
  );
};

export default LandingDemo;
