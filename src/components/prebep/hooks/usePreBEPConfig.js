import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../../services/supabaseClient';
import {
  DEFAULT_CHAPTER_VISIBILITY,
  DEFAULT_CHAPTER_ORDER,
  DEFAULT_LOD_COLS,
  DEFAULT_MATERIALES_COLS,
  DEFAULT_SUBPROYECTOS_COLS,
  DEFAULT_EQUIPO_COLS,
  DEFAULT_DIRECTORIO_COLS,
  DEFAULT_SOFTWARE_COLS,
  DEFAULT_CALENDARIO_COLS,
  DEFAULT_OBJETIVOS_COLS,
  DEFAULT_ENTREGAS_COLS
} from '../utils/preBepHelpers';

export function usePreBEPConfig(projectId, protocols = []) {
  const [activeView, setActiveView] = useState('document'); // 'document' or 'control_panel'

  // Chapter Visibility
  const [chapterVisibility, setChapterVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_chapter_visibility_${projectId}`);
      return saved ? { ...DEFAULT_CHAPTER_VISIBILITY, ...JSON.parse(saved) } : DEFAULT_CHAPTER_VISIBILITY;
    } catch (e) {
      return DEFAULT_CHAPTER_VISIBILITY;
    }
  });

  const handleChapterVisibilityChange = (key, value) => {
    setChapterVisibility(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(`prebep_chapter_visibility_${projectId}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Chapter Order
  const [chapterOrder, setChapterOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_chapter_order_${projectId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const missing = DEFAULT_CHAPTER_ORDER.filter(c => !parsed.includes(c));
        return [...parsed, ...missing];
      }
      return DEFAULT_CHAPTER_ORDER;
    } catch (e) {
      return DEFAULT_CHAPTER_ORDER;
    }
  });

  const handleOrderChange = (key, newIndex) => {
    if (newIndex < 0 || newIndex >= chapterOrder.length) return;
    setChapterOrder(prev => {
      const filtered = prev.filter(k => k !== key);
      filtered.splice(newIndex, 0, key);
      try {
        localStorage.setItem(`prebep_chapter_order_${projectId}`, JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
  };

  // Show Index
  const [showIndex, setShowIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_show_index_${projectId}`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const handleShowIndexChange = (value) => {
    setShowIndex(value);
    try {
      localStorage.setItem(`prebep_show_index_${projectId}`, JSON.stringify(value));
    } catch (e) {}
  };

  // Custom Sections
  const [customSections, setCustomSections] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_custom_sections_${projectId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [customImportTable, setCustomImportTable] = useState('');
  const [customImportSelectedIds, setCustomImportSelectedIds] = useState([]);
  const [customImportSearchQuery, setCustomImportSearchQuery] = useState('');
  const [selectedExplorerTable, setSelectedExplorerTable] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddCustomSection = (tableData) => {
    if (!customImportTable || customImportSelectedIds.length === 0) return;
    const newSecs = [];
    const newKeys = [];
    customImportSelectedIds.forEach(recordId => {
      const secId = `custom_${customImportTable}_${recordId}`;
      const record = (tableData || []).find(r => r.id === recordId);
      const title = record?.nombre || record?.title || record?.name || record?.codigo || `Registro ${recordId.substring(0, 6)}`;
      newSecs.push({
        id: secId,
        tableId: customImportTable,
        recordId,
        title: `${customImportTable.toUpperCase()}: ${title}`
      });
      newKeys.push(secId);
    });

    setCustomSections(prev => {
      const filtered = prev.filter(s => !newKeys.includes(s.id));
      const updated = [...filtered, ...newSecs];
      try {
        localStorage.setItem(`prebep_custom_sections_${projectId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setChapterOrder(prev => {
      const filtered = prev.filter(k => !newKeys.includes(k));
      const updated = [...filtered, ...newKeys];
      try {
        localStorage.setItem(`prebep_chapter_order_${projectId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setChapterVisibility(prev => {
      const next = { ...prev };
      newKeys.forEach(k => { next[k] = true; });
      try {
        localStorage.setItem(`prebep_chapter_visibility_${projectId}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setCustomImportTable('');
    setCustomImportSelectedIds([]);
  };

  const handleRemoveCustomSection = (key) => {
    setCustomSections(prev => {
      const updated = prev.filter(s => s.id !== key);
      try {
        localStorage.setItem(`prebep_custom_sections_${projectId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setChapterOrder(prev => {
      const updated = prev.filter(k => k !== key);
      try {
        localStorage.setItem(`prebep_chapter_order_${projectId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Column Visibility States
  const [lodVisibleColumns, setLodVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_lod_columns_${projectId}`);
      return saved ? JSON.parse(saved) : DEFAULT_LOD_COLS;
    } catch (e) {
      return DEFAULT_LOD_COLS;
    }
  });
  const handleLodColumnToggle = (col) => {
    const nextCols = lodVisibleColumns.includes(col)
      ? lodVisibleColumns.filter(c => c !== col)
      : [...lodVisibleColumns, col];
    setLodVisibleColumns(nextCols);
    try { localStorage.setItem(`prebep_lod_columns_${projectId}`, JSON.stringify(nextCols)); } catch (e) {}
  };

  const [lodExpandedDisciplines, setLodExpandedDisciplines] = useState({});
  const toggleLodDiscipline = (disc) => {
    setLodExpandedDisciplines(prev => ({ ...prev, [disc]: !prev[disc] }));
  };

  const [materialesVisibleColumns, setMaterialesVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_materiales_columns_${projectId}`);
      return saved ? JSON.parse(saved) : DEFAULT_MATERIALES_COLS;
    } catch (e) {
      return DEFAULT_MATERIALES_COLS;
    }
  });
  const handleMaterialesColumnToggle = (col) => {
    const nextCols = materialesVisibleColumns.includes(col)
      ? materialesVisibleColumns.filter(c => c !== col)
      : [...materialesVisibleColumns, col];
    setMaterialesVisibleColumns(nextCols);
    try { localStorage.setItem(`prebep_materiales_columns_${projectId}`, JSON.stringify(nextCols)); } catch (e) {}
  };

  const [showFullProtocols, setShowFullProtocols] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_show_full_protocols_${projectId}`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [expandedProtocols, setExpandedProtocols] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_expanded_protocols_${projectId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [expandedSubItems, setExpandedSubItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_expanded_subitems_${projectId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const toggleProtocol = (protocolId) => {
    setExpandedProtocols(prev => {
      const next = {
        ...prev,
        [protocolId]: prev[protocolId] === undefined ? false : !prev[protocolId]
      };
      try {
        localStorage.setItem(`prebep_expanded_protocols_${projectId}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleSubItem = (subItemId) => {
    setExpandedSubItems(prev => {
      const next = {
        ...prev,
        [subItemId]: prev[subItemId] === undefined ? false : !prev[subItemId]
      };
      try {
        localStorage.setItem(`prebep_expanded_subitems_${projectId}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const [protocolOrder, setProtocolOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_protocol_order_${projectId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleProtocolOrderChange = (protocolId, newIndex) => {
    if (newIndex < 0) return;
    setProtocolOrder(prev => {
      let currentOrder = [...prev];
      if (currentOrder.length === 0 && protocols.length > 0) {
        currentOrder = protocols.map(p => p.id);
      }
      const missing = protocols.map(p => p.id).filter(id => !currentOrder.includes(id));
      currentOrder = [...currentOrder, ...missing];

      if (newIndex >= currentOrder.length) return prev;

      const filtered = currentOrder.filter(id => id !== protocolId);
      filtered.splice(newIndex, 0, protocolId);
      try {
        localStorage.setItem(`prebep_protocol_order_${projectId}`, JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
  };

  const orderedProtocols = useMemo(() => {
    if (!protocols || protocols.length === 0) return [];
    if (!protocolOrder || protocolOrder.length === 0) return protocols;

    const result = [];
    const remaining = [...protocols];

    protocolOrder.forEach(id => {
      const idx = remaining.findIndex(p => p.id === id);
      if (idx !== -1) {
        result.push(remaining[idx]);
        remaining.splice(idx, 1);
      }
    });

    return [...result, ...remaining];
  }, [protocols, protocolOrder]);

  // Subproyectos columns
  const [subproyectosVisibleColumns, setSubproyectosVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_subproyectos_columns_${projectId}`);
      return saved ? JSON.parse(saved) : DEFAULT_SUBPROYECTOS_COLS;
    } catch (e) { return DEFAULT_SUBPROYECTOS_COLS; }
  });
  const handleSubproyectosColumnToggle = (col) => {
    const nextCols = subproyectosVisibleColumns.includes(col) ? subproyectosVisibleColumns.filter(c => c !== col) : [...subproyectosVisibleColumns, col];
    setSubproyectosVisibleColumns(nextCols);
    try { localStorage.setItem(`prebep_subproyectos_columns_${projectId}`, JSON.stringify(nextCols)); } catch (e) {}
  };

  // Equipo columns
  const [equipoVisibleColumns, setEquipoVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_equipo_columns_${projectId}`);
      return saved ? JSON.parse(saved) : DEFAULT_EQUIPO_COLS;
    } catch (e) { return DEFAULT_EQUIPO_COLS; }
  });
  const handleEquipoColumnToggle = (col) => {
    const nextCols = equipoVisibleColumns.includes(col) ? equipoVisibleColumns.filter(c => c !== col) : [...equipoVisibleColumns, col];
    setEquipoVisibleColumns(nextCols);
    try { localStorage.setItem(`prebep_equipo_columns_${projectId}`, JSON.stringify(nextCols)); } catch (e) {}
  };

  // Directorio columns
  const [directorioVisibleColumns, setDirectorioVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_directorio_columns_${projectId}`);
      return saved ? JSON.parse(saved) : DEFAULT_DIRECTORIO_COLS;
    } catch (e) { return DEFAULT_DIRECTORIO_COLS; }
  });
  const handleDirectorioColumnToggle = (col) => {
    const nextCols = directorioVisibleColumns.includes(col) ? directorioVisibleColumns.filter(c => c !== col) : [...directorioVisibleColumns, col];
    setDirectorioVisibleColumns(nextCols);
    try { localStorage.setItem(`prebep_directorio_columns_${projectId}`, JSON.stringify(nextCols)); } catch (e) {}
  };

  // Software columns
  const [softwareVisibleColumns, setSoftwareVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_software_columns_${projectId}`);
      return saved ? JSON.parse(saved) : DEFAULT_SOFTWARE_COLS;
    } catch (e) { return DEFAULT_SOFTWARE_COLS; }
  });
  const handleSoftwareColumnToggle = (col) => {
    const nextCols = softwareVisibleColumns.includes(col) ? softwareVisibleColumns.filter(c => c !== col) : [...softwareVisibleColumns, col];
    setSoftwareVisibleColumns(nextCols);
    try { localStorage.setItem(`prebep_software_columns_${projectId}`, JSON.stringify(nextCols)); } catch (e) {}
  };

  // Calendario columns
  const [calendarioVisibleColumns, setCalendarioVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_calendario_columns_${projectId}`);
      return saved ? JSON.parse(saved) : DEFAULT_CALENDARIO_COLS;
    } catch (e) { return DEFAULT_CALENDARIO_COLS; }
  });
  const handleCalendarioColumnToggle = (col) => {
    const nextCols = calendarioVisibleColumns.includes(col) ? calendarioVisibleColumns.filter(c => c !== col) : [...calendarioVisibleColumns, col];
    setCalendarioVisibleColumns(nextCols);
    try { localStorage.setItem(`prebep_calendario_columns_${projectId}`, JSON.stringify(nextCols)); } catch (e) {}
  };

  // Objetivos columns
  const [objetivosVisibleColumns, setObjetivosVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_objetivos_columns_${projectId}`);
      return saved ? JSON.parse(saved) : DEFAULT_OBJETIVOS_COLS;
    } catch (e) { return DEFAULT_OBJETIVOS_COLS; }
  });
  const handleObjetivosColumnToggle = (col) => {
    const nextCols = objetivosVisibleColumns.includes(col) ? objetivosVisibleColumns.filter(c => c !== col) : [...objetivosVisibleColumns, col];
    setObjetivosVisibleColumns(nextCols);
    try { localStorage.setItem(`prebep_objetivos_columns_${projectId}`, JSON.stringify(nextCols)); } catch (e) {}
  };

  // Entregas columns
  const [entregasVisibleColumns, setEntregasVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_entregas_columns_${projectId}`);
      return saved ? JSON.parse(saved) : DEFAULT_ENTREGAS_COLS;
    } catch (e) { return DEFAULT_ENTREGAS_COLS; }
  });
  const handleEntregasColumnToggle = (col) => {
    const nextCols = entregasVisibleColumns.includes(col) ? entregasVisibleColumns.filter(c => c !== col) : [...entregasVisibleColumns, col];
    setEntregasVisibleColumns(nextCols);
    try { localStorage.setItem(`prebep_entregas_columns_${projectId}`, JSON.stringify(nextCols)); } catch (e) {}
  };

  const [activeConfigTab, setActiveConfigTab] = useState('lod_tdi');

  const toggleProtocolsDisplay = () => {
    setShowFullProtocols(prev => {
      const next = !prev;
      try {
        localStorage.setItem(`prebep_show_full_protocols_${projectId}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Page Heights & Supabase Sync
  const [pageHeights, setPageHeights] = useState([278.8, 278.8, 278.8, 278.8, 278.8]);
  const [configSaveStatus, setConfigSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error' | 'offline'
  const saveTimeoutRef = useRef(null);
  const configPhase = useRef('init'); // 'init' | 'loaded' | 'ready'

  const loadPageConfig = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (user) {
        const { data, error } = await supabase
          .from('user_prebep_configs')
          .select('page_heights')
          .eq('user_id', user.id)
          .eq('project_id', projectId)
          .maybeSingle();

        if (!error && data?.page_heights && Array.isArray(data.page_heights) && data.page_heights.length > 0) {
          setPageHeights(data.page_heights);
          configPhase.current = 'loaded';
          return;
        }
      }
    } catch (e) {
      console.warn('[PreBEP] Error loading config from Supabase, trying localStorage:', e);
    }

    try {
      const saved = localStorage.getItem(`prebep_page_heights_${projectId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPageHeights(parsed);
          configPhase.current = 'loaded';
          return;
        }
      }
    } catch (e) {}

    configPhase.current = 'ready';
  }, [projectId]);

  const savePageConfig = useCallback(async (heights) => {
    if (!projectId) return;
    setConfigSaveStatus('saving');

    try {
      localStorage.setItem(`prebep_page_heights_${projectId}`, JSON.stringify(heights));
    } catch (e) {}

    try {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (!user) {
        setConfigSaveStatus('offline');
        setTimeout(() => setConfigSaveStatus('idle'), 2500);
        return;
      }

      const { error } = await supabase
        .from('user_prebep_configs')
        .upsert(
          {
            user_id: user.id,
            project_id: projectId,
            page_heights: heights,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,project_id' }
        );

      if (error) {
        console.warn('[PreBEP] Supabase upsert error:', error.message);
        setConfigSaveStatus('offline');
      } else {
        setConfigSaveStatus('saved');
      }
    } catch (err) {
      console.warn('[PreBEP] Could not save to Supabase:', err);
      setConfigSaveStatus('offline');
    }

    setTimeout(() => {
      setConfigSaveStatus('idle');
    }, 2500);
  }, [projectId]);

  // Handle Page Heights changes with debounce
  useEffect(() => {
    if (configPhase.current === 'init') return;
    if (configPhase.current === 'loaded') {
      configPhase.current = 'ready';
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      savePageConfig(pageHeights);
    }, 800);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [pageHeights, savePageConfig]);

  useEffect(() => {
    loadPageConfig();
  }, [loadPageConfig]);

  const handlePageHeightChange = (idx, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 20) return;
    setPageHeights(prev => {
      const next = [...prev];
      next[idx] = Math.round(num * 10) / 10;
      return next;
    });
  };

  const addPage = () => {
    setPageHeights(prev => [...prev, 278.8]);
  };

  const deletePage = (idx) => {
    if (pageHeights.length <= 1) return;
    setPageHeights(prev => prev.filter((_, i) => i !== idx));
  };

  const resetPages = () => {
    setPageHeights([278.8, 278.8, 278.8, 278.8, 278.8]);
  };

  return {
    activeView,
    setActiveView,
    chapterVisibility,
    handleChapterVisibilityChange,
    chapterOrder,
    handleOrderChange,
    showIndex,
    handleShowIndexChange,
    customSections,
    setCustomSections,
    customImportTable,
    setCustomImportTable,
    customImportSelectedIds,
    setCustomImportSelectedIds,
    customImportSearchQuery,
    setCustomImportSearchQuery,
    selectedExplorerTable,
    setSelectedExplorerTable,
    searchQuery,
    setSearchQuery,
    handleAddCustomSection,
    handleRemoveCustomSection,
    lodVisibleColumns,
    handleLodColumnToggle,
    lodExpandedDisciplines,
    toggleLodDiscipline,
    materialesVisibleColumns,
    handleMaterialesColumnToggle,
    showFullProtocols,
    toggleProtocolsDisplay,
    expandedProtocols,
    toggleProtocol,
    expandedSubItems,
    toggleSubItem,
    protocolOrder,
    handleProtocolOrderChange,
    orderedProtocols,
    subproyectosVisibleColumns,
    handleSubproyectosColumnToggle,
    equipoVisibleColumns,
    handleEquipoColumnToggle,
    directorioVisibleColumns,
    handleDirectorioColumnToggle,
    softwareVisibleColumns,
    handleSoftwareColumnToggle,
    calendarioVisibleColumns,
    handleCalendarioColumnToggle,
    objetivosVisibleColumns,
    handleObjetivosColumnToggle,
    entregasVisibleColumns,
    handleEntregasColumnToggle,
    activeConfigTab,
    setActiveConfigTab,
    pageHeights,
    configSaveStatus,
    handlePageHeightChange,
    addPage,
    deletePage,
    resetPages,
    setPageHeights
  };
}
