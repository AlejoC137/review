import { useState, useCallback, useEffect } from 'react';
import { databaseReportService } from '../../../services/databaseReportService';
import { projectService } from '../../../services/projectService';
import { getMaterials } from '../../../services/materialsService';
import { supabase } from '../../../services/supabaseClient';

export function usePreBEPData(projectId) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [project, setProject] = useState(null);
  const [pebInfo, setPebInfo] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [bepTeam, setBepTeam] = useState([]);
  const [staff, setStaff] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [lodTdi, setLodTdi] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [software, setSoftware] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [bimUses, setBimUses] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [dbData, setDbData] = useState({});

  const loadData = useCallback(async (isSilent = false) => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Fetch core data
      const [
        proj,
        peb,
        specs,
        team,
        staffList,
        contactList,
        reqs,
        matrix,
        protos,
        spcs,
        mats,
        docs,
        tsks,
        plns,
        soft,
        objs,
        uses,
        delivs,
        tables
      ] = await Promise.all([
        projectService.getProjectById(projectId).catch(() => null),
        projectService.getProjectPEB(projectId).catch(() => null),
        projectService.getProjectSpecialties(projectId).catch(() => []),
        projectService.getProjectBEPTeam(projectId).catch(() => []),
        projectService.getStaff().catch(() => []),
        projectService.getProjectContacts(projectId).catch(() => []),
        projectService.getProjectRequirements(projectId).catch(() => []),
        projectService.getProjectLODTDI(projectId).catch(() => []),
        projectService.getProjectProtocols(projectId).catch(() => []),
        projectService.getProjectSpaces(projectId).catch(() => []),
        getMaterials(projectId).catch(() => []),
        projectService.getProjectDocuments(projectId).catch(() => []),
        projectService.getProjectTasks(projectId).catch(() => []),
        projectService.getProjectPlans(projectId).catch(() => []),
        projectService.getProjectSoftware(projectId).catch(() => []),
        projectService.getProjectObjectives(projectId).catch(() => []),
        projectService.getProjectBIMUses(projectId).catch(() => []),
        projectService.getProjectDeliverables(projectId).catch(() => []),
        databaseReportService.getAvailableTables().catch(() => [])
      ]);

      setProject(proj);
      setPebInfo(peb);
      setSpecialties(specs || []);
      setBepTeam(team || []);
      setStaff(staffList || []);
      setContacts(contactList || []);
      setRequirements(reqs || []);
      setLodTdi(matrix || []);
      setSpaces(spcs || []);
      setMaterials(mats || []);
      setDocuments(docs || []);
      setTasks(tsks || []);
      setPlans(plns || []);
      setSoftware(soft || []);
      setObjectives(objs || []);
      setBimUses(uses || []);
      setDeliverables(delivs || []);
      setAvailableTables(tables || []);

      // Fetch dynamic block content for protocols
      if (protos && protos.length > 0) {
        const extended = await Promise.all(protos.map(async (protocol) => {
          const { data: blocks } = await supabase
            .from('content_blocks')
            .select('*')
            .eq('parent_id', protocol.id)
            .order('order_index', { ascending: true })
            .catch(() => ({ data: [] }));

          let childrenData = protocol.children || [];
          if ((!childrenData || childrenData.length === 0) && protocol.id) {
            const { data: directChildren } = await supabase
              .from('protocolos')
              .select('*')
              .eq('parent_id', protocol.id)
              .order('order_index', { ascending: true })
              .catch(() => ({ data: [] }));
            if (directChildren) childrenData = directChildren;
          }

          const childrenWithBlocks = await Promise.all(childrenData.map(async (child) => {
            const { data: childBlocks } = await supabase
              .from('content_blocks')
              .select('*')
              .eq('parent_id', child.id)
              .order('order_index', { ascending: true })
              .catch(() => ({ data: [] }));
            return {
              ...child,
              content_blocks: childBlocks || []
            };
          }));

          return {
            ...protocol,
            content_blocks: blocks || [],
            children: childrenWithBlocks
          };
        }));
        setProtocols(extended);
      } else {
        setProtocols([]);
      }

      // Fetch dynamic database tables data
      if (tables && tables.length > 0) {
        const dataPromises = (tables || []).map(async (table) => {
          const data = await databaseReportService.getTableData(table.id, projectId).catch(() => []);
          
          if (table.id === 'recursos' && data && data.length > 0) {
            try {
              const resIds = data.map(r => r.id);
              const { data: allBlocks } = await supabase
                .from('content_blocks')
                .select('*')
                .in('parent_id', resIds)
                .order('order_index', { ascending: true });
              
              const resourcesWithBlocks = (data || []).map(r => ({
                ...r,
                content_blocks: (allBlocks || []).filter(b => b.parent_id === r.id)
              }));
              return { tableId: table.id, data: resourcesWithBlocks };
            } catch (err) {
              console.error("Error fetching blocks for recursos:", err);
            }
          }
          return { tableId: table.id, data };
        });

        const results = await Promise.all(dataPromises);
        const dataMap = {};
        results.forEach(({ tableId, data }) => {
          dataMap[tableId] = data;
        });
        setDbData(dataMap);
      }
    } catch (err) {
      console.error("Error loading PreBEP data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    refreshing,
    loadData,
    project,
    pebInfo,
    specialties,
    bepTeam,
    staff,
    contacts,
    requirements,
    lodTdi,
    protocols,
    spaces,
    materials,
    documents,
    tasks,
    plans,
    software,
    objectives,
    bimUses,
    deliverables,
    availableTables,
    dbData
  };
}
