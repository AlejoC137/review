import blankTemplate from './blankTemplate.json';

export const JSON_TEMPLATES = [
  blankTemplate
];

export const getJsonTemplateById = (templateId) => {
  if (!templateId) return blankTemplate;
  return JSON_TEMPLATES.find(t => t.id === templateId) || blankTemplate;
};
