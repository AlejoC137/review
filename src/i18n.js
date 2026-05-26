import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: {
          nav: {
            dashboard: 'DASHBOARD',
            project: 'PROJECT',
            resources: 'RESOURCES',
            dictionary: 'DICTIONARY',
            about: 'ABOUT US',
            admin: 'ADMIN',
            documents: 'DOCUMENTS',
            users: 'USERS',
            phase_1: 'PHASE 1',
            phase_2: 'PHASE 2',
            esquemas: 'SCHEMES',
            planner: 'PLAN IMPLEMENTACION BIM',
            help_tutorial: 'HELP / TUTORIAL',
            system_config: 'System Config'
          },
          header: {
            logout: 'LOGOUT',
            guest: 'GUEST',
            toggle_menu: 'Toggle Menu'
          },
          dashboard: {
            title: 'BIM IMPLEMENTATION ROADMAP',
            welcome: 'Welcome, {{name}}',
            loading: 'LOADING_DATA...',
            scale: 'SCALE: 1:100',
            rev: 'REV: A.01',
            stats: {
              active_projects: 'Active Projects',
              completed_modules: 'Completed Modules',
              total_resources: 'Total Resources'
            }
          },
          project: {
            dashboard_title: 'PROJECT_DASHBOARD',
            loading_projects: 'LOADING_PROJECTS...',
            control_label: 'PROJECT_CONTROL',
            main_title: 'PROJECT<br />CENTER',
            new_project_btn: 'NEW PROJECT',
            open_lifecycle: 'OPEN_PROJECT',
            system_empty: 'SYSTEM_EMPTY',
            template_label: 'TEMPLATE: {{name}}',
            prompts: {
              new_project_name: 'Name of the new project:',
              no_templates: 'No lifecycle templates defined.'
            }
          },
          common: {
            loading: 'Loading...',
            error: 'Error',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            back: 'Back'
          },
          about: {
            title: 'SYSTEM_INFO // ABOUT_US',
            software_title: 'REVIEW SOFTWARE',
            software_subtitle: 'SPECIFICATION // VER. 1.1.0',
            software_desc: 'REVIEW is a specialized platform developed by ARCA designed to transform digital construction project management.',
            purpose_title: 'Core Purpose',
            purpose_desc: 'Facilitate access to critical information and ensure total traceability of the Revit implementation plan.',
            architecture_title: 'Data Architecture',
            architecture_desc: 'Our infrastructure monitors each phase of BIM deployment, ensuring company standards through dynamic progress indicators.',
            headers: {
              founder_profile: 'FOUNDER_PROFILE',
              key_projects: 'FOUNDATION_PROJECTS',
              tech_stack: 'Technical_Stack',
              visit_portfolio: 'Visit Portfolio'
            },
            profile: {
              name: 'Alejandro Patiño',
              role: 'Project Architect',
              summary: 'Architect with over six years of experience across various project types and scales, prioritizing the complete project lifecycle. I seek to build a multidisciplinary career that allows me to master new frameworks and project scales, refining my technical and soft skills in challenging environments. My approach combines rigorous technical resolution with design sensitivity, always oriented towards aligning architectural solutions with the client\'s strategic goals.'
            },
            experience: {
              title: 'EXPERIENCE AND PROJECTS',
              tvs: {
                company: 'TvS RealState',
                role: 'Design Team Coordinator',
                period: 'November 2025 - Present (4 months)',
                desc: 'Architectural design and technical development team leader, coordinating client needs with the construction team.',
                responsibilities: 'Monitoring of technical processes, personnel supervision, monitoring of on-site activities according to designs, supervision (interventoría), general workflow administration, documentation management, and development of platforms for project communication and tracking.'
              },
              planb: {
                company: 'PLAN B | ARCHITECTS',
                role: 'Project Development Architect',
                period: '2021 - 2023',
                desc: 'Comprehensive management of the project lifecycle, from conception to construction, with emphasis on technical coordination and advanced modeling.'
              },
              jgarq: {
                company: 'JG ARQ. OFFICE',
                role: 'Design Architect',
                period: '2018 - 2021',
                desc: 'Planning, design, and drafting of 16,000 m². Direct management of clients and details. A mixed stage ranging from pharmaceutical rigor to residential reflection.',
                principals: 'Arch. Juan Carlos Gutiérrez'
              },
              freelance: {
                company: 'FREELANCE | ARCA',
                role: 'Co-Director / Freelance',
                period: '2018 - 2025',
                desc: 'Developed and managed freelance projects including commercial spaces, real estate advisory, and residential renovations.'
              },
              comfama: {
                company: 'COMFAMA (Internship)',
                role: 'Sub-Directorate of Housing and Habitat',
                period: '2018 - 2021',
                desc: 'Research and graphic development for social impact projects and urban studies.'
              }
            },
            projects: {
              mudag: {
                name: 'MUDAG (Stadium)',
                desc: 'Modernization of the Atanasio Girardot Sports Complex. A city-scale project (~160,000 m²).',
                role: 'Project Director',
                client: 'PPP - Medellin Mayor\'s Office',
                finished: 'Planned'
              },
              heiss: {
                name: 'HOTEL HEISS',
                desc: 'Hotel in Villa Carlota, creating urban connections between park and commercial ground floor.',
                role: 'Project Director',
                size: '6,500 m²',
                finished: 'Finished (2022)'
              },
              wellnest: {
                name: 'WELLNEST by CLICK CLACK',
                desc: 'Pioneering project focused on wellness and health.',
                role: 'Project Director',
                size: '17,100 m²',
                finished: 'In Planning (2023)'
              },
              humax: {
                name: 'HUMAX PHARMA',
                desc: 'Physical and spatial transformation of a major pharmaceutical company for the Canadian market.',
                role: 'Project Director',
                size: '14,000 m²',
                finished: 'In Planning (2021)'
              },
              baseloft: {
                name: 'BASE LOFT',
                desc: 'Modern urban living in the heart of the city center.',
                role: 'Project Director',
                size: '6,500 m²',
                finished: 'Built (2020)'
              }
            },
            education: {
              title: 'EDUCATION',
              degree: 'Bachelor’s Degree in Architecture',
              specialization: 'Specialization in Urban Design',
              university: 'Universidad Nacional de Colombia, Medellín'
            },
            skills: {
              title: 'SKILLS',
              technical: 'AutoCAD, Revit, Lumion, SketchUp, Adobe Suite',
              languages: 'Spanish (Native), English (C1 Certified)'
            },
            contact: {
              title: 'CONTACT',
              location: 'Medellín, Antioquia, Colombia'
            }
          }
        }
      },
      es: {
        translation: {
          nav: {
            dashboard: 'PANEL CONTROL',
            project: 'PROYECTO',
            resources: 'RECURSOS',
            dictionary: 'DICCIONARIO',
            about: 'NOSOTROS',
            admin: 'ADMIN',
            documents: 'DOCUMENTOS',
            users: 'USUARIOS',
            phase_1: 'FASE 1',
            phase_2: 'FASE 2',
            esquemas: 'ESQUEMAS',
            planner: 'PLANIFICADOR',
            help_tutorial: 'AYUDA / TUTORIAL',
            system_config: 'Config. Sistema'
          },
          header: {
            logout: 'CERRAR SESIÓN',
            guest: 'INVITADO',
            toggle_menu: 'Alternar Menú'
          },
          dashboard: {
            title: 'HOJA DE RUTA DE IMPLEMENTACIÓN BIM',
            welcome: 'Bienvenido, {{name}}',
            loading: 'CARGANDO_DATOS...',
            scale: 'ESCALA: 1:100',
            rev: 'REV: A.01',
            stats: {
              active_projects: 'Proyectos Activos',
              completed_modules: 'Módulos completeds',
              total_resources: 'Recursos Totales'
            }
          },
          project: {
            dashboard_title: 'PANEL_PROYECTOS',
            loading_projects: 'CARGANDO_PROYECTOS...',
            control_label: 'CONTROL_DE_PROYECTOS',
            main_title: 'CENTRO DE<br />PROYECTOS',
            new_project_btn: 'NUEVO PROYECTO',
            open_lifecycle: 'ABRIR_PROYECTO',
            system_empty: 'SISTEMA_VACÍO',
            template_label: 'PLANTILLA: {{name}}',
            prompts: {
              new_project_name: 'Nombre del nuevo proyecto:',
              no_templates: 'No hay plantillas de ciclo de vida definidas.'
            }
          },
          common: {
            loading: 'Cargando...',
            error: 'Error',
            save: 'Guardar',
            cancel: 'Cancelar',
            delete: 'Eliminar',
            edit: 'Editar',
            back: 'Volver'
          },
          about: {
            title: 'SISTEMA_INFO // NOSOTROS',
            software_title: 'REVIEW SOFTWARE',
            software_subtitle: 'ESPECIFICACIÓN // VER. 1.1.0',
            software_desc: 'REVIEW es una plataforma especializada desarrollada por ARCA diseñada para transformar la gestión de proyectos de construcción digital.',
            purpose_title: 'Propósito Central',
            purpose_desc: 'Facilitar el acceso a la información crítica y garantizar la trazabilidad total del plan de implementación de Revit.',
            architecture_title: 'Arquitectura de Datos',
            architecture_desc: 'Nuestra infraestructura permite monitorear cada fase del despliegue BIM, asegurando que los estándares de la compañía se cumplan.',
            headers: {
              founder_profile: 'PERFIL_FUNDADOR',
              key_projects: 'PROYECTOS_CLAVE',
              tech_stack: 'Stack_Técnico',
              visit_portfolio: 'Ver Portafolio'
            },
            profile: {
              name: 'Alejandro Patiño',
              role: 'Arquitecto de Proyecto',
              summary: 'Arquitecto con más de seis años de experiencia en diversos tipos de proyectos y escalas, priorizando el ciclo de vida completo. Busco construir una carrera multidisciplinaria que me permita dominar nuevos marcos y escalas, refinando mis habilidades técnicas y blandas. Mi enfoque combina la resolución técnica rigurosa con la sensibilidad de diseño, orientado a alinear las soluciones arquitectónicas con los objetivos estratégicos del cliente.'
            },
            experience: {
              title: 'EXPERIENCIA Y PROYECTOS',
              tvs: {
                company: 'TvS RealState',
                role: 'Coordinador de Equipo de Diseño',
                period: 'Noviembre 2025 - Presente (4 meses)',
                desc: 'Líder de diseño arquitectónico y desarrollo técnico, coordinando las necesidades del cliente con el equipo de construcción.',
                responsibilities: 'Monitoreo de procesos técnicos, supervisión de personal, seguimiento de obra, interventoría, administración de flujo de trabajo y gestión documental.'
              },
              planb: {
                company: 'PLAN B | ARQUITECTOS',
                role: 'Arquitecto de Desarrollo',
                period: '2021 - 2023',
                desc: 'Gestión integral del ciclo de vida del proyecto, desde la concepción hasta la construcción, con énfasis en coordinación técnica y modelado avanzado.'
              },
              jgarq: {
                company: 'JG ARQ. OFICINA',
                role: 'Arquitecto Diseñador',
                period: '2018 - 2021',
                desc: 'Planeación, diseño y dibujo de 16,000 m². Gestión directa de clientes y detalles. Una etapa mixta desde el rigor farmacéutico hasta lo residencial.',
                principals: 'Arq. Juan Carlos Gutiérrez'
              },
              freelance: {
                company: 'FREELANCE | ARCA',
                role: 'Co-Director / Freelance',
                period: '2018 - 2025',
                desc: 'Desarrollo y gestión de proyectos independientes que incluyen espacios comerciales, asesoría inmobiliaria y renovaciones residenciales.'
              },
              comfama: {
                company: 'COMFAMA (Pasantía)',
                role: 'Subdirección de Vivienda y Hábitat',
                period: '2018 - 2021',
                desc: 'Investigación y desarrollo gráfico para proyectos de impacto social y estudios urbanos.'
              }
            },
            projects: {
              mudag: {
                name: 'MUDAG (Estadio)',
                desc: 'Modernización del Complejo Deportivo Atanasio Girardot. Proyecto a escala urbana (~160,000 m²).',
                role: 'Director de Proyecto',
                client: 'APP - Alcaldía de Medellín',
                finished: 'Planeado'
              },
              heiss: {
                name: 'HOTEL HEISS',
                desc: 'Hotel en Villa Carlota, creando conexiones urbanas entre el parque y su planta baja comercial.',
                role: 'Director de Proyecto',
                size: '6,500 m²',
                finished: 'Terminado (2022)'
              },
              wellnest: {
                name: 'WELLNEST por CLICK CLACK',
                desc: 'Proyecto pionero enfocado en el bienestar y la salud.',
                role: 'Director de Proyecto',
                size: '17,100 m²',
                finished: 'En Planeación (2023)'
              },
              humax: {
                name: 'HUMAX PHARMA',
                desc: 'Transformación física y espacial de una importante farmacéutica para el mercado canadiense.',
                role: 'Director de Proyecto',
                size: '14,000 m²',
                finished: 'En Planeación (2021)'
              },
              baseloft: {
                name: 'BASE LOFT',
                desc: 'Enfoque contemporáneo de vida moderna en el corazón del centro de la ciudad.',
                role: 'Director de Proyecto',
                size: '6,500 m²',
                finished: 'Construido (2020)'
              }
            },
            education: {
              title: 'EDUCACIÓN',
              degree: 'Título de Arquitecto',
              specialization: 'Especialista en Diseño Urbano',
              university: 'Universidad Nacional de Colombia, Sede Medellín'
            },
            skills: {
              title: 'HABILIDADES',
              technical: 'AutoCAD, Revit, Lumion, SketchUp, Adobe Suite',
              languages: 'Español (Nativo), Inglés (C1 Certificado)'
            },
            contact: {
              title: 'CONTACTO',
              location: 'Medellín, Antioquia, Colombia'
            }
          }
        }
      }
    }
  });

export default i18n;
