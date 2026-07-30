import React, { useEffect, useState, createContext, useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Settings, Hexagon,
  Layers, Info, X, FileText, Activity,
  HelpCircle, Book, ChevronLeft, ChevronRight, ChevronDown, Lock as LockIcon,
  User, LogOut, ClipboardList, Folder, Calendar, Users, Target, Package, Database, Plus, Trash2, Download
} from 'lucide-react';
import { projectExporterService } from '../../services/projectExporterService';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import SiteLogo from '../ui/SiteLogo';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import AdminModal from '../admin/AdminModal';
import CreateProjectModal from '../project/CreateProjectModal';
import DeleteProjectModal from '../project/DeleteProjectModal';
import { useAuth } from '../../context/AuthContext';
import { useRoadmap } from '../../context/RoadmapContext';
import { startTutorial } from '../../config/tutorialConfig';

const SidebarContext = createContext({});

const NavItem = ({ item, depth = 0 }) => {
  const { location, isBimManager, isCollapsed, handleNavClick } = useContext(SidebarContext);
  let isActive = false;
  if (item.path === '/resources') isActive = location.pathname === '/resources';
  else if (item.path === '/materials') isActive = location.pathname === '/materials';
  else if (item.path === '/dictionary') isActive = location.pathname === '/dictionary';
  else if (item.path === '/') isActive = location.pathname === '/';
  else if (item.path === '/roadmap') isActive = location.pathname === '/roadmap' && (location.hash === item.hash || (item.hash === '#phase-1' && location.hash === ''));
  else if (item.path && (item.path.startsWith('/esquemas') || item.path.startsWith('/planner') || item.path.startsWith('/esquemaAdmin') || item.path.startsWith('/pre-bep'))) {
    const [base, query] = item.path.split('?');
    if (query) {
      isActive = location.pathname.startsWith(base) && location.search.includes(query);
    } else {
      isActive = location.pathname.startsWith(base);
    }
  }
  else if (item.path && item.path.includes('?tab=')) {
    const [base, query] = item.path.split('?');
    isActive = location.pathname === base && location.search.includes(query);
  }

  const isDisabled = item.requiresBimManager && !isBimManager;

  return (
    <NavLink
      id={item.id}
      to={isDisabled ? '#' : (item.hash ? { pathname: item.path, hash: item.hash } : (item.path || '#'))}
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault();
          return;
        }
        handleNavClick(e, item);
      }}
      style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
      className={`
        flex items-center w-full p-2 group/item relative overflow-hidden transition-all duration-200 border-2 font-mono
        ${isCollapsed ? 'justify-center h-10 px-0' : 'justify-start h-9'}
        ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : (isActive ? 'bg-[#0f4369] text-white border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,0.15)]' : 'text-[#72777f] hover:text-[#1c1c19] hover:bg-[#e5e2dd] border-transparent hover:border-[#1c1c19]')}
      `}
      title={isCollapsed ? item.label : (isDisabled ? 'REQUIERE_BIM_MANAGER_KEY' : '')}
    >
      <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover/item:scale-105'}`}>
        {isDisabled ? <LockIcon size={14} className="shrink-0" /> : (item.icon && <item.icon size={16} className="shrink-0" />)}
      </div>
      {!isCollapsed && (
        <span className="ml-3 text-[10px] font-bold tracking-wider whitespace-nowrap opacity-100 uppercase flex-1 truncate">
          {item.label}
        </span>
      )}
    </NavLink>
  );
};

const NavGroup = ({ id, label, icon: Icon, children, depth = 0, path, hash, actionButton }) => {
  const { expandedSections, toggleSection, isCollapsed, handleNavClick } = useContext(SidebarContext);
  const isExpanded = expandedSections[id];
  return (
    <div className="flex flex-col w-full">
      <div
        style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
        className={`
          flex items-center w-full p-2 group/item relative transition-all duration-200 font-mono text-[#1c1c19] hover:bg-[#e5e2dd]
          ${isCollapsed ? 'justify-center h-10 px-0' : 'justify-between h-9'}
        `}
      >
        <button
          onClick={(e) => {
            toggleSection(id);
            if (path || hash) {
              handleNavClick(e, { path, hash });
            }
          }}
          className="flex items-center gap-3 overflow-hidden flex-1 text-left"
          title={isCollapsed ? label : ''}
        >
          <Icon size={16} className="shrink-0 text-[#0f4369]" />
          {!isCollapsed && (
            <span className="text-[10px] font-bold tracking-wider whitespace-nowrap uppercase truncate">
              {label}
            </span>
          )}
        </button>
        {!isCollapsed && (
          <div className="flex items-center gap-1 shrink-0">
            {actionButton}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(id);
              }}
              className="p-0.5 hover:bg-[#1c1c19]/10 rounded"
            >
              <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
      {(!isCollapsed && isExpanded) && (
        <div className="flex flex-col w-full">
          {children}
        </div>
      )}
    </div>
  );
};

export default function Sidebar({ isOpen, onClose, className = "" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, user, signOut, isBimManager, setBimManager } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectToDelete, setSelectedProjectToDelete] = useState(null);
  const currentPlan = useSelector(state => state.bim.currentPlan);
  const { roadmapData } = useRoadmap();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // Accordion state
  const [expandedSections, setExpandedSections] = useState({
    proyectos: true,
    proyecto1: true,
    bep: true,
    cursos: true,
    recursos: true,
    admin: false
  });

  const [projectsList, setProjectsList] = useState([]);

  useEffect(() => {
    const fetchSidebarProjects = async () => {
      try {
        // We do a dynamic import here to avoid circular dependency issues if any
        const { lifecycleService } = await import('../../services/lifecycleService');
        const data = await lifecycleService.getProjects(user, isAdmin);
        if (data && data.length > 0) {
          setProjectsList(data);
          // Removed default expansion as requested by user to keep project tabs collapsed by default
        } else {
          setProjectsList([]);
        }
      } catch (err) {
        console.error("Failed to fetch sidebar projects", err);
      }
    };
    fetchSidebarProjects();
  }, [user, isAdmin]);

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = async (newProject) => {
    try {
      const { lifecycleService } = await import('../../services/lifecycleService');
      const updated = await lifecycleService.getProjects(user, isAdmin);
      setProjectsList(updated);
      if (newProject?.id) {
        navigate(`/project/${newProject.id}?tab=datos`);
      }
    } catch (err) {
      console.error("Error refreshing sidebar projects:", err);
    }
  };

  const { t } = useTranslation();

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location.hash, location.pathname]);

  const handleNavClick = (e, item) => {
    if (onClose) onClose(); // Close sidebar on mobile after clicking a link
    if (item.hash) {
      e.preventDefault();
      const targetPath = item.path || '/';
      if (location.pathname !== targetPath) {
        navigate(`${targetPath}${item.hash}`);
      } else {
        navigate(item.hash, { replace: true });
        setTimeout(() => {
          const element = document.getElementById(item.hash.substring(1));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  };

  const contextValue = {
    location,
    isBimManager,
    isCollapsed,
    handleNavClick,
    expandedSections,
    toggleSection
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#1c1c19]/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 transition-all duration-300 ease-in-out border-r-2 border-[#1c1c19] bg-[#fcf9f4] flex flex-col items-center py-6 shrink-0 z-50 shadow-[8px_8px_0_0_rgba(28,28,25,0.2)] print:hidden
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${className}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#1c1c19] md:hidden hover:bg-[#e5e2dd] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Collapse Toggle Button (Desktop) - Non-intrusive handle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-[12px] bottom-40 bg-[#1c1c19] text-white p-1 z-[100] hover:bg-[#0f4369] opacity-40 hover:opacity-100 transition-all flex-col items-center justify-center border border-white/20 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
        </button>

        {/* Top Section: Logo & User Controls */}
        <div className={`w-full px-2 mb-2 flex flex-col gap-1 transition-all duration-300 ${isCollapsed ? 'items-center' : ''}`}>
          {/* Logo */}
          <div id="sidebar-logo" className={`transition-all duration-300 bg-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)] flex flex-col items-center p-1 overflow-hidden ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full'}`}>
            <SiteLogo className={`${isCollapsed ? 'w-5 h-5' : 'w-8 h-8'} transition-all duration-300`} color="#0f4369" />
            {!isCollapsed && <span className="text-[9px] font-black tracking-[0.2em] text-[#1c1c19] uppercase font-mono mt-0.5 border-t border-[#1c1c19]/10 w-full text-center pt-0.5">REVIEW</span>}
          </div>

        </div>

        {/* Scrollable Navigation Section */}
        <nav className="flex-1 w-full flex flex-col px-2 gap-1 mt-1 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-[#0f4369] scrollbar-track-transparent">

          <NavGroup id="proyectos" label="Proyectos" icon={Folder} depth={0}>
            {projectsList.length > 0 ? (
              <>
                {projectsList.map(proj => (
                  <NavGroup 
                    key={proj.id} 
                    id={`proj-${proj.id}`} 
                    label={proj.name} 
                    icon={Activity} 
                    depth={1}
                    actionButton={
                      isAdmin ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await projectExporterService.exportProjectToJson(proj.id, proj.name);
                              } catch (err) {
                                alert("Error al descargar plantilla: " + err.message);
                              }
                            }}
                            className="p-1 text-[#0f4369] hover:text-white hover:bg-[#0f4369] transition-all rounded"
                            title="Descargar Plantilla JSON (Solo Admin)"
                          >
                            <Download size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectToDelete(proj);
                            }}
                            className="p-1 text-red-600 hover:text-white hover:bg-red-600 transition-all rounded"
                            title="Eliminar Proyecto (Solo Admin)"
                          >
                            <Trash2 size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : null
                    }
                  >
                    <NavGroup id={`datos-${proj.id}`} label="Datos del Proyecto" icon={Info} depth={2}>
                      <NavItem item={{ id: `nav-datos-resumen-${proj.id}`, label: 'Resumen Operativo', path: `/project/${proj.id}?tab=datos&subtab=resumen` }} depth={3} />
                      <NavItem item={{ id: `nav-datos-peb-${proj.id}`, label: 'Información General', path: `/project/${proj.id}?tab=datos&subtab=peb_info` }} depth={3} />
                      <NavItem item={{ id: `nav-datos-software-${proj.id}`, label: 'Software y Plataformas', path: `/project/${proj.id}?tab=datos&subtab=software` }} depth={3} />
                      <NavItem item={{ id: `nav-datos-lod-${proj.id}`, label: 'Matriz LOD y TDI', path: `/project/${proj.id}?tab=datos&subtab=lod_tdi` }} depth={3} />
                      <NavItem item={{ id: `nav-datos-objetivos-${proj.id}`, label: 'Objetivos del Proyecto', path: `/project/${proj.id}?tab=datos&subtab=objetivos` }} depth={3} />
                      <NavItem item={{ id: `nav-datos-unidades-${proj.id}`, label: 'Unidades y Formatos', path: `/project/${proj.id}?tab=datos&subtab=unidades` }} depth={3} />
                      <NavItem item={{ id: `nav-datos-cronograma-${proj.id}`, label: 'Cronograma Entregas', path: `/project/${proj.id}?tab=datos&subtab=cronograma` }} depth={3} />
                    </NavGroup>
                    <NavGroup id={`bep-${proj.id}`} label="BEP" icon={FileText} depth={2}>
                      <NavItem item={{ id: `nav-esquemas-${proj.id}`, label: 'Esquema', path: `/esquemas?projectId=${proj.id}`, icon: Hexagon }} depth={3} />
                      <NavItem item={{ id: `nav-planner-${proj.id}`, label: 'Organizador / Deployer', path: `/planner?projectId=${proj.id}`, icon: ClipboardList }} depth={3} />
                      <NavItem item={{ id: `nav-protocolos-${proj.id}`, label: 'Protocolos', path: `/project/${proj.id}?tab=protocolos`, icon: FileText }} depth={3} />
                      <NavItem item={{ id: `nav-bep-equipo-${proj.id}`, label: 'Equipo y Roles', path: `/project/${proj.id}?tab=equipo&subtab=roles`, icon: Users }} depth={3} />
                      <NavItem item={{ id: `nav-herramientas-${proj.id}`, label: 'Herramientas BIM', path: `/project/${proj.id}?tab=herramientas`, icon: Settings }} depth={3} />
                      <NavItem item={{ id: `nav-db-report-${proj.id}`, label: 'PRE BEP', path: `/pre-bep?projectId=${proj.id}`, icon: Database }} depth={3} />
                    </NavGroup>
                    <NavItem item={{ id: `nav-proyecto-${proj.id}`, label: 'Sub Proyecto / Unidades', path: `/project/${proj.id}?tab=proyecto`, icon: Layers }} depth={2} />
                    <NavItem item={{ id: `nav-niveles-${proj.id}`, label: 'Niveles', path: `/levels?projectId=${proj.id}`, icon: Layers }} depth={2} />
                    <NavItem item={{ id: `nav-areas-${proj.id}`, label: 'Gestor de Áreas', path: `/areas?projectId=${proj.id}`, icon: Layers }} depth={2} />
                    <NavItem item={{ id: `nav-materiales-${proj.id}`, label: 'Materiales', path: `/materials?projectId=${proj.id}`, icon: Package }} depth={2} />
                    <NavItem item={{ id: `nav-documentos-${proj.id}`, label: 'Documentos', path: `/documents?projectId=${proj.id}`, icon: FileText }} depth={2} />
                    <NavItem item={{ id: `nav-calendario-${proj.id}`, label: 'Calendario Sem/Mes', path: `/project/${proj.id}?tab=mes`, icon: Calendar }} depth={2} />
                    <NavItem item={{ id: `nav-requisitos-${proj.id}`, label: 'Requisitos de informacion', path: `/project/${proj.id}?tab=requisitos`, icon: Layers }} depth={2} />
                    <NavItem item={{ id: `nav-equipo-${proj.id}`, label: 'Equipo', path: `/project/${proj.id}?tab=equipo`, icon: Users }} depth={2} />
                    <NavItem item={{ id: `nav-directorio-${proj.id}`, label: 'Directorio', path: `/project/${proj.id}?tab=directorio`, icon: Target }} depth={2} />
                  </NavGroup>
                ))}
                <div className="px-3 py-1 my-1">
                  <button
                    onClick={handleCreateProject}
                    className="w-full flex items-center justify-center gap-2 bg-[#0f4369] text-white border border-[#1c1c19] py-1.5 px-2 text-[11px] font-black uppercase tracking-wider hover:bg-[#1c1c19] transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    <Plus size={13} strokeWidth={3} />
                    <span>+ Crear Proyecto</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="px-2 py-2 my-1 flex flex-col gap-2">
                <div className="text-[10px] font-mono text-[#72777f] uppercase px-1 font-bold">Sin proyectos asignados</div>
                <button
                  onClick={handleCreateProject}
                  className="w-full flex items-center justify-center gap-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] py-2 px-3 text-xs font-black uppercase tracking-wider hover:bg-[#1c1c19] transition-all shadow-[3px_3px_0_0_rgba(28,28,25,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <Plus size={14} strokeWidth={3} />
                  <span>Crear Nuevo Proyecto</span>
                </button>
              </div>
            )}
          </NavGroup>

          <NavGroup id="cursos" label="Cursos / Capacitación" icon={BookOpen} depth={0} path="/roadmap">
            {roadmapData && roadmapData.map((phase) => (
              <NavGroup 
                key={phase.id} 
                id={`nav-${phase.id}`} 
                label={phase.title} 
                icon={phase.id === 'phase-1' ? LayoutDashboard : Layers} 
                depth={1}
                path="/roadmap"
                hash={`#${phase.id}`}
              >
                {phase.nodes && phase.nodes.map(node => (
                  <NavItem 
                    key={node.id} 
                    item={{ 
                      id: `nav-node-${node.id}`, 
                      label: node.title, 
                      path: `/module/${node.id}`, 
                      icon: FileText
                    }} 
                    depth={2} 
                  />
                ))}
              </NavGroup>
            ))}
            <NavGroup id="recursos" label="Recursos" icon={BookOpen} depth={1}>
              <NavItem item={{ id: 'nav-dictionary', label: 'Diccionario', path: '/dictionary', icon: Book }} depth={2} />
              <NavItem item={{ id: 'nav-plantillas', label: 'Plantillas', path: '#', icon: FileText }} depth={2} />
              <NavItem item={{ id: 'nav-articulos', label: 'Artículos', path: '/resources', icon: FileText }} depth={2} />
            </NavGroup>
          </NavGroup>



          {isAdmin && (
            <NavGroup id="admin" label="Admin" icon={Settings} depth={0}>
              <NavItem item={{ id: 'nav-esquema-admin', label: 'Esquema Admin', path: '/esquemaEdit', icon: Hexagon }} depth={1} />
              <NavItem item={{ id: 'nav-articulos-admin', label: 'Artículos Admin', path: '/admin/resources', icon: FileText }} depth={1} />
              <NavItem item={{ id: 'nav-materiales-admin', label: 'Materiales Global', path: '/materials', icon: Package }} depth={1} />
              <NavItem item={{ id: 'nav-presentacion', label: 'Presentación', path: '/admin/presentation', icon: BookOpen }} depth={1} />
            </NavGroup>
          )}

          <NavItem item={{ id: 'nav-from-plugin', label: 'Plugin Revit (/fromPlugIn)', path: '/fromPlugIn', icon: Database }} depth={0} />
          <NavItem item={{ id: 'nav-about', label: t('nav.about'), path: '/about', icon: Info }} depth={0} />

        </nav>

        <div className="mt-auto px-2 pb-2 w-full flex flex-col items-center gap-1">
          <button
            id="tutorial-btn"
            onClick={() => startTutorial(location.pathname)}
            className={`flex items-center w-full p-2 text-[#0f4369] bg-white hover:bg-[#e5e2dd] border-2 border-dashed border-[#0f4369] font-mono transition-all duration-200 ${isCollapsed ? 'justify-center h-10' : 'justify-start h-9'}`}
            title={isCollapsed ? t('nav.help_tutorial') : ''}
          >
            <HelpCircle size={18} className="shrink-0" />
            {!isCollapsed && (
              <span className="ml-3 text-[10px] font-bold tracking-widest uppercase truncate">
                {t('nav.help_tutorial')}
              </span>
            )}
          </button>

          <div className="w-full flex flex-col bg-[#f6f3ee] border-2 border-[#1c1c19]">
            <div className={`flex items-center p-1.5 gap-2 ${isCollapsed ? 'flex-col justify-center' : 'justify-between'}`}>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-[#0f4369]' : 'bg-[#493f36]'}`}></div>
                {!isCollapsed && (
                  <span className="text-[9px] font-black tracking-widest text-[#1c1c19] uppercase font-mono">
                    {isAdmin ? 'ADMIN' : 'ONLINE'}
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsAdminModalOpen(true)}
                className={`transition-all p-1 border border-transparent hover:border-[#1c1c19] hover:bg-white ${isAdmin ? 'text-[#0f4369]' : 'text-[#72777f] hover:text-[#1c1c19]'}`}
                title={t('nav.system_config')}
              >
                <Settings size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
        <CreateProjectModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onProjectCreated={handleProjectCreated} 
        />
        <DeleteProjectModal
          isOpen={Boolean(selectedProjectToDelete)}
          onClose={() => setSelectedProjectToDelete(null)}
          project={selectedProjectToDelete}
          onProjectDeleted={async () => {
            await handleProjectCreated();
            if (location.pathname.includes(selectedProjectToDelete?.id)) {
              navigate('/projects');
            }
          }}
        />
      </aside>
    </SidebarContext.Provider>
  );
}
