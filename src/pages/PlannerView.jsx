import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    X, ClipboardList, Plus, Database, Trash2,
    Link as LinkIcon, AlertCircle, Folder, Table, Zap, FileText
} from 'lucide-react';

// Layout & Context
import { useAuth } from '../context/AuthContext';
import { usePlannerLogic } from './Esquemas/usePlannerLogic';

// Components
import BimImplementationPlanner from '../components/BIM/BimImplementationPlanner';
import BimFolderExplorer from '../components/BIM/BimFolderExplorer';
import BimFolderAssistant from '../components/BIM/BimFolderAssistant';
import { generateImplementationBat, generateCloudReport } from '../utils/batGenerator';
import { useSearchParams } from 'react-router-dom';




export default function PlannerView() {
    const { t } = useTranslation();
    const { isAdmin, isBimManager } = useAuth();
    const { schemaId } = useParams(); // URL uses schemaId but here it will be planId
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');
    const navigate = useNavigate();

    const { state, handlers } = usePlannerLogic(schemaId, isAdmin, projectId);

    const {
        plans, activePlan, isLoading, isSaving, isDirty, esquemas
    } = state;

    const {
        handleCreatePlan, handleConnectSchema, handleUpdatePlanNode, handleDeletePlan
    } = handlers;

    const [activeTab, setActiveTab] = useState('planner'); // 'planner' or 'explorer'
    const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');
    const [selectedSchemaForNewPlan, setSelectedSchemaForNewPlan] = useState(null);

    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

    const onCreatePlan = async () => {
        if (!newPlanName) return;
        const plan = await handleCreatePlan(newPlanName, newPlanDesc, projectId);
        if (plan && selectedSchemaForNewPlan) {
            await handleConnectSchema(plan.id, selectedSchemaForNewPlan);
        }
        setIsNewPlanModalOpen(false);
        setNewPlanName('');
        setNewPlanDesc('');
        setSelectedSchemaForNewPlan(null);
        if (plan) navigate(`/planner/${plan.id}${projectId ? `?projectId=${projectId}` : ''}`);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#fcf9f4] overflow-auto font-mono">
            {!activePlan ? (
                /* Plan Dashboard ... (Unchanged list view) */
                <div className="flex-1 flex flex-col p-8 overflow-auto">
                    {/* (List implementation remains the same) */}
                    <div className="flex justify-between items-center mb-8 border-b-4 border-[#1c1c19] pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#0f4369] text-white flex items-center justify-center shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
                                <ClipboardList size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter">BIM PLAN IMPLEMENTACION BIM</h1>
                                <p className="text-xs tracking-[4px] text-[#72777f] mt-1">INSTANCE_MANAGER // VER. 1.0</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {projectId && (
                                <button
                                    onClick={() => navigate(`/pre-bep?projectId=${projectId}`)}
                                    className="flex items-center gap-2 bg-amber-400 text-[#1c1c19] border-2 border-[#1c1c19] px-8 py-3 font-black tracking-widest uppercase shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-y-1 hover:shadow-none transition-all"
                                >
                                    <FileText size={20} />
                                    PRE BEP
                                </button>
                            )}
                            {isBimManager && (
                                <button
                                    onClick={() => setIsNewPlanModalOpen(true)}
                                    className="flex items-center gap-2 bg-[#1c1c19] text-[#fcf9f4] border-2 border-[#1c1c19] px-8 py-3 font-black tracking-widest uppercase shadow-[4px_4px_0_0_rgba(15,67,105,1)] hover:translate-y-1 hover:shadow-none transition-all"
                                >
                                    <Plus size={20} />
                                    NUEVO PLAN
                                </button>
                            )}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 opacity-40">
                            <div className="w-10 h-10 border-4 border-[#1c1c19] border-t-transparent rounded-full animate-spin mb-4" />
                            <span className="uppercase tracking-[5px] text-[10px] font-black">Syncing with server...</span>
                        </div>
                    ) : plans.length === 0 ? (
                        <div className="text-center p-20 border-[4px] border-dashed border-[#1c1c19]/20">
                            <AlertCircle size={48} className="mx-auto text-[#72777f] mb-4" />
                            <p className="font-black tracking-[4px] uppercase text-sm mb-2">No hay planes activos</p>
                            <p className="text-[10px] text-[#72777f] uppercase">Crea un nuevo plan de implementación para comenzar la conexión de ecosistemas.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.map(plan => (
                                <div
                                    key={plan.id}
                                    onClick={() => navigate(`/planner/${plan.id}`)}
                                    className="bg-white border-[3px] border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(28,28,25,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer transition-all flex flex-col group relative overflow-hidden"
                                >
                                    {plan.schema_id && (
                                        <div className="absolute top-0 right-0 bg-[#0f4369] text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                                            VINCULADO: {plan.schema?.name}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mb-6 mt-4">
                                        <div className="w-10 h-10 bg-[#f6f3ee] border-2 border-[#1c1c19] flex items-center justify-center shrink-0">
                                            <Database size={18} className="text-[#0f4369]" />
                                        </div>
                                        <h3 className="font-black uppercase tracking-tight text-lg leading-none">{plan.name}</h3>
                                    </div>

                                    <p className="text-[10px] text-[#72777f] mb-6 line-clamp-2 uppercase leading-relaxed tracking-wider">
                                        {plan.description || "SIN DESCRIPCIÓN TÉCNICA."}
                                    </p>

                                    <div className="mt-auto flex justify-between items-center border-t-2 border-[#1c1c19]/10 pt-4">
                                        <span className="text-[9px] font-black opacity-40">ID: {plan.id.substring(0, 8)}</span>
                                        <div className="flex items-center gap-3">
                                            {isBimManager && (
                                                <button
                                                    onClick={(e) => handleDeletePlan(e, plan.id)}
                                                    className="p-1 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            <span className="text-[#0f4369] text-[10px] font-black group-hover:translate-x-1 transition-transform">IR AL PLAN &rarr;</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Active Plan View */
                <div className="flex-1 flex flex-col h-full relative">
                    {/* Internal Navigation Header */}
                    {!searchParams.get('embedded') && (
                    <div className="z-[160] flex items-center justify-between p-4 bg-white border-b-2 border-[#1c1c19] no-print">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/planner')}
                                className="px-4 py-2 bg-[#ba1a1a] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 group"
                            >
                                <X size={14} className="group-hover:rotate-90 transition-transform" />
                                VOLVER
                            </button>

                            <div className="flex items-center gap-4 border-l-2 border-[#1c1c19]/10 pl-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black opacity-40 leading-none uppercase">Plan Activo</span>
                                    <span className="text-[12px] font-black uppercase tracking-[2px]">{activePlan.name}</span>
                                </div>

                                {activePlan.schema_id && (
                                    <div className="flex flex-col border-l-2 border-[#1c1c19]/10 pl-4">
                                        <span className="text-[8px] font-black text-[#0f4369] leading-none uppercase">Vinculado a</span>
                                        <span className="text-[10px] font-black tracking-widest uppercase">{activePlan.schema?.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex bg-[#f6f3ee] border-2 border-[#1c1c19] p-1">
                            <button
                                onClick={() => setActiveTab('planner')}
                                className={`px-6 py-2 text-[10px] font-black uppercase tracking-[2px] flex items-center gap-2 transition-all ${activeTab === 'planner' ? 'bg-[#1c1c19] text-white shadow-inner' : 'text-[#1c1c19] hover:bg-gray-200'}`}
                            >
                                <Table size={14} />
                                Planificación
                            </button>
                            <button
                                onClick={() => setActiveTab('explorer')}
                                className={`px-6 py-2 text-[10px] font-black uppercase tracking-[2px] flex items-center gap-2 transition-all ${activeTab === 'explorer' ? 'bg-[#1c1c19] text-white shadow-inner' : 'text-[#1c1c19] hover:bg-gray-200'}`}
                            >
                                <Folder size={14} />
                                Explorador
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {activePlan.schema_id && (
                                <button
                                    onClick={() => setIsAssistantOpen(true)}
                                    className="px-4 py-2 bg-amber-400 text-[#1c1c19] border-2 border-[#1c1c19] text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 group"
                                >
                                    <Zap size={14} fill="currentColor" className="group-hover:animate-pulse" />
                                    ASISTENTE DE CREACIÓN
                                </button>
                            )}
                            {projectId && (
                                <button
                                    onClick={() => navigate(`/pre-bep?projectId=${projectId}`)}
                                    className="px-4 py-2 bg-amber-400 text-[#1c1c19] border-2 border-[#1c1c19] text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 group"
                                >
                                    <FileText size={14} />
                                    PRE BEP
                                </button>
                            )}
                        </div>
                    </div>
                    )}

                    <div className="flex-1 w-full h-full p-0 bg-[#f6f3ee] flex flex-col items-center overflow-auto">
                        {activePlan.schema_id ? (
                            <div className="w-full h-full">
                                {activeTab === 'planner' ? (
                                    <BimImplementationPlanner
                                        mapData={activePlan.merged_data}
                                        title={activePlan.name}
                                        onUpdateNode={handleUpdatePlanNode}
                                        isAdmin={isAdmin}
                                    />
                                ) : (
                                    <div className="w-full max-w-5xl h-full mx-auto p-6 pt-10">
                                        <BimFolderExplorer
                                            mapData={activePlan.merged_data}
                                            title={activePlan.name}
                                            isStatic={searchParams.get('static') === 'true'}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1 p-20 text-center">
                                <div className="w-20 h-20 border-4 border-[#1c1c19] border-dashed rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <LinkIcon size={32} className="text-[#1c1c19]/30" />
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-[4px] mb-4">Plan sin estructura</h2>
                                <p className="text-[10px] uppercase text-[#72777f] max-w-sm leading-relaxed mb-10">
                                    Este plan aún no tiene una estructura de datos asociada. Debes vincular un esquema del módulo "ESQUEMAS" para generar el árbol de implementación.
                                </p>
                                <button
                                    onClick={() => setIsConnectModalOpen(true)}
                                    className="bg-[#1c1c19] text-white border-2 border-[#1c1c19] px-10 py-4 font-black uppercase tracking-[3px] shadow-[8px_8px_0_0_rgba(15,67,105,1)] hover:translate-y-1 hover:shadow-none transition-all"
                                >
                                    ELEGIR ECOSISTEMA BASE
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Status Overlay */}
                    {(isSaving || isDirty) && (
                        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-white border-2 border-[#1c1c19] p-3 shadow-[6px_6px_0_0_rgba(28,28,25,1)] animate-in slide-in-from-bottom-10 duration-500">
                            <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-ping' : 'bg-red-500'}`} />
                            <span className="text-[9px] font-black uppercase tracking-[2px]">
                                {isSaving ? 'SYNCHRONIZING_CLDS...' : 'PENDING_COMMIT'}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Folder Assistant Modal */}
            <BimFolderAssistant
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                mapData={activePlan?.merged_data}
                planName={activePlan?.name}
                onDownloadBat={() => generateImplementationBat(activePlan?.merged_data, activePlan?.name)}
                onDownloadCloud={() => generateCloudReport(activePlan?.merged_data, activePlan?.name)}
            />

            {/* New Plan Modal */}
            {isNewPlanModalOpen && (
                <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#fcf9f4] border-4 border-[#1c1c19] w-full max-w-md shadow-[16px_16px_0_0_rgba(28,28,25,1)] overflow-hidden">
                        <div className="bg-[#1c1c19] text-white p-6 flex justify-between items-center">
                            <h2 className="font-black uppercase tracking-[4px] text-lg">NEW_BIM_PLAN</h2>
                            <button onClick={() => setIsNewPlanModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest">NOMBRE DEL PLAN</label>
                                <input
                                    autoFocus
                                    className="bg-white border-2 border-[#1c1c19] p-4 text-xs font-mono uppercase focus:border-[#0f4369] outline-none"
                                    placeholder="EJ: PLAN DE IMPLEMENTACIÓN - FASE A"
                                    value={newPlanName}
                                    onChange={(e) => setNewPlanName(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
                                    VINCULAR ECOSISTEMA BASE (OPCIONAL)
                                    <Database size={10} className={selectedSchemaForNewPlan ? "text-green-600" : "text-gray-400"} />
                                </label>
                                <select
                                    className="bg-white border-2 border-[#1c1c19] p-4 text-[10px] font-mono uppercase focus:border-[#0f4369] outline-none cursor-pointer"
                                    onChange={(e) => {
                                        const esq = esquemas.find(s => s.id === e.target.value);
                                        setSelectedSchemaForNewPlan(esq || null);
                                    }}
                                    value={selectedSchemaForNewPlan?.id || ""}
                                >
                                    <option value="">- SIN VINCULAR -</option>
                                    {esquemas.map(esq => (
                                        <option key={esq.id} value={esq.id}>{esq.name}</option>
                                    ))}
                                </select>
                                {selectedSchemaForNewPlan && (
                                    <p className="text-[8px] text-green-600 font-black uppercase tracking-widest">
                                        &rarr; SE VINCULARÁ LA ESTRUCTURA DE "{selectedSchemaForNewPlan.name}"
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest">DESCRIPCIÓN (OPCIONAL)</label>
                                <textarea
                                    className="bg-white border-2 border-[#1c1c19] p-4 text-xs font-mono focus:border-[#0f4369] outline-none h-32 resize-none"
                                    placeholder="Detalles sobre el alcance de este plan..."
                                    value={newPlanDesc}
                                    onChange={(e) => setNewPlanDesc(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={onCreatePlan}
                                disabled={!newPlanName}
                                className="bg-[#1c1c19] text-white py-4 font-black uppercase tracking-[4px] hover:bg-[#0f4369] transition-all disabled:opacity-50"
                            >
                                CREAR INSTANCIA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connect Schema Modal */}
            {isConnectModalOpen && (
                <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#fcf9f4] border-4 border-[#1c1c19] w-full max-w-2xl shadow-[16px_16px_0_0_rgba(28,28,25,1)] flex flex-col max-h-[80vh]">
                        <div className="bg-[#0f4369] text-white p-6 flex justify-between items-center">
                            <h2 className="font-black uppercase tracking-[4px] text-lg flex items-center gap-3">
                                <Database size={20} />
                                SELECCIONAR ECOSISTEMA BASE
                            </h2>
                            <button onClick={() => setIsConnectModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="p-8 overflow-y-auto">
                            <p className="text-[10px] uppercase tracking-widest mb-6 opacity-60">
                                Elige un esquema de la librería para generar la estructura de carpetas y links.
                            </p>
                            <div className="grid grid-cols-1 gap-4">
                                {esquemas.map(esq => (
                                    <div
                                        key={esq.id}
                                        onClick={() => { handleConnectSchema(activePlan.id, esq); setIsConnectModalOpen(false); }}
                                        className="group flex items-center justify-between p-4 bg-white border-2 border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all cursor-pointer shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                                    >
                                        <div className="flex flex-col text-[#1c1c19] group-hover:text-white transition-colors">
                                            <span className="font-black uppercase tracking-tight text-sm">{esq.name}</span>
                                            <span className="text-[9px] font-mono opacity-40 group-hover:opacity-60 uppercase">Ecosistema Base</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">VINCULAR &rarr;</span>
                                    </div>
                                ))}
                            </div>
                            {esquemas.length === 0 && (
                                <p className="text-center py-10 text-[10px] uppercase font-black opacity-40">No hay esquemas disponibles.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
