import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { lifecycleService } from '../services/lifecycleService';
import LifecycleView from './LifecycleView';
import MainProject from './MainProject';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function ProjectDetailView() {
  const { user, isAdmin } = useAuth();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (projectId === 'kengo-kuma') {
      setProject({ id: 'kengo-kuma', name: 'KENGO KUMA RESORT' });
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        const projects = await lifecycleService.getProjects(user, isAdmin);
        const found = projects.find(p => p.id === projectId);
        setProject(found || { id: projectId, name: 'PROYECTO' });
      } catch (err) {
        console.error("Error fetching project:", err);
        setProject({ id: projectId, name: 'PROYECTO' });
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId, user, isAdmin]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#fcf9f4]">
        <div className="font-mono text-[#1c1c19] animate-pulse uppercase tracking-[0.2em] text-sm bg-[#f6f3ee] border-2 border-[#1c1c19] px-8 py-4">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  // Check if it's the Kengo Kuma project or if any tab is requested via query string
  const isKengoKuma = project?.name?.toLowerCase().includes('kengo kuma') || projectId === 'kengo-kuma';
  const hasTab = searchParams.has('tab');

  if (isKengoKuma || hasTab) {
    return <MainProject project={project} />;
  }

  return <LifecycleView project={project} />;
}

export default ProjectDetailView;
