import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Calendar, ChevronRight, User } from 'lucide-react';
import { lifecycleService } from '../services/lifecycleService';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';



function LifecycleDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await lifecycleService.getProjects();
        setProjects(data);
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    const name = window.prompt(t('project.prompts.new_project_name'));
    if (!name) return;

    try {
      const lifecycles = await lifecycleService.getLifecycles();
      if (lifecycles.length === 0) {
        alert(t('project.prompts.no_templates'));
        return;
      }

      const newProject = await lifecycleService.createProject({
        name,
        lifecycle_id: lifecycles[0].id,
        finished: 'active',
        responsible_party: 'BIM Team - Unassigned'
      });
      setProjects([...projects, { ...newProject, lifecycles: lifecycles[0] }]);
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  return (
    <>
      {/* Fondo de rejilla de puntos nativo */}
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(28, 28, 25, 0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <div className="p-8 md:p-12 relative h-full overflow-auto">
        {loading ? (
          <div className="h-full flex flex-col justify-center items-center">
            <div className="font-mono text-[#1c1c19] animate-pulse uppercase tracking-widest text-sm bg-[#f6f3ee] border-2 border-[#1c1c19] px-6 py-3">
              {t('project.loading_projects')}
            </div>
          </div>
        ) : (
          <>
            <header id="lifecycle-header" className="relative mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 bg-[#0f4369] text-white px-3 py-1 text-[10px] font-black tracking-[4px] w-fit mb-2">
                  {t('project.control_label')}
                </div>
                <h1
                  className="text-5xl font-black italic tracking-tighter text-[#1c1c19] uppercase leading-none"
                  dangerouslySetInnerHTML={{ __html: t('project.main_title') }}
                />
              </div>

              <button
                id="new-project-btn"
                onClick={handleCreateProject}
                className="flex items-center gap-2 bg-[#fcf9f4] text-[#1c1c19] border-2 border-[#1c1c19] px-8 py-4 font-black transition-all hover:bg-[#1c1c19] hover:text-white shadow-[4px_4px_0_0_rgba(28,28,25,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Plus size={20} strokeWidth={3} />
                {t('project.new_project_btn')}
              </button>
            </header>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
              {projects.map((project, idx) => (
                <div
                  key={project.id}
                  id={idx === 0 ? 'project-card-sample' : undefined}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group relative bg-white border-2 border-[#1c1c19] p-8 cursor-pointer transition-all hover:-translate-y-1 hover:-translate-x-1 shadow-[8px_8px_0_0_rgba(28,28,25,0.1)] hover:shadow-[12px_12px_0_0_rgba(28,28,25,0.2)]"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-[#f6f3ee] border-2 border-[#1c1c19] p-3 text-[#0f4369]">
                      <Briefcase size={28} strokeWidth={2.5} />
                    </div>
                    <span className="font-mono text-[10px] font-black bg-[#1c1c19] text-white px-2 py-1 leading-none uppercase">
                      {project.id.split('-')[0]}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black mb-4 group-hover:text-[#0f4369] transition-colors uppercase leading-none tracking-tight">
                    {project.name}
                  </h3>

                  <div className="space-y-2 mb-8 text-[#72777f]">
                    <div className="flex items-center gap-3 text-[11px] font-bold font-mono uppercase">
                      <User size={14} className="text-[#0f4369]" />
                      <span className="truncate">{project.responsible_party || 'EQUIPO_GENERAL'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold font-mono uppercase">
                      <Calendar size={14} className="text-[#0f4369]" />
                      <span>{t('project.template_label', { name: project.lifecycles?.name || 'GENÉRICA' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t-2 border-[#f6f3ee]">
                    <div className="flex items-center gap-1 font-black text-xs text-[#0f4369] uppercase tracking-wider group-hover:gap-2 transition-all">
                      {t('project.open_lifecycle')} <ChevronRight size={16} strokeWidth={3} />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1 h-1 bg-[#1c1c19]/30" />
                      <div className="w-1 h-1 bg-[#1c1c19]/30" />
                      <div className="w-1 h-1 bg-[#1c1c19]/30" />
                    </div>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="col-span-full py-24 text-center border-4 border-dashed border-[#e5e2dd] bg-white/50">
                  <p className="font-mono font-black text-[#72777f] uppercase tracking-widest text-lg opacity-40">{t('project.system_empty')}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default LifecycleDashboard;
