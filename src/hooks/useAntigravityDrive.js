import { useState } from 'react';
import { ANTIGRAVITY_DRIVE_MAP } from '../constants/driveStructure';

export const useAntigravityDrive = () => {
  // Simulamos el token para efectos del test. 
  // En producción usarías: const googleToken = useSelector((state) => state.auth.googleAccessToken);
  const [googleToken] = useState("mock_token_123");

  const getFolderUrl = (key) => {
    const folderId = ANTIGRAVITY_DRIVE_MAP[key]?.id;
    return folderId ? `https://drive.google.com/drive/folders/${folderId}` : null;
  };

  const uploadToPreassigned = async (key, file) => {
    const folderId = ANTIGRAVITY_DRIVE_MAP[key]?.id;
    if (!googleToken || !folderId) {
      console.error("Falta token o ID de carpeta");
      return { success: false };
    }

    // Mock de subida
    console.log(`Subiendo [${file.name}] a la carpeta [${folderId}] con el token [${googleToken}]`);
    
    // Aquí iría tu fetch real a Google Drive API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: `Archivo subido a ${ANTIGRAVITY_DRIVE_MAP[key].path}` });
      }, 1000);
    });
  };

  return { getFolderUrl, uploadToPreassigned };
};
