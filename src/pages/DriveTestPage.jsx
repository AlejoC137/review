import React, { useState } from 'react';
import DriveConnector from '../components/DriveConnector';
import { useAntigravityDrive } from '../hooks/useAntigravityDrive';
import { ANTIGRAVITY_DRIVE_MAP } from '../constants/driveStructure';
import { Bot, UploadCloud, FileText } from 'lucide-react';


const DriveTestPage = () => {
  const [prompt, setPrompt] = useState('');
  const [logs, setLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { uploadToPreassigned } = useAntigravityDrive();

  // Simulación de la lógica de enrutamiento del Asistente Antigravity (IA)
  const routeByKeywords = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('bim') || lowerText.includes('revit') || lowerText.includes('plano')) {
      return 'BIM_HOTEL_PROYECTO';
    }
    if (lowerText.includes('receta') || lowerText.includes('auditoría') || lowerText.includes('ingrediente')) {
      return 'AUDITORIA_GASTRONOMICA';
    }
    return 'ASISTENTE_CONTEXTO';
  };

  const handleSimulateAiGeneration = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    addLog(`Usuario: "${prompt}"`);

    // 1. Simular la inferencia de la IA
    const targetKey = routeByKeywords(prompt);
    addLog(`🤖 Antigravity analizó el contexto...`);

    setTimeout(async () => {
      addLog(`🤖 Destino determinado: ${targetKey}`);

      // 2. Simular archivo generado
      const dummyFile = {
        name: `reporte_${Date.now()}.json`,
        content: { context: prompt, generatedAt: new Date().toISOString() }
      };

      addLog(`🤖 Generando archivo: ${dummyFile.name}...`);

      // 3. Subir automáticamente
      const result = await uploadToPreassigned(targetKey, dummyFile);

      if (result.success) {
        addLog(`✅ Éxito: ${result.message}`);
      } else {
        addLog(`❌ Error al subir el archivo.`);
      }

      setIsProcessing(false);
      setPrompt('');
    }, 1500);
  };

  const addLog = (msg) => {
    setLogs(prev => [...prev, msg]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <header className="border-b border-slate-700 pb-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UploadCloud className="text-blue-500" />
            Test de Enrutamiento de Drive
          </h1>
          <p className="text-slate-400 mt-2">
            Simulación de integración de Google Drive con asignación de carpetas por contexto de Antigravity.
          </p>
        </header>

        {/* Sección de los Connectors */}
        <section>
          <h2 className="text-xl font-semibold mb-4 border-l-4 border-blue-500 pl-3">Carpetas Activas (Drive Connectors)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DriveConnector
              targetKey="BIM_HOTEL_PROYECTO"
              label="BIM Modelos"
              description={ANTIGRAVITY_DRIVE_MAP.BIM_HOTEL_PROYECTO.description}
            />
            <DriveConnector
              targetKey="AUDITORIA_GASTRONOMICA"
              label="Auditoría (Recetas)"
              description={ANTIGRAVITY_DRIVE_MAP.AUDITORIA_GASTRONOMICA.description}
            />
            <DriveConnector
              targetKey="ASISTENTE_CONTEXTO"
              label="Logs del Sistema"
              description={ANTIGRAVITY_DRIVE_MAP.ASISTENTE_CONTEXTO.description}
            />
          </div>
        </section>

        {/* Simulador del Asistente */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bot className="text-purple-400" />
              Simular Interacción de IA
            </h2>
            <p className="text-sm text-slate-400">
              Escribe un prompt para que el asistente genere un archivo. Si mencionas "BIM" o "plano", irá a la carpeta BIM. Si mencionas "receta", irá a Finanzas.
            </p>

            <textarea
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              rows={4}
              placeholder="Ej: Hola, necesito subir este plano de Revit del nuevo piso."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <button
              onClick={handleSimulateAiGeneration}
              disabled={isProcessing || !prompt.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>Procesando...</>
              ) : (
                <>
                  <FileText size={18} />
                  Generar y Subir Archivo
                </>
              )}
            </button>
          </div>

          <div className="flex-1 bg-slate-950 rounded-lg p-4 font-mono text-sm border border-slate-800 flex flex-col h-64 overflow-hidden">
            <h3 className="text-slate-500 mb-2 border-b border-slate-800 pb-2">Terminal de Logs</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {logs.length === 0 && <span className="text-slate-600">Esperando eventos...</span>}
              {logs.map((log, idx) => (
                <div key={idx} className={log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default DriveTestPage;
