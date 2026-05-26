import React from 'react';
import SiteLogoSVG from '../../assets/noun-r-7534742.svg';

export default function SiteLogo({ className = "w-6 h-6", color = "currentColor" }) {
  // We use an img tag for simplicity, but if color control is needed, 
  // we could inline the SVG or use CSS filters.
  // CSS filter to mimic #0f4369 if needed: 
  // filter: invert(21%) sepia(35%) saturate(1915%) hue-rotate(170deg) brightness(95%) contrast(92%);
  
  return (
    <img 
      src={SiteLogoSVG} 
      alt="Site Logo" 
      className={`${className} pointer-events-none transition-all duration-300`}
      style={{ 
        // Force the color to match the technical blue theme if requested
        filter: color === "#0f4369" 
          ? "invert(21%) sepia(35%) saturate(1915%) hue-rotate(170deg) brightness(95%) contrast(92%)" 
          : "none"
      }}
    />
  );
}
