-- Seed file for Information Requirements Templates
-- Assuming project_id is NULL for global templates

INSERT INTO public.information_requirements (req_code, name, format_type, roles, description, category, status)
VALUES 
  ('AIR', 'Requisitos de Información del Activo', '.DOC', 'Appointing Party (Cliente)', 'Listado de propiedades informacionales finales para la gestión de ciclo de vida.', 'Iniciales', 'PUBLISHED'),
  ('EIR', 'Requisitos de Intercambio de Información', '.DOC', 'Appointing Party / Lead Appointed Party', 'Pliego de condiciones BIM, formatos, estándares y matriz normativa entregada a la cadena de suministro.', 'Iniciales', 'PUBLISHED'),
  ('LOIN', 'Nivel de Necesidad de Información', '.DOC', 'Lead Appointed Party / Task Teams', 'Matriz detallada por elemento: LOG (Geometría), LOI (Alfanumérico) y DOC (Planos/Manuales).', 'Iniciales', 'PUBLISHED'),
  ('OIR', 'Requisitos de Información de la Organización', '.DOC', 'Appointing Party (Cliente)', 'Objetivos estratégicos macroscópicos que justifican el CAPEX y la implementación BIM.', 'Iniciales', 'PUBLISHED'),
  ('PIR', 'Requisitos de Información del Proyecto', '.DOC', 'Appointing Party (Cliente)', 'Datos críticos e informes gerenciales requeridos en los puntos clave (Key Decision Points).', 'Iniciales', 'PUBLISHED'),
  ('MIDP', 'Plan Maestro de Entrega de Información', '.DOC', 'Lead Appointed Party', 'Consolidación de todos los planes de tareas (TIDP). Define el cronograma maestro, hitos y formatos.', 'Operativos', 'PUBLISHED'),
  ('TIDP', 'Plan de Entrega de Información de Tareas', '.DOC', 'Task Teams (Equipos de Trabajo)', 'Desglose específico generado por cada disciplina (Estructuras, Arquitectura, MEP).', 'Operativos', 'PUBLISHED'),
  ('RFI', 'Solicitud de Información / Request for Information', '.FORM', 'Task Teams / Lead Appointed Party', 'Formato estructurado para solicitar aclaraciones sobre el diseño o incongruencias en el EIR.', 'Gestión', 'PUBLISHED'),
  ('SGR', 'Stage Gate & Peer Review', '.FORM', 'Lead Appointed Party / Appointing Party', 'Protocolo y formulario de autorización para la transición de información en el CDE (WIP a Shared, etc).', 'Gestión', 'PUBLISHED'),
  ('CR', 'Solicitud de Modificación o Actualización', '.FORM', 'Appointing Party / Lead Appointed Party', 'Documento formal para gestionar cambios en el alcance del proyecto, modificaciones o actualizaciones.', 'Gestión', 'PUBLISHED'),
  ('CCR', 'Reporte de Coordinación BIM', '.DOC', 'BIM Coordinator / Task Teams', 'Documenta interferencias (hard/soft clashes), responsabilidades y el estado de la coordinación.', 'Operativos', 'PUBLISHED'),
  ('AIM Handover', 'Solicitud de Traspaso para Operaciones', '.DOC', 'Lead Appointed Party / Appointing Party', 'Consolida el modelo As-Built y las bases de datos para transferir el PIM al AIM.', 'Entregables Finales', 'PUBLISHED')
ON CONFLICT DO NOTHING;
