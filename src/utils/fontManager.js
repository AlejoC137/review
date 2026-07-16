export const getCustomFonts = () => {
  try {
    return JSON.parse(localStorage.getItem('site_custom_fonts') || '[]');
  } catch (e) {
    return [];
  }
};

export const addCustomFont = (name, url) => {
  const fonts = getCustomFonts();
  if (!fonts.find(f => f.name === name)) {
    fonts.push({ name, url });
    localStorage.setItem('site_custom_fonts', JSON.stringify(fonts));
    window.dispatchEvent(new Event('custom-fonts-updated'));
  }
};
