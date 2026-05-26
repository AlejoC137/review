import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lifecycleService } from '../services/lifecycleService';
import LifecycleView from './LifecycleView';
import MainProject from './MainProject';
import { useTranslation } from 'react-i18next';




function ProjectDetailView() {
  const { projectId } = useParams();
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
        const projects = await lifecycleService.getProjects();
        const found = projects.find(p => p.id === projectId);
        setProject(found);
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#fcf9f4]">
        <div className="font-mono text-[#1c1c19] animate-pulse uppercase tracking-[0.2em] text-sm bg-[#f6f3ee] border-2 border-[#1c1c19] px-8 py-4">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  // Check if it's the Kengo Kuma project
  const isKengoKuma = project?.name?.toLowerCase().includes('kengo kuma') || projectId === 'kengo-kuma';

  if (isKengoKuma) {
    return <MainProject project={project} />;
  }

  return <LifecycleView project={project} />;
}

export default ProjectDetailView;
