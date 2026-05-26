import React from 'react';
import { useTranslation } from 'react-i18next';
import {

  Award, Target, User, Briefcase,
  GraduationCap, Mail, Phone, MapPin,
  ExternalLink, Layers, ChevronRight
} from 'lucide-react';

export default function AboutUs() {
  const { t } = useTranslation();

  return (
    <>
      <div className="container mx-auto max-w-6xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 py-8 px-4 md:px-8">

        {/* Header Section: Software Info */}
        <section className="mb-12">
          <div className="w-full bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.2)] p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
              <div className="p-4 bg-[#0f4369] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] text-white w-fit">
                <Target size={40} strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter uppercase leading-none">
                  {t('about.software_title').split(' ')[0]} <span className="text-[#0f4369]">{t('about.software_title').split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="font-mono text-[11px] tracking-[0.4em] font-bold text-[#72777f] mt-3 uppercase">
                  {t('about.software_subtitle')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <p className="text-xl md:text-2xl leading-relaxed font-medium text-[#1c1c19]">
                  {t('about.software_desc')}
                </p>
              </div>
              <div className="space-y-6 pt-2 border-t-2 border-[#1c1c19]/10 lg:border-t-0 lg:border-l-2 lg:pl-10">
                <div>
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#0f4369] mb-2">/ {t('about.purpose_title')}</h3>
                  <p className="text-sm text-[#493f36] leading-relaxed italic">
                    "{t('about.purpose_desc')}"
                  </p>
                </div>
                <div>
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#0f4369] mb-2">/ {t('about.architecture_title')}</h3>
                  <p className="text-sm text-[#493f36] leading-relaxed">
                    {t('about.architecture_desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

          {/* Main Bio Section */}
          <div className="lg:col-span-8 space-y-8">

            {/* Profile Card */}
            <div className="bg-white border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.1)] p-8 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#fcf9f4] border-l-2 border-b-2 border-[#1c1c19] -mr-8 -mt-8 rotate-45 group-hover:bg-[#0f4369] transition-colors duration-500"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-px bg-[#0f4369]"></div>
                  <span className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-[#0f4369]">{t('about.headers.founder_profile')}</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                  {t('about.profile.name').toUpperCase()}
                </h2>
                <h3 className="font-mono text-xs font-bold text-[#0f4369] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                  <Briefcase size={14} />
                  {t('about.profile.role')}
                </h3>

                <div className="prose prose-sm max-w-none">
                  <p className="text-lg text-[#493f36] leading-relaxed font-light">
                    {t('about.profile.summary')}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Experience */}
            <div className="bg-[#1c1c19] text-white p-8 md:p-10 border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.1)]">
              <div className="flex items-center gap-4 mb-10 pb-4 border-b border-white/10">
                <Briefcase className="text-[#64b5f6]" size={24} />
                <h2 className="text-2xl font-bold uppercase tracking-wider">{t('about.experience.title')}</h2>
              </div>

              <div className="space-y-12">
                {/* TvS */}
                <div className="relative pl-8 border-l-2 border-white/20 hover:border-[#64b5f6] transition-colors">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#1c1c19] border-2 border-[#64b5f6]"></div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white leading-none">{t('about.experience.tvs.company')}</h4>
                      <p className="text-[#64b5f6] font-mono text-[10px] mt-2 font-bold uppercase tracking-widest">{t('about.experience.tvs.role')}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white/10 px-3 py-1 rounded-full text-white/60 whitespace-nowrap">
                      {t('about.experience.tvs.period')}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-4">
                    {t('about.experience.tvs.desc')}
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    {t('about.experience.tvs.responsibilities')?.split(', ').map((item, i) => (
                      <li key={i} className="text-[11px] text-white/50 flex items-start gap-2">
                        <ChevronRight size={12} className="shrink-0 mt-0.5 text-[#64b5f6]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plan B */}
                <div className="relative pl-8 border-l-2 border-white/20 hover:border-[#64b5f6] transition-colors">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#1c1c19] border-2 border-white/40"></div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white leading-none">{t('about.experience.planb.company')}</h4>
                      <p className="text-[#64b5f6] font-mono text-[10px] mt-2 font-bold uppercase tracking-widest">{t('about.experience.planb.role')}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white/10 px-3 py-1 rounded-full text-white/60 whitespace-nowrap">
                      {t('about.experience.planb.period')}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {t('about.experience.planb.desc')}
                  </p>
                </div>

                {/* JG ARQ */}
                <div className="relative pl-8 border-l-2 border-white/20 hover:border-[#64b5f6] transition-colors">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#1c1c19] border-2 border-white/40"></div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white leading-none">{t('about.experience.jgarq.company')}</h4>
                      <p className="text-[#64b5f6] font-mono text-[10px] mt-2 font-bold uppercase tracking-widest">{t('about.experience.jgarq.role')}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white/10 px-3 py-1 rounded-full text-white/60 whitespace-nowrap">
                      {t('about.experience.jgarq.period')}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {t('about.experience.jgarq.desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">

            {/* Projects Highlights */}
            <div className="bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.1)] p-8">
              <div className="flex items-center gap-3 mb-8">
                <Layers size={20} className="text-[#0f4369]" />
                <h2 className="font-display font-bold uppercase tracking-widest text-lg">{t('about.headers.key_projects')}</h2>
              </div>

              <div className="space-y-6">
                {(() => {
                  const projectsObj = t('about.projects', { returnObjects: true });
                  const projectKeys = (projectsObj && typeof projectsObj === 'object') ? Object.keys(projectsObj) : [];
                  return projectKeys.map((key) => (
                    <div key={key} className="group border-b border-[#e5e2dd] pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm uppercase tracking-tight group-hover:text-[#0f4369] transition-colors">
                          {t(`about.projects.${key}.name`)}
                        </h4>
                        {t(`about.projects.${key}.finished`) && (
                          <span className="text-[9px] font-mono font-bold bg-[#1c1c19] text-white px-2 py-0.5 uppercase">
                            {t(`about.projects.${key}.finished`).split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#72777f] leading-relaxed mb-3">
                        {t(`about.projects.${key}.desc`)}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#493f36] uppercase font-bold">
                          <User size={10} className="text-[#0f4369]" />
                          {t(`about.projects.${key}.role`) || 'Project Architect'}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Education & Skills */}
            <div className="bg-white border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.1)] p-8">
              <div className="space-y-10">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <GraduationCap size={20} className="text-[#0f4369]" />
                    <h2 className="font-display font-bold uppercase tracking-widest text-sm">{t('about.education.title')}</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase">{t('about.education.degree')}</p>
                      <p className="text-[11px] text-[#72777f] uppercase">{t('about.education.university')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase">{t('about.education.specialization')}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-[#e5e2dd]">
                  <div className="flex items-center gap-3 mb-6">
                    <Award size={20} className="text-[#0f4369]" />
                    <h2 className="font-display font-bold uppercase tracking-widest text-sm">{t('about.skills.title')}</h2>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-mono text-[#0f4369] font-bold uppercase mb-2">{t('about.headers.tech_stack')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {t('about.skills.technical').split(', ').map((skill, i) => (
                          <span key={i} className="text-[10px] font-bold bg-[#fcf9f4] border border-[#1c1c19] px-2 py-1 uppercase">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-mono text-[#0f4369] font-bold uppercase mb-2">Languages</h4>
                      <p className="text-[11px] font-medium text-[#493f36]">{t('about.skills.languages')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.1)] p-8">
              <h2 className="font-display font-bold uppercase tracking-widest text-sm mb-6">{t('about.contact.title')}</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-[#64b5f6]" />
                  <span className="text-xs font-mono">{t('about.contact.location')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[#64b5f6]" />
                  <a href="mailto:diegoa.patinoa@gmail.com" className="text-xs font-mono hover:text-[#64b5f6] transition-colors underline decoration-white/20">
                    diegoa.patinoa@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-[#64b5f6]" />
                  <span className="text-xs font-mono">(+57) 3246341679</span>
                </div>
                <div className="pt-4 mt-4 border-t border-white/10">
                  <a
                    href="https://dapatinoa.wixsite.com/apportafolio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full bg-white text-[#1c1c19] font-bold text-[10px] px-4 py-3 border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-none translate-y-0 hover:translate-x-1 hover:translate-y-1 transition-all uppercase tracking-widest"
                  >
                    {t('about.headers.visit_portfolio')}
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Footer Info */}
        <div className="lg:col-span-12 py-12 border-t-2 border-[#e5e2dd] flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="flex items-center gap-8">
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#72777f]">
              ARC_DOC_REFERENCE: <span className="text-[#1c1c19]">AR-PAT-PROFILE-2025</span>
            </div>
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#72777f]">
              SYSTEM_STATUS: <span className="text-green-600 font-bold">AUTHENTICATED</span>
            </div>
          </div>
          <div className="text-[9px] font-mono text-[#72777f] text-center md:text-right uppercase tracking-[0.2em] leading-loose">
            © 2024-2025 ARCA CONSTRUCCIÓN DIGITAL<br />
            ALEJANDRO PATIÑO // ARCHITECTURAL INNOVATION HUB
          </div>
        </div>
      </div>

      {/* Custom Styles for scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fcf9f4;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1c1c19;
          border-radius: 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0f4369;
        }
      `}} />
    </>
  );
}
