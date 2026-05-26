const initialState = {
    loading: false,
    error: null,
    connectionStatus: 'Unknown',
    selectedAction: null, // Para el Inspector Panel (Mode: Action)
    selectedTask: null,   // Para el Inspector Panel (Mode: Task)
    selectedDate: null,   // Para el Inspector Panel (Mode: Day)
    panelMode: 'view', // 'view' | 'create' | 'edit' | 'task' | 'action' | 'createTask' | 'day'
    navigation: {
        calendarView: 'week', // 'week' | 'month'
        propertyView: 'houses', // 'houses' | 'parcels'
        activeView: 'calendar', // 'calendar' | 'spaces' | 'houses' | 'parcels' | 'team' | 'materials' | 'directory'
        activeSpace: null,
        activeTeamView: null,
        activeMaterial: null,
        activeDirectory: null
    },
    pendingCallsCount: 0,
    isInspectorCollapsed: false,
    refreshCounter: 0,
    // Global Modals State
    isSpaceModalOpen: false,
    spaceModalConfig: {
        projectId: null,
        editingSpace: null,
        onSuccess: null
    }
};

export const appReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_CONNECTION_STATUS':
            return { ...state, connectionStatus: action.payload };
        case 'SET_SELECTED_ACTION':
            return { ...state, selectedAction: action.payload, selectedTask: null, panelMode: action.payload ? 'action' : 'view' };
        case 'SET_SELECTED_TASK':
            return { ...state, selectedTask: action.payload, selectedAction: null, panelMode: action.payload ? 'task' : 'view' };
        case 'SET_PANEL_MODE':
            return { ...state, panelMode: action.payload };
        case 'INIT_CREATE_ACTION':
            return { ...state, selectedAction: action.payload, selectedTask: null, panelMode: 'create' };
        case 'INIT_CREATE_TASK':
            return { ...state, selectedTask: action.payload, selectedAction: null, panelMode: 'createTask' };
        case 'SET_DAY_MODE':
            return { ...state, selectedDate: action.payload, selectedAction: null, selectedTask: null, panelMode: 'day' };
        case 'CLEAR_SELECTION':
            return { ...state, selectedAction: null, selectedTask: null, selectedDate: null, panelMode: 'view' };
        case 'SET_CALENDAR_VIEW':
            return { ...state, navigation: { ...state.navigation, calendarView: action.payload } };
        case 'SET_PROPERTY_VIEW':
            return { ...state, navigation: { ...state.navigation, propertyView: action.payload } };
        case 'SET_ACTIVE_SPACE':
            return { ...state, navigation: { ...state.navigation, activeSpace: action.payload } };
        case 'SET_ACTIVE_TEAM_VIEW':
            return { ...state, navigation: { ...state.navigation, activeTeamView: action.payload } };
        case 'SET_ACTIVE_VIEW':
            return { ...state, navigation: { ...state.navigation, activeView: action.payload } };
        case 'SET_PENDING_CALLS_COUNT':
            return { ...state, pendingCallsCount: action.payload };
        case 'TOGGLE_INSPECTOR_COLLAPSE':
            return { ...state, isInspectorCollapsed: action.payload !== undefined ? action.payload : !state.isInspectorCollapsed };
        case 'INCREMENT_REFRESH_COUNTER':
            return { ...state, refreshCounter: state.refreshCounter + 1 };
        case 'OPEN_SPACE_MODAL':
            return {
                ...state,
                isSpaceModalOpen: true,
                spaceModalConfig: {
                    projectId: action.payload.projectId || null,
                    editingSpace: action.payload.editingSpace || null,
                    onSuccess: action.payload.onSuccess || null
                }
            };
        case 'CLOSE_SPACE_MODAL':
            return {
                ...state,
                isSpaceModalOpen: false,
                spaceModalConfig: {
                    projectId: null,
                    editingSpace: null,
                    onSuccess: null
                }
            };
        default:
            return state;
    }
};
