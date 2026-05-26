import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { handleNativePrint } from '../../utils/printUtils';
import { FileText, Search, User, Calendar, Tag, Edit, Plus, Save, X, Bold, Italic, Type, List, Link, Eye, Code, Download } from 'lucide-react';
import { getProtocols, getProtocolCategories, createProtocol, updateProtocol } from '../../services/protocolsService';
import { getStaffers } from '../../services/spacesService';
import ReactMarkdown from 'react-markdown';
import PrintButton from '../common/PrintButton';

const ProtocolsView = () => {
    const [protocols, setProtocols] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProtocol, setSelectedProtocol] = useState(null);
    const [staff, setStaff] = useState([]);
    const navigate = useNavigate();
    const { protocolName } = useParams();
    const isFirstLoad = useRef(true);

    // Creation/Editing State
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newProtocol, setNewProtocol] = useState({
        Nombre: '',
        Categoria: '',
        Contenido: '',
        Editor: ''
    });
    const [viewMode, setViewMode] = useState('code'); // 'code' | 'visual'

    useEffect(() => {
        loadData();
    }, []);

    // Selection logic based on URL
    useEffect(() => {
        if (protocols.length > 0 && protocolName) {
            // Reverse underscore back to space for matching
            const decodedName = decodeURIComponent(protocolName).replace(/_/g, ' ');
            const protocol = protocols.find(p => p.Nombre === decodedName);
            if (protocol && (!selectedProtocol || selectedProtocol.id !== protocol.id)) {
                setSelectedProtocol(protocol);
            }
        } else if (protocols.length > 0 && !protocolName && selectedProtocol) {
            setSelectedProtocol(null);
        }
    }, [protocolName, protocols]);

    const handleSelectProtocol = (protocol) => {
        setSelectedProtocol(protocol);
        if (protocol) {
            // Replace spaces with underscores for the URL
            const urlName = encodeURIComponent(protocol.Nombre.replace(/ /g, '_'));
            navigate(`/protocols/${urlName}`);
        } else {
            navigate('/protocols');
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [protocolsData, categoriesData, staffData] = await Promise.all([
                getProtocols(),
                getProtocolCategories(),
                getStaffers()
            ]);
            setProtocols(protocolsData || []);
            setCategories(categoriesData || []);
            setStaff(staffData || []);
        } catch (error) {
            console.error('Error loading protocols:', error);
        } finally {
            setLoading(false);
        }
    };
    const contentRef = useRef(null);

    const insertMarkdown = (prefix, suffix = '') => {
        if (!contentRef.current) return;

        const textarea = contentRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = newProtocol.Contenido;
        const selection = text.substring(start, end);

        const before = text.substring(0, start);
        const after = text.substring(end);

        const newText = before + prefix + selection + suffix + after;

        setNewProtocol({ ...newProtocol, Contenido: newText });

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + selection.length + suffix.length;
            textarea.setSelectionRange(
                selection.length > 0 ? start + prefix.length : newCursorPos,
                newCursorPos
            );
        }, 0);
    };

    const filteredProtocols = protocols.filter(protocol => {
        const matchesSearch = protocol.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            protocol.Contenido?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || protocol.Categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleStartCreate = () => {
        setIsCreating(true);
        setIsEditing(false);
        handleSelectProtocol(null);
        setNewProtocol({ Nombre: '', Categoria: '', Contenido: '', Editor: '' });
        setViewMode('code');
    };

    const handleStartEdit = () => {
        if (!selectedProtocol) return;
        setNewProtocol({
            Nombre: selectedProtocol.Nombre,
            Categoria: selectedProtocol.Categoria,
            Contenido: selectedProtocol.Contenido || '',
            Editor: selectedProtocol.Editor || ''
        });
        setIsEditing(true);
        setIsCreating(false);
        setViewMode('code');
    };

    const handleCancelCreate = () => {
        setIsCreating(false);
        setIsEditing(false);
        setNewProtocol({ Nombre: '', Categoria: '', Contenido: '', Editor: '' });
    };

    const handleSaveProtocol = async () => {
        if (!newProtocol.Nombre.trim()) return alert('El nombre es obligatorio');

        setSaving(true);
        const protocolToSave = {
            ...newProtocol,
            FechaUpdate: new Date().toISOString()
        };

        try {
            if (isEditing && selectedProtocol) {
                const updated = await updateProtocol(selectedProtocol.id, protocolToSave);
                setProtocols(protocols.map(p => p.id === updated.id ? updated : p));
                setCategories([...new Set([...categories, updated.Categoria].filter(Boolean))].sort());
                setIsEditing(false);
                handleSelectProtocol(updated);
            } else {
                const created = await createProtocol(protocolToSave);
                setProtocols([created, ...protocols]);
                setCategories([...new Set([...categories, created.Categoria].filter(Boolean))].sort());
                setIsCreating(false);
                handleSelectProtocol(created);
            }
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-full flex bg-white">
            {/* LEFT: Protocols List */}
            <div className="w-96 border-r border-gray-200 flex flex-col no-print">
                {/* Header */}
                <div className="p-3 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Protocolos
                        </span>
                        <button
                            onClick={handleStartCreate}
                            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Nuevo Protocolo"
                        >
                            <Plus size={16} />
                        </button>
                    </h2>

                    {/* Search */}
                    <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar protocolos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="mb-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <p className="text-xs text-gray-600">
                        {filteredProtocols.length} protocolos
                    </p>
                </div>

                {/* Protocols List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                    ) : filteredProtocols.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No se encontraron protocolos
                        </div>
                    ) : (
                        filteredProtocols.map((protocol) => (
                            <button
                                key={protocol.id}
                                onClick={() => handleSelectProtocol(protocol)}
                                className={`
                                    w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-blue-50 transition-colors
                                    ${selectedProtocol?.id === protocol.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                                `}
                            >
                                <div className="font-semibold text-[13px] text-gray-900 truncate">
                                    {protocol.Nombre}
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{protocol.Categoria || 'Sin categoría'}</span>
                                    <span>{formatDate(protocol.FechaUpdate)}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: Protocol Details or Create/Edit Form */}
            <div className="flex-1 flex flex-col">
                {isCreating || isEditing ? (
                    <div className="flex flex-col h-full bg-white">
                        {/* Create/Edit Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                {isEditing ? 'Editar Protocolo' : 'Nuevo Protocolo'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancelCreate}
                                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <X size={16} /> Cancelar
                                </button>
                                <button
                                    onClick={handleSaveProtocol}
                                    disabled={saving}
                                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : <><Save size={16} /> Guardar</>}
                                </button>
                            </div>
                        </div>

                        {/* Create Form */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título del Protocolo</label>
                                <input
                                    type="text"
                                    value={newProtocol.Nombre}
                                    onChange={e => setNewProtocol({ ...newProtocol, Nombre: e.target.value })}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="Ej: Protocolo de Seguridad..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Categoría</label>
                                    <input
                                        list="categories-list"
                                        type="text"
                                        value={newProtocol.Categoria}
                                        onChange={e => setNewProtocol({ ...newProtocol, Categoria: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        placeholder="Selecciona o escribe..."
                                    />
                                    <datalist id="categories-list">
                                        {categories.map(cat => <option key={cat} value={cat} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Editor (Staff)</label>
                                    <select
                                        value={newProtocol.Editor}
                                        onChange={e => setNewProtocol({ ...newProtocol, Editor: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option value="">Seleccionar editor...</option>
                                        {staff.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Contenido (Markdown soportado)</label>

                                {/* Toolbar */}
                                <div className="flex items-center justify-between p-1 bg-gray-50 border border-b-0 border-gray-300 rounded-t-lg">
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown('**', '**')}
                                            disabled={viewMode === 'visual'}
                                            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all disabled:opacity-30"
                                            title="Negrita"
                                        >
                                            <Bold size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown('_', '_')}
                                            disabled={viewMode === 'visual'}
                                            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all disabled:opacity-30"
                                            title="Cursiva"
                                        >
                                            <Italic size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-gray-300 mx-1" />
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown('# ')}
                                            disabled={viewMode === 'visual'}
                                            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all flex items-center gap-0.5 disabled:opacity-30"
                                            title="Título 1"
                                        >
                                            <Type size={16} /><span className="text-[10px] font-bold">1</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown('## ')}
                                            disabled={viewMode === 'visual'}
                                            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all flex items-center gap-0.5 disabled:opacity-30"
                                            title="Título 2"
                                        >
                                            <Type size={16} /><span className="text-[10px] font-bold">2</span>
                                        </button>
                                        <div className="w-px h-4 bg-gray-300 mx-1" />
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown('- ')}
                                            disabled={viewMode === 'visual'}
                                            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all disabled:opacity-30"
                                            title="Lista"
                                        >
                                            <List size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown('[', '](url)')}
                                            disabled={viewMode === 'visual'}
                                            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700 transition-all disabled:opacity-30"
                                            title="Enlace"
                                        >
                                            <Link size={16} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1 mr-1">
                                        <div className="flex bg-gray-200 p-0.5 rounded-md">
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('code')}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[11px] font-bold transition-all ${viewMode === 'code' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <Code size={14} /> CÓDIGO
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('visual')}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[11px] font-bold transition-all ${viewMode === 'visual' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <Eye size={14} /> VISUAL
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative flex-1">
                                    {viewMode === 'code' ? (
                                        <textarea
                                            ref={contentRef}
                                            value={newProtocol.Contenido}
                                            onChange={e => setNewProtocol({ ...newProtocol, Contenido: e.target.value })}
                                            className="w-full h-96 px-3 py-2 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                            placeholder="# Título Principal&#10;&#10;Contenido del protocolo..."
                                        />
                                    ) : (
                                        <div
                                            id="protocol-editor-preview"
                                            className="w-full h-96 px-6 py-4 border border-gray-300 border-t-0 rounded-b-lg bg-white overflow-y-auto prose prose-sm max-w-none"
                                        >
                                            <ReactMarkdown>
                                                {newProtocol.Contenido || '*Sin contenido para mostrar*'}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : selectedProtocol ? (
                    <div id="protocols-view-print-view" className="flex-1 flex flex-col h-full print-container">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white print:border-none">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                        <FileText size={24} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-0.5">
                                            {selectedProtocol.Nombre}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                                            {selectedProtocol.Categoria && (
                                                <span className="flex items-center gap-1">
                                                    <Tag size={14} />
                                                    {selectedProtocol.Categoria}
                                                </span>
                                            )}
                                            {selectedProtocol.Editor && (
                                                <span className="flex items-center gap-1">
                                                    <User size={14} />
                                                    {selectedProtocol.Editor}
                                                </span>
                                            )}
                                            {selectedProtocol.FechaUpdate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {formatDate(selectedProtocol.FechaUpdate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 no-print">
                                    <button
                                        onClick={() => handleNativePrint('protocols-view-print-view', `Protocolo_${selectedProtocol?.Nombre}`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                                        title="Descargar PDF"
                                    >
                                        <Download size={16} />
                                        PDF
                                    </button>
                                    <button
                                        onClick={handleStartEdit}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        <Edit size={16} />
                                        Editar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content - Rendered as Markdown */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:text-gray-800">
                                <ReactMarkdown>
                                    {selectedProtocol.Contenido || 'Sin contenido'}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <FileText size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Selecciona un protocolo para ver detalles</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProtocolsView;

