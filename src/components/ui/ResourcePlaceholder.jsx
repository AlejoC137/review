import React from 'react';
import { 
  Database, Server, Layers, Box, Cpu, HardDrive, 
  Compass, Hexagon, Component, Blocks, LayoutTemplate, 
  FileCode2, Frame, Network 
} from 'lucide-react';

const brollImages = import.meta.glob('../../broll/*.{jpg,jpeg,png,webp}', { 
  eager: true, 
  query: '?url', 
  import: 'default' 
});
const imagePaths = Object.values(brollImages);

const icons = [
  Database, Server, Layers, Box, Cpu, HardDrive, 
  Compass, Hexagon, Component, Blocks, LayoutTemplate, 
  FileCode2, Frame, Network
];

export default function ResourcePlaceholder({ seed, className = "", iconSize = 48 }) {
  // Simple deterministic hash based on seed string
  const hash = seed ? seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0) : 0;
  
  const absHash = Math.abs(hash);
  
  // Pick an image dynamically if available
  const imgIndex = imagePaths.length > 0 ? absHash % imagePaths.length : null;
  const bgImg = imgIndex !== null ? imagePaths[imgIndex] : null;
  
  // Pick an icon deterministically
  const IconComponent = icons[absHash % icons.length];

  return (
    <div className={`w-full h-full relative flex items-center justify-center overflow-hidden bg-[#e5e2dd] ${className}`}>
      {bgImg ? (
        <img 
          src={bgImg} 
          alt="Resource Fallback Background" 
          className="w-full h-full object-cover mix-blend-multiply opacity-[0.35] grayscale"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(#d8d3cc_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
      )}
      <div className="absolute inset-0 flex items-center justify-center z-10 transition-transform duration-700 ease-in-out hover:scale-110">
        <IconComponent size={iconSize} className="text-[#0f4369] opacity-80" strokeWidth={1} />
      </div>
    </div>
  );
}
