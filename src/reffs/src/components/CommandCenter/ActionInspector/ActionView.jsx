import React from 'react';
import { Box } from 'lucide-react';
import EvidenceUploader from '../../common/EvidenceUploader';

const ActionView = ({
    panelMode,
    actionForm,
    handleActionChange,
    handleActionCompletionToggle,
    staffers
}) => {
    return (
        <div className="p-4 h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-4">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1 mb-2">
                    <Box size={14} className="text-blue-600" />
                    {panelMode === 'create' ? 'Nueva Acción' : 'Editar Acción'}
                </h3>

                {/* Description */}
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción</label>
                    <input
                        type="text"
                        value={actionForm.description || ''}
                        onChange={(e) => handleActionChange('description', e.target.value)}
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                        placeholder="Describe la acción..."
                    />
                </div>

                {/* Evidence Uploader (Action) */}
                <div>
                    <EvidenceUploader
                        currentUrl={actionForm.evidence_url}
                        onUpload={(url) => handleActionChange('evidence_url', url)}
                        pathPrefix="action"
                        label="Evidencia de Acción"
                    />
                </div>

                <div className={`transition-opacity duration-200 ${actionForm.completed ? 'opacity-70' : ''}`}>
                    <label className={`flex items-center gap-2 cursor-pointer bg-white border rounded px-3 py-2 transition-all ${actionForm.completed ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-400'}`}>
                        <input
                            type="checkbox"
                            checked={actionForm.completed || false}
                            onChange={handleActionCompletionToggle}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                        />
                        <div className="flex flex-col">
                            <span className={`text-xs font-bold uppercase ${actionForm.completed ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                                {actionForm.completed ? 'Acción Completada' : 'Marcar Completada'}
                            </span>
                            <span className="text-[9px] text-gray-400">
                                {actionForm.completed ? 'Esta acción ha sido finalizada' : 'Haga clic para finalizar'}
                            </span>
                        </div>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Executor */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ejecutor</label>
                        <div className="flex gap-2">
                            <select
                                value={actionForm.executor_id || ''}
                                onChange={(e) => handleActionChange('executor_id', e.target.value)}
                                className="flex-1 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs appearance-none"
                            >
                                <option value="">- Seleccionar -</option>
                                {staffers.map((s, idx) => (
                                    <option key={s.id || idx} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* External Executor Text (Optional backup) */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ejecutor Externo (Opcional)</label>
                        <input
                            type="text"
                            value={actionForm.ejecutor_texto || ''}
                            onChange={(e) => handleActionChange('ejecutor_texto', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs"
                            placeholder="Nombre externo..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fecha Ejecución</label>
                        <input
                            type="date"
                            value={actionForm.fecha_ejecucion || ''}
                            onChange={(e) => handleActionChange('fecha_ejecucion', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fecha Fin</label>
                        <input
                            type="date"
                            value={actionForm.fecha_fin || ''}
                            onChange={(e) => handleActionChange('fecha_fin', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs"
                        />
                    </div>
                </div>

                {/* Approvals */}
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Aprobaciones Requeridas</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded px-3 py-1.5 hover:bg-white transition-colors">
                            <input
                                type="checkbox"
                                checked={actionForm.requiere_aprobacion_ronald || false}
                                onChange={(e) => handleActionChange('requiere_aprobacion_ronald', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                            />
                            <span className="text-xs text-gray-700">Ronald</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded px-3 py-1.5 hover:bg-white transition-colors">
                            <input
                                type="checkbox"
                                checked={actionForm.requiere_aprobacion_wiet || false}
                                onChange={(e) => handleActionChange('requiere_aprobacion_wiet', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                            />
                            <span className="text-xs text-gray-700">Wiet</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded px-3 py-1.5 hover:bg-white transition-colors">
                            <input
                                type="checkbox"
                                checked={actionForm.requiere_aprobacion_alejo || false}
                                onChange={(e) => handleActionChange('requiere_aprobacion_alejo', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                            />
                            <span className="text-xs text-gray-700">Alejo</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionView;
