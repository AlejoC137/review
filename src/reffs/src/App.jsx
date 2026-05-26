import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkConnection, fetchPendingCallsCount } from './store/actions/appActions';
// import MainContainer from './components/CommandCenter/MainContainer'; // Removed
import TopNavigation from './components/CommandCenter/TopNavigation';
import { Routes, Route, Navigate } from 'react-router-dom';

// Views
import CalendarContainer from './components/CommandCenter/CalendarContainer';
import SpacesView from './components/CommandCenter/SpacesView';
import ComponentsView from './components/CommandCenter/ComponentsView';
import HousesView from './components/CommandCenter/HousesView';
import TeamView from './components/CommandCenter/TeamView';
import ProtocolsView from './components/CommandCenter/ProtocolsView';
import MaterialsView from './components/CommandCenter/MaterialsView';
import DirectoryView from './components/CommandCenter/DirectoryView';
import CallsView from './components/CommandCenter/CallsView';
import ActionInspectorPanel from './components/CommandCenter/ActionInspectorPanel';
import SpaceModal from './components/common/SpaceModal';
import { closeSpaceModal } from './store/actions/appActions';
import { Activity, Database, Layers } from 'lucide-react';


function App() {
    const dispatch = useDispatch();
    const { connectionStatus, loading, error } = useSelector((state) => state.app);

    useEffect(() => {
        dispatch(checkConnection());
        dispatch(fetchPendingCallsCount());

        // Refresh count every 30 seconds
        const interval = setInterval(() => {
            dispatch(fetchPendingCallsCount());
        }, 30000);

        return () => clearInterval(interval);
    }, [dispatch]);

    // Fallback for missing colors if CSS isn't fully loaded or configured:
    // Using explicit tailwind colors as backup in class string or relying on defaults
    // The structure assumes css variables are present.

    const { panelMode, isInspectorCollapsed: isCollapsed } = useSelector(state => state.app);
    const showInspector = ['action', 'task', 'create', 'createTask', 'day'].includes(panelMode);

    // Dynamic padding to prevent ActionInspectorPanel from covering background content
    // Collapsed: 48px (h-12), Expanded: 300px
    const bottomPadding = !showInspector ? '0px' : (isCollapsed ? '48px' : '300px');

    const spaceModalConfig = useSelector(state => state.app.spaceModalConfig);

    return (
        <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col">
            <TopNavigation />
            <div className="flex-1 overflow-hidden relative flex flex-col">
                <div
                    className="flex-1 overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ paddingBottom: bottomPadding }}
                >
                    <Routes>
                        <Route path="/" element={<Navigate to="/calendar/week" replace />} />
                        <Route path="/calendar" element={<Navigate to="/calendar/week" replace />} />
                        <Route path="/calendar/:view" element={<CalendarContainer />} />
                        <Route path="/spaces" element={<SpacesView />} />
                        <Route path="/components" element={<ComponentsView />} />
                        <Route path="/houses" element={<HousesView />} />
                        <Route path="/houses/:id" element={<HousesView />} />
                        <Route path="/houses/:id/cronograma" element={<HousesView />} />
                        <Route path="/houses/:id/informe" element={<HousesView />} />
                        <Route path="/parcels" element={<HousesView mode="parcels" />} />
                        <Route path="/team" element={<TeamView />} />
                        <Route path="/protocols/:protocolName?" element={<ProtocolsView />} />
                        <Route path="/materials" element={<MaterialsView />} />
                        <Route path="/directory" element={<DirectoryView />} />
                        <Route path="/calls" element={<CallsView />} />
                        <Route path="*" element={<Navigate to="/calendar/week" replace />} />
                    </Routes>
                </div>

                <ActionInspectorPanel />
            </div>

            {/* Global Modals */}
            <SpaceModal
                isOpen={useSelector(state => state.app.isSpaceModalOpen)}
                onClose={() => dispatch(closeSpaceModal())}
                onSuccess={(newSpace) => {
                    if (spaceModalConfig.onSuccess) spaceModalConfig.onSuccess(newSpace);
                    dispatch(closeSpaceModal());
                }}
                editingSpace={spaceModalConfig.editingSpace}
                defaultProjectId={spaceModalConfig.projectId}
            />
        </div>
    );
}

export default App;
