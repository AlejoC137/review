import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Database, Upload, AlertTriangle, Play } from 'lucide-react';
import supabase from '../../config/supabaseClient';
import { getStaffers } from '../../services/spacesService';
import { getProjects } from '../../services/tasksService';
import { useDispatch } from 'react-redux';
import { initCreateTask } from '../../store/actions/appActions';

const ENTITY_CONFIG = {
    tasks: {
        label: 'Jerarquía Tarea + Acciones',
        table: 'Tareas',
        prompt: `Actúa como un experto DBA. Tu objetivo es organizar información desestructurada (ej: de Excel) en una jerarquía de Tarea Principal y sus Acciones/Actividades asociadas.

    prompt: 'Analiza el texto y genera un objeto JSON con la siguiente estructura exacta: \n' +
        '{ "task": { "task_description": "string", "fecha_inicio": "YYYY-MM-DD", "fecha_fin_estimada": "YYYY-MM-DD", "Priority": "1-5", "finished": "Activa/Pausada", "notes": "JSON String of array", "proyecto_id": "uuid or null", "staff_id": "uuid or null", "RonaldPass": bool, "WietPass": bool, "AlejoPass": bool }, "actions": [ { "description": "string (REQUIRED)", "executor_id": "string (Name of internal staff)", "ejecutor_texto": "string (Name of external company/person if applicable)", "fecha_ejecucion": "YYYY-MM-DD", "fecha_fin": "YYYY-MM-DD", "completed": bool, "requiere_aprobacion_ronald": bool, "requiere_aprobacion_wiet": bool, "requiere_aprobacion_alejo": bool } ] }. \n' +
        'Si el input es una lista de tareas, agrupa todo en una sola Tarea Principal que englobe las acciones, o selecciona la más relevante. \n' +
        'IMPORTANTE: "ejecutor_texto" debe usarse si el ejecutor no es un staff interno conocido. "objetivo" (text) si se menciona explícitamente.',

REGLAS:
1. Identifica una sola Tarea Principal que englobe a las demás.
2. Todas las demás líneas deben ser objetos dentro del array 'actions'.
3. La 'task' incluye Priority, finished, y los campos de aprobación (Pass).
4. 'notes' debe ser un string JSON stringified de un array de objetos {date, user, text} o un string vacío si no hay notas.
5. Las 'actions' tienen sus propios campos de aprobación.
6. Si el input tiene fechas, colócalas en la 'task'.
7. No incluyes UUIDs inventados.
8. El output debe ser ÚNICAMENTE el objeto JSON.`
    },
    materials: {
        label: 'Materiales',
        table: 'Materiales',
        prompt: `Actúa como un experto DBA. Convierte la lista de materiales a un JSON Array para la tabla 'Materiales'.

COLUMNAS Y TIPOS:
- Nombre (text, requerido): Nombre del material.
- categoria (text): Categoría (ej: Grifería, Madera, Drywall).
- tipo (text): Tipo o especificación técnica.
- precio_COP (numeric): Precio unitario en pesos colombianos.
- stock (numeric): Cantidad disponible en inventario.
- unidad (text): Unidad de medida (und, m2, ml, kg).
- proveedor (text): Nombre del proveedor.
- alto_mm, ancho_mm, espesor_mm (numeric): Dimensiones técnicas en milímetros.
- largo_m (numeric): Largo en metros.
- acabado (text): Tipo de acabado superficial.
- observaciones_tecnicas (text): Notas de uso o técnicas.
- notas (text): Comentarios adicionales.

REGLAS CRÍTICAS:
1. Los campos numéricos (precio, stock, dimensiones) deben ser números puros, sin símbolos de moneda ni letras.
2. No inventes IDs.
3. El output debe ser ÚNICAMENTE el JSON Array.`
    },
    staff: {
        label: 'Equipo (Staff)',
        table: 'Staff',
        prompt: `Actúa como DBA. Convierte los datos de personal a un JSON Array para la tabla 'Staff'.

COLUMNAS Y TIPOS:
- name (text, requerido): Nombre completo.
- role_description (text): Cargo o descripción de funciones.
- email (text): Correo electrónico.
- telefono (text): Número de contacto.

REGLAS:
1. Asegúrate de limpiar los nombres y roles.
2. Output: JSON Array puro.`
    },
    projects: {
        label: 'Proyectos',
        table: 'Proyectos',
        prompt: `Actúa como DBA. Genera un JSON Array para la tabla 'Proyectos'.

COLUMNAS:
- name (text, requerido): Nombre del proyecto/obra.
- responsable (uuid, opcional): ID del arquitecto responsable.
- finished (uuid, opcional): ID del estado del proyecto.
- espacios (text): Descripción o lista de espacios.
- Datos (text): Configuración adicional en formato texto o JSON stringified.

REGLAS:
1. Los campos marcados como UUID deben ser null si no se conoce el ID exacto.
2. Output: JSON Array puro.`
    },
    protocols: {
        label: 'Protocolos',
        table: 'Protocolos',
        prompt: `Actúa como DBA. Genera un JSON Array para la tabla 'Protocolos'.

COLUMNAS:
- Nombre (text, requerido): Título del protocolo.
- Contenido (text): Cuerpo del protocolo en formato Markdown.
- Categoria (text): Categoría del protocolo.
- Editor (text): Nombre de quien redactó o editó.
- FechaUpdate (text): Fecha de última actualización.

REGLAS:
1. Asegura que el campo 'Contenido' escape correctamente saltos de línea y caracteres de Markdown para ser un string JSON válido.
2. Output: JSON Array puro.`
    }
};

const JsonImporterModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [entity, setEntity] = useState('tasks');
    const [jsonInput, setJsonInput] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);
    const [finished, setStatus] = useState('idle');
    const [copyFeedback, setCopyFeedback] = useState(false);

    // Default Values (Legacy support but UI removed)
    const [defaultStaff, setDefaultStaff] = useState('');
    const [defaultProject, setDefaultProject] = useState('');

    if (!isOpen) return null;

    const handleCopyPrompt = () => {
        const text = ENTITY_CONFIG[entity].prompt;
        navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const handleJsonChange = (e) => {
        const text = e.target.value;
        setJsonInput(text);
        setError(null);
        setParsedData(null);

        if (!text.trim()) return;

        try {
            const parsed = JSON.parse(text);
            const isHierarchy = !Array.isArray(parsed) && parsed.task && Array.isArray(parsed.actions);
            const isArray = Array.isArray(parsed);

            if (!isArray && !isHierarchy) {
                throw new Error('El JSON debe ser un Array [...] o un objeto { "task": {...}, "actions": [...] }');
            }
            setParsedData(parsed);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpload = async () => {
        if (!parsedData) return;

        // PREVIEW MODE FOR TASKS
        if (entity === 'tasks') {
            const isHierarchy = !Array.isArray(parsedData) && parsedData.task;
            if (!isHierarchy) {
                setError("Para Tareas, se requiere el formato jerárquico { task: {}, actions: [] }");
                return;
            }

            const draftTask = {
                ...parsedData.task,
                staff_id: parsedData.task.staff_id || defaultStaff || null,
                project_id: parsedData.task.project_id || defaultProject || null,
                stage_id: parsedData.task.stage_id || null,
                finished: parsedData.task.finished || false,
                Priority: parsedData.task.Priority || '1',
                finished: parsedData.task.finished || 'Activa',
                notes: parsedData.task.notes || '[]',
                // Map fields to match 'taskForm' expectations
                task_description: parsedData.task.task_description,
                fecha_inicio: parsedData.task.fecha_inicio || new Date().toISOString().split('T')[0],
                fecha_fin_estimada: parsedData.task.fecha_fin_estimada || new Date().toISOString().split('T')[0],
                // Prepare Actions
                fullActions: (parsedData.actions || []).map(a => ({
                    description: a.description || 'Sin descripción',
                    completed: a.completed === true || a.finished === 'completed',
                    fecha_ejecucion: a.fecha_ejecucion || (parsedData.task.fecha_inicio || new Date().toISOString().split('T')[0]),
                    requiere_aprobacion_ronald: a.requiere_aprobacion_ronald || false,
                    requiere_aprobacion_wiet: a.requiere_aprobacion_wiet || false,
                    requiere_aprobacion_alejo: a.requiere_aprobacion_alejo || false
                }))
            };

            dispatch(initCreateTask(draftTask));
            // Keep modal open for reference
            return;
        }

        // DIRECT UPLOAD FOR OTHER ENTITIES
        setStatus('uploading');
        const tableName = ENTITY_CONFIG[entity].table;

        try {
            // Simple Array Insert
            const processedData = Array.isArray(parsedData) ? parsedData : [parsedData];
            const cleanData = processedData.map(item => {
                const cleanItem = { ...item };
                if (entity === 'projects') {
                    cleanItem.responsable = cleanItem.responsable || defaultStaff || null;
                }
                return cleanItem;
            });

            const { error: uploadError } = await supabase
                .from(tableName)
                .insert(cleanData);

            if (uploadError) throw uploadError;

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setJsonInput('');
                setParsedData(null);
                alert('Datos importados correctamente.');
                onClose();
            }, 1000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setError('Error en la importación: ' + err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col justify-start pt-24 px-10">
            {/* Modal - Compact, Top Bar only */}
            <div className="relative pointer-events-auto bg-white dark:bg-zinc-900 rounded-lg shadow-2xl w-full h-[45vh] flex flex-col overflow-hidden border-2 border-green-500 dark:border-green-600 animate-in fade-in slide-in-from-top-10 duration-300">

                {/* Single Top Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600">
                            <Database size={16} />
                        </div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 hidden md:block">Importador</h2>

                        <div className="h-4 w-px bg-gray-300 mx-1 hidden md:block" />

                        <select
                            className="p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-blue-500"
                            value={entity}
                            onChange={(e) => {
                                setEntity(e.target.value);
                                setJsonInput('');
                                setParsedData(null);
                                setError(null);
                            }}
                        >
                            {Object.entries(ENTITY_CONFIG).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyPrompt}
                            className="flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 rounded text-[10px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 transition-colors"
                            title="Copiar Prompt para IA"
                        >
                            {copyFeedback ? <CheckCircle size={12} /> : <Copy size={12} />}
                            <span className="hidden sm:inline">{copyFeedback ? 'Copiado' : 'Prompt IA'}</span>
                        </button>

                        <button
                            onClick={handleUpload}
                            disabled={!parsedData || !!error || finished === 'uploading'}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                ${finished === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                            `}
                        >
                            {finished === 'uploading' ? (
                                <>
                                    <span className="animate-spin">⏳</span> Subiendo...
                                </>
                            ) : (
                                <>
                                    {entity === 'tasks' ? <Play size={12} /> : <Upload size={12} />}
                                    {entity === 'tasks' ? 'Previsualizar' : 'Subir'}
                                </>
                            )}
                        </button>

                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors ml-1">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content - Just the Text Area */}
                <div className="flex-1 p-0 relative group">
                    <textarea
                        className={`w-full h-full p-4 border-none resize-none bg-white dark:bg-zinc-900 focus:ring-0 text-xs font-mono text-gray-700 dark:text-gray-300 leading-relaxed`}
                        placeholder='Pega aquí el JSON generado por la IA...'
                        value={jsonInput}
                        onChange={handleJsonChange}
                        spellCheck={false}
                    />

                    {/* Floating Status Indicators inside the text area */}
                    <div className="absolute bottom-3 right-3 pointer-events-none flex gap-2">
                        {parsedData && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold shadow-sm backdrop-blur-md opacity-90">JSON Válido ({Array.isArray(parsedData) ? parsedData.length : 'Jerarquía'})</span>}
                        {error && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold shadow-sm backdrop-blur-md opacity-90">Error de Sintaxis</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonImporterModal;
