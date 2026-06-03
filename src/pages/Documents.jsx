import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Plus, Search, FileText, Trash2, Edit3, Save, X, Printer, Download, Eye,
  ChevronRight, Calendar, Tag, User, Hash, AlertCircle, Loader2, Settings2,
  Maximize2, Minimize2, ZoomIn, ZoomOut, Type, ArrowUpRight, Receipt
} from 'lucide-react';

const PAGE_WIDTH = 816; // 8.5in * 96dpi
const PAGE_HEIGHT = 1056; // 11in * 96dpi
import { supabase } from '../services/supabaseClient';
import MarkdownEditor from '../components/ui/MarkdownEditor';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const Documents = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState(null); // Will store the ID of the active document
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('quote');
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState(0);
  const [editProjectId, setEditProjectId] = useState('GENERAL');

  const [docWidth, setDocWidth] = useState(8.5); // Still useful for print calculation
  const [docScale, setDocScale] = useState(0.85); // Interface zoom
  const [docFontSize, setDocFontSize] = useState(12); // Real content font size
  const [docMargin, setDocMargin] = useState(24); // Document margin in px

  const [isCreating, setIsCreating] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    type: 'quote',
    doc_date: new Date().toISOString().split('T')[0],
    content: '# Nuevo Documento\n\nComienza a escribir aquí...',
    amount: 0,
    project_id: projectId || 'GENERAL'
  });

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, projectId]);

  const fetchDocuments = async () => {
    if (!user) return;
    setIsLoading(true);
    let query = supabase
      .from('admin_documents')
      .select('*')
      .eq('user_id', user.id);
      
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
      
    const { data, error } = await query.order('doc_date', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments(data);
      if (data.length > 0) {
        if (!activeTab || !data.find(d => d.id === activeTab)) {
          setActiveTab(data[0].id);
        }
      } else {
        setActiveTab(null);
      }
    }
    setIsLoading(false);
  };

  const activeDoc = documents.find(doc => doc.id === activeTab);

  useEffect(() => {
    if (activeDoc) {
      setEditContent(activeDoc.content);
      setEditTitle(activeDoc.title || '');
      setEditType(activeDoc.type || 'quote');
      setEditDate(activeDoc.doc_date ? new Date(activeDoc.doc_date).toISOString().split('T')[0] : '');
      setEditAmount(activeDoc.amount || 0);
      setEditProjectId(activeDoc.project_id || 'GENERAL');
    }
  }, [activeDoc]);

  const handleSave = async () => {
    if (!activeDoc) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('admin_documents')
      .update({
        content: editContent,
        title: editTitle,
        type: editType,
        doc_date: editDate,
        amount: editAmount,
        project_id: editProjectId
      })
      .eq('id', activeDoc.id);

    if (error) {
      console.error('Error updating document:', error);
      alert("Error al guardar los cambios");
    } else {
      setIsEditing(false);
      await fetchDocuments();
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newDoc.title) {
      alert("Por favor ingresa un título");
      return;
    }
    if (!user) {
      alert("No hay sesión de usuario activa");
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('admin_documents')
      .insert([
        {
          title: newDoc.title,
          type: newDoc.type,
          doc_date: newDoc.doc_date,
          content: newDoc.content,
          project_id: newDoc.project_id || projectId || 'GENERAL',
          amount: newDoc.amount,
          user_id: user.id
        }
      ])
      .select();

    if (error) {
      console.error('Error creating document:', error);
      alert("Error al crear el documento");
    } else {
      setIsCreating(false);
      setNewDoc({
        title: '',
        type: 'quote',
        doc_date: new Date().toISOString().split('T')[0],
        content: '# Nuevo Documento\n\nComienza a escribir aquí...',
        amount: 0,
        project_id: projectId || 'GENERAL'
      });
      await fetchDocuments();
      if (data && data.length > 0) {
        setActiveTab(data[0].id);
      }
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!activeDoc) return;
    if (!window.confirm('¿Seguro que deseas eliminar este documento? Esta acción no se puede deshacer.')) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('admin_documents')
      .delete()
      .eq('id', activeDoc.id);

    if (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    } else {
      setActiveTab(null);
      await fetchDocuments();
    }
    setIsLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full bg-[#f6f3ee] text-[#1c1c19] overflow-hidden selection:bg-[#0f4369] selection:text-white print:bg-white print:h-auto print:overflow-visible w-full">
      <style>
        {`
          @media print {
            @page {
              size: letter;
              margin: 0;
            }
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .print-document {
              width: 8.5in !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            .print-content {
              width: 8.5in !important;
              transform: none !important;
            }
            /* Force page breaks for elements exceeding page height if needed */
            .page-break-marker {
              display: block;
              height: 0;
              page-break-after: always;
              border: none;
            }
          }
        `}
      </style>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row print:block print:overflow-visible">

        {/* LEFT SUBPANEL - Document Selection */}
        <div id="docs-archive-panel" className="print:hidden w-full md:w-80 border-r-2 border-[#1c1c19] bg-[#e5e2dd]/50 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b-2 border-[#1c1c19] bg-[#e5e2dd]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black tracking-widest uppercase">DOC_ARCHIVE</h2>
              <div className="w-2 h-2 rounded-full bg-[#0f4369] animate-pulse"></div>
            </div>
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f] group-focus-within:text-[#1c1c19] transition-colors" />
              <input
                type="text"
                placeholder="SEARCH_DOCS..."
                className="w-full bg-[#fcf9f4] border-2 border-[#1c1c19] py-2 pl-9 pr-3 text-[10px] font-bold focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_0_rgba(15,67,105,0.2)] transition-shadow"
              />
            </div>
          </div>

          <div className="p-3 space-y-2 flex-1">
            <div className="px-3 py-2">
              <span className="text-[10px] font-black text-[#72777f] uppercase tracking-tighter">PROJECT_ALEJANDRO_PATINO</span>
            </div>

            {isLoading && documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-[#72777f]">
                <Loader2 size={24} className="animate-spin mb-2" />
                <span className="text-[10px] font-black uppercase">LOADING_DOCS...</span>
              </div>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setActiveTab(doc.id);
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left group transition-all duration-200 ${activeTab === doc.id ? 'translate-x-[4px]' : ''}`}
                >
                  <div className={`p-4 border-2 transition-all duration-200 flex flex-col gap-2 relative overflow-hidden
                      ${activeTab === doc.id
                      ? 'bg-[#fcf9f4] border-[#1c1c19] shadow-[8px_8px_0_0_rgba(15,67,105,1)]'
                      : 'bg-transparent border-transparent hover:border-[#1c1c19]/30 hover:bg-[#fcf9f4]/50 hover:shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]'}
                    `}>
                    {activeTab === doc.id && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-[#0f4369] flex items-center justify-center -rotate-12 translate-x-2 -translate-y-2">
                        <ArrowUpRight size={14} className="text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {doc.type === 'invoice' ? (
                        <Receipt size={18} className={activeTab === doc.id ? 'text-[#0f4369]' : 'text-[#72777f]'} />
                      ) : (
                        <FileText size={18} className={activeTab === doc.id ? 'text-[#0f4369]' : 'text-[#72777f]'} />
                      )}
                      <span className={`text-[11px] font-black uppercase tracking-tight ${activeTab === doc.id ? 'text-[#1c1c19]' : 'text-[#72777f]'}`}>
                        {doc.title}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-bold text-[#72777f] text-ellipsis overflow-hidden whitespace-nowrap">{new Date(doc.doc_date).toLocaleDateString()} // {doc.project_id || 'GENERAL'}</span>
                      <span className={`text-[10px] font-black ${activeTab === doc.id ? 'text-[#0f4369]' : 'text-[#72777f]'}`}>
                        {doc.amount ? `$${(doc.amount / 1000000).toFixed(1)}M` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}

            <button
              id="add-doc-btn"
              onClick={() => {
                setIsCreating(true);
                setActiveTab(null);
              }}
              className="mt-8 border-2 border-dashed border-[#1c1c19]/20 p-4 flex flex-col items-center justify-center gap-2 w-full hover:border-[#1c1c19]/60 hover:bg-white/50 transition-all print:hidden"
            >
              <div className="w-8 h-8 rounded-full border-2 border-[#1c1c19]/20 flex items-center justify-center border-dashed">
                <span className="text-[10px] font-black text-[#1c1c19]/20">+</span>
              </div>
              <span className="text-[9px] font-black text-[#1c1c19]/20 uppercase">ADD_DOCUMENT</span>
            </button>
          </div>

          <div className="p-4 bg-[#1c1c19] text-[#e5e2dd]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-[10px] font-black tracking-widest uppercase italic">EN_CURSO</span>
            </div>
            <div className="text-[9px] leading-tight font-bold opacity-70 uppercase">
              PROYECTO: KENGO KUMA<br />
              ESTADO: TRANSICIÓN BIM
            </div>
          </div>
        </div>

        {/* MAIN VIEWER AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#fcf9f4] relative font-mono print:block print:overflow-visible print:bg-white print:p-0">

          {isCreating ? (
            <div className="max-w-4xl mx-auto h-full flex flex-col print:hidden">
              <div className="mb-12 border-b-2 border-[#1c1c19] pb-8">
                <div className="flex items-center gap-2 text-[#0f4369] mb-4">
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70 italic">NUEVO // CREACIÓN_DOCUMENTO</span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-[#1c1c19] uppercase mb-8">NUEVO_DOCUMENTO</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">DOC_TITLE</label>
                    <input
                      type="text"
                      value={newDoc.title}
                      onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                      placeholder="EJ: COTIZACIÓN_REMODELACIÓN..."
                      className="bg-white border-2 border-[#1c1c19] p-3 text-xs font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">DOC_TYPE</label>
                    <select
                      value={newDoc.type}
                      onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
                      className="bg-white border-2 border-[#1c1c19] p-3 text-xs font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all"
                    >
                      <option value="md">MARKDOWN (.MD)</option>
                      <option value="quote">COTIZACIÓN / PROPOSAL (MD)</option>
                      <option value="invoice">FACTURA / INVOICE (MD)</option>
                      <option value="pdf">PDF EXTERN (URL)</option>
                      <option value="gdoc">GOOGLE DOCS (URL)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">DOC_DATE</label>
                    <input
                      type="date"
                      value={newDoc.doc_date}
                      onChange={e => setNewDoc({ ...newDoc, doc_date: e.target.value })}
                      className="bg-white border-2 border-[#1c1c19] p-3 text-xs font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">AMOUNT (COP)</label>
                    <input
                      type="number"
                      value={newDoc.amount}
                      onChange={e => setNewDoc({ ...newDoc, amount: Number(e.target.value) })}
                      placeholder="0"
                      className="bg-white border-2 border-[#1c1c19] p-3 text-xs font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">PROJECT_ID</label>
                    <input
                      type="text"
                      value={newDoc.project_id}
                      onChange={e => setNewDoc({ ...newDoc, project_id: e.target.value.toUpperCase() })}
                      placeholder="GENERAL"
                      className="bg-white border-2 border-[#1c1c19] p-3 text-xs font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white border-2 border-[#1c1c19] p-8 shadow-[16px_16px_0_0_rgba(28,28,25,0.05)] mb-12 min-h-[600px]">
                {newDoc.type === 'pdf' || newDoc.type === 'gdoc' ? (
                  <div className="flex flex-col gap-2 h-full flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">DOCUMENT URL</label>
                    <input type="text" value={newDoc.content} onChange={e => setNewDoc({ ...newDoc, content: e.target.value })} placeholder="https://..." className="bg-[#fcf9f4] border-2 border-[#1c1c19] p-4 text-sm font-mono w-full" />
                    {newDoc.content && <iframe src={newDoc.content} className="w-full flex-1 border-2 border-[#1c1c19] mt-4 min-h-[500px]" />}
                  </div>
                ) : (
                  <MarkdownEditor
                    value={newDoc.content}
                    onChange={content => setNewDoc({ ...newDoc, content })}
                    isEditing={true}
                    height="500px"
                    className="flex-1"
                    fontSize="text-[12px]"
                  />
                )}
              </div>

              <div className="flex justify-end gap-4 mb-12">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-8 py-4 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-bold text-xs tracking-widest uppercase hover:bg-red-50 transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
                >
                  CANCELAR
                </button>
                <button
                  disabled={isLoading}
                  onClick={handleCreate}
                  className="px-8 py-4 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-bold text-xs tracking-widest uppercase hover:bg-[#1a5a8a] transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 flex items-center gap-3"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  CREATE_DOCUMENT
                </button>
              </div>
            </div>
          ) : !activeDoc ? (
            <div className="h-full flex flex-col items-center justify-center text-[#72777f] opacity-50 print:hidden">
              <FileText size={64} strokeWidth={1} className="mb-4" />
              <p className="font-black uppercase tracking-[0.2em] text-sm">SELECT_A_DOCUMENT_FROM_ARCHIVE</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {/* Header for Viewer */}
              <div id="doc-viewer-header" className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[#1c1c19] pb-8 relative z-10 print:hidden">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[#0f4369] mb-4">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70 italic whitespace-nowrap">
                      {isEditing ? 'EDITING' : 'VIEWER'} // {activeDoc.title}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase text-[#72777f]">TITLE</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="bg-white border-2 border-[#1c1c19] p-2 text-[10px] font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all uppercase"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase text-[#72777f]">TYPE</label>
                          <select
                            value={editType}
                            onChange={e => setEditType(e.target.value)}
                            className="bg-white border-2 border-[#1c1c19] p-2 text-[10px] font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all"
                          >
                            <option value="md">MARKDOWN (.MD)</option>
                            <option value="quote">COTIZACIÓN / PROPOSAL (MD)</option>
                            <option value="invoice">FACTURA / INVOICE (MD)</option>
                            <option value="pdf">PDF EXTERN (URL)</option>
                            <option value="gdoc">GOOGLE DOCS (URL)</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase text-[#72777f]">DATE</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            className="bg-white border-2 border-[#1c1c19] p-2 text-[10px] font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase text-[#72777f]">AMOUNT (COP)</label>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={e => setEditAmount(Number(e.target.value))}
                            className="bg-white border-2 border-[#1c1c19] p-2 text-[10px] font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase text-[#72777f]">PROJECT_ID</label>
                          <input
                            type="text"
                            value={editProjectId}
                            onChange={e => setEditProjectId(e.target.value.toUpperCase())}
                            className="bg-white border-2 border-[#1c1c19] p-2 text-[10px] font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all uppercase"
                          />
                        </div>
                      </div>

                      {/* Interactive Page Controls */}
                      <div className="flex flex-wrap items-center gap-8 p-3 bg-[#e5e2dd] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]">
                        <div className="flex-1 min-w-[200px] flex items-center gap-4">
                          <label className="text-[9px] font-black uppercase whitespace-nowrap">INTERFACE_ZOOM: {(docScale * 100).toFixed(0)}%</label>
                          <input
                            type="range"
                            min="0.3"
                            max="1.5"
                            step="0.05"
                            value={docScale}
                            onChange={e => setDocScale(Number(e.target.value))}
                            className="flex-1 accent-[#0f4369]"
                          />
                        </div>
                        <div className="flex-1 min-w-[200px] flex items-center gap-4">
                          <label className="text-[9px] font-black uppercase whitespace-nowrap flex items-center gap-2">
                            <Type size={10} /> FONT_SIZE: {docFontSize}px
                          </label>
                          <input
                            type="range"
                            min="8"
                            max="32"
                            step="1"
                            value={docFontSize}
                            onChange={e => setDocFontSize(Number(e.target.value))}
                            className="flex-1 accent-[#0f4369]"
                          />
                        </div>
                        <div className="flex-1 min-w-[200px] flex items-center gap-4">
                          <label className="text-[9px] font-black uppercase whitespace-nowrap flex items-center gap-2">
                            <Maximize2 size={10} /> MARGEN: {docMargin}px
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="96"
                            step="4"
                            value={docMargin}
                            onChange={e => setDocMargin(Number(e.target.value))}
                            className="flex-1 accent-[#0f4369]"
                          />
                        </div>
                        <button
                          onClick={() => { setDocScale(0.85); setDocFontSize(12); setDocMargin(24); }}
                          className="bg-white border-2 border-[#1c1c19] px-3 py-1 text-[8px] font-black uppercase hover:bg-[#fcf9f4]"
                        >
                          RESET_VIEW
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1c1c19] leading-none mb-2 text-left">
                        {activeDoc.type === 'quote' ? 'PROPOSAL_BIM' :
                          activeDoc.type === 'invoice' ? 'INVOICE_BIM' :
                            activeDoc.type === 'pdf' ? 'PDF_DOCUMENT' :
                              activeDoc.type === 'gdoc' ? 'GOOGLE_DOCUMENT' : 'MARKDOWN_DOC'}
                      </h1>
                      <div className="flex flex-wrap gap-4">
                        <p className="text-[#72777f] text-xs uppercase font-bold tracking-tight text-left">
                          Ref: {activeDoc.title} - {new Date(activeDoc.doc_date).toLocaleDateString()}
                        </p>
                        <p className="text-[#0f4369] text-xs uppercase font-black tracking-tight text-left">
                          Project: {activeDoc.project_id || 'GENERAL'}
                        </p>
                        <p className="text-[#1c1c19] text-xs uppercase font-black tracking-tight text-left">
                          Amount: {activeDoc.amount ? `$${activeDoc.amount.toLocaleString()} COP` : 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        disabled={isLoading}
                        onClick={() => {
                          setIsEditing(false);
                          setEditContent(activeDoc.content);
                        }}
                        className="px-6 py-3 bg-red-100 text-red-900 border-2 border-[#1c1c19] font-bold text-[10px] tracking-widest uppercase hover:bg-red-200 transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 disabled:opacity-50"
                      >
                        CANCEL_EDIT
                      </button>
                      <button
                        disabled={isLoading}
                        onClick={handleSave}
                        className="px-6 py-3 bg-green-600 text-white border-2 border-[#1c1c19] font-bold text-[10px] tracking-widest uppercase hover:bg-green-700 transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isLoading && <Loader2 size={12} className="animate-spin" />}
                        SAVE_CHANGES
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleDelete}
                        className="px-6 py-3 bg-white text-red-600 hover:text-white border-2 border-[#1c1c19] font-bold text-[10px] tracking-widest uppercase hover:bg-red-600 transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 flex items-center gap-2"
                        title="Eliminar Documento"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-3 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-bold text-[10px] tracking-widest uppercase hover:bg-[#e5e2dd] transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 flex items-center gap-2"
                      >
                        EDIT_DOC
                      </button>
                      <button
                        id="doc-print-btn"
                        onClick={handlePrint}
                        title="Print Document"
                        className="p-3 border-2 border-[#1c1c19] hover:bg-[#0f4369] hover:text-white transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
                      >
                        <Printer size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Document Content - Desk view */}
              <div className="flex-1 bg-[#f0f2f5] overflow-auto p-12 print:hidden custom-scrollbar">

                {((isEditing ? editType : activeDoc.type) === 'pdf' || (isEditing ? editType : activeDoc.type) === 'gdoc') ? (
                  <div className="mx-auto w-full max-w-5xl h-full flex flex-col gap-4">
                    {isEditing && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">DOCUMENT URL</label>
                        <input type="text" value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="https://..." className="bg-white border-2 border-[#1c1c19] p-4 text-sm font-mono w-full shadow-[4px_4px_0_0_rgba(28,28,25,1)]" />
                      </div>
                    )}
                    <iframe src={isEditing ? editContent : activeDoc.content} className="w-full flex-1 border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] bg-white min-h-[800px]" title="Document Viewer" />
                  </div>
                ) : (
                  <div
                    className="mx-auto bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] transition-all duration-300 relative"
                    style={{
                      width: `${PAGE_WIDTH}px`,
                      transform: `scale(${docScale})`,
                      transformOrigin: 'top center',
                      marginBottom: '100px',
                      minHeight: `${PAGE_HEIGHT}px`
                    }}
                  >

                    <div
                      className="flex-1 flex flex-col break-words hyphens-auto relative bg-white"
                      style={{
                        padding: `${docMargin}px`,
                        minHeight: `${PAGE_HEIGHT}px`,
                      }}
                    >




                      {/* Page boundary marker */}
                      <div
                        className="absolute left-0 right-0 border-b-2 border-dashed border-red-500/30 pointer-events-none"
                        style={{ top: `${PAGE_HEIGHT}px` }}
                      >


                        <span className="absolute right-[-120px] top-[-10px] bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold uppercase">PAGE_LIMIT_1</span>
                      </div>
                      <div className="mt-1 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative z-8">
                        <div className="flex flex-col gap-2">
                          <div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 border-2 border-[#1c1c19] flex items-center justify-center font-black text-xl bg-[#1c1c19] text-white">R</div>
                            <div className="flex flex-col text-left">
                              <span style={{ fontSize: `${docFontSize * 0.8}px` }} className="font-black text-[#1c1c19] uppercase tracking-widest leading-none mb-1">REVIEW</span>
                              <span style={{ fontSize: `${docFontSize * 0.6}px` }} className="font-bold text-[#1c1c19]/60 uppercase leading-none tracking-tighter">BIM_MANAGEMENT_SYSTEM</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p style={{ fontSize: `${docFontSize * 0.8}px` }} className="font-black text-[#1c1c19] uppercase tracking-[0.2em] opacity-40 italic">ARCA</p>
                          <div className="px-4 py-2 bg-white border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
                            <span style={{ fontSize: `${docFontSize}px` }} className="font-black text-[#1c1c19] uppercase tracking-tighter">REVIEW</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 print:block h-full flex flex-col">

                        <MarkdownEditor
                          value={isEditing ? editContent : activeDoc.content}
                          onChange={setEditContent}
                          isEditing={isEditing}
                          height="auto"
                          className="print:border-none print:shadow-none"
                          fontSize={docFontSize}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Print Version (Isolated from Desk view) */}
              <div className="hidden print:block bg-white w-full">
                {((isEditing ? editType : activeDoc.type) === 'pdf' || (isEditing ? editType : activeDoc.type) === 'gdoc') ? (
                  <div className="text-center p-8 border-2 border-dashed border-[#1c1c19]">
                    <h2 className="text-xl font-black uppercase mb-4">EXTERNAL DOCUMENT</h2>
                    <p className="text-sm">This is an external {(isEditing ? editType : activeDoc.type).toUpperCase()} document.</p>
                    <a href={isEditing ? editContent : activeDoc.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {isEditing ? editContent : activeDoc.content}
                    </a>
                  </div>
                ) : (
                  <div className="print-document bg-white mx-auto">
                    <div className="print-content bg-white min-h-[11in]" style={{ padding: `${docMargin}px` }}>
                      <div className="mt-1 mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative z-8">
                        <div className="flex flex-col gap-2">
                          <div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 border-2 border-[#1c1c19] flex items-center justify-center font-black text-xl bg-[#1c1c19] text-white">R</div>
                            <div className="flex flex-col text-left">
                              <span style={{ fontSize: `${docFontSize * 0.8}px` }} className="font-black text-[#1c1c19] uppercase tracking-widest leading-none mb-1">REVIEW</span>
                              <span style={{ fontSize: `${docFontSize * 0.6}px` }} className="font-bold text-[#1c1c19]/60 uppercase leading-none tracking-tighter">BIM_MANAGEMENT_SYSTEM</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p style={{ fontSize: `${docFontSize * 0.8}px` }} className="font-black text-[#1c1c19] uppercase tracking-[0.2em] opacity-40 italic">ARCA</p>
                          <div className="px-4 py-2 bg-white border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
                            <span style={{ fontSize: `${docFontSize}px` }} className="font-black text-[#1c1c19] uppercase tracking-tighter">REVIEW</span>
                          </div>
                        </div>
                      </div>

                      <MarkdownEditor
                        value={activeDoc.content}
                        isEditing={false}
                        fontSize={docFontSize}
                        className="print:border-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Background Texture Info */}
          <div className="max-w-4xl mx-auto mt-8 flex justify-between items-center opacity-30 pointer-events-none select-none print:hidden">
            <span className="text-[8px] font-black tracking-widest uppercase italic">SYSTEM_CORE: V2.4.0</span>
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-[#1c1c19] rounded-full"></div>
              ))}
            </div>
            <span className="text-[8px] font-black tracking-widest uppercase italic">COORD_X: 24.1292 / COORD_Y: 77.0122</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
