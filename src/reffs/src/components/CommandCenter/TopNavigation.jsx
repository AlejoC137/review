import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Calendar,
    Building2,
    Box,
    Home,
    MapPin,
    Users,
    FileText,
    Package,
    BookOpen,
    Upload,
    Bell
} from 'lucide-react';
import JsonImporterModal from './JsonImporterModal';
import {
    setCalendarView,
    setPropertyView,
    setActiveView,
    setSelectedTask
} from '../../store/actions/appActions';

const TopNavigation = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { pendingCallsCount } = useSelector(state => state.app);
    const [showImporter, setShowImporter] = useState(false);

    const checkActive = (path) => {
        if (path === '/calendar' || path === '/') {
            return location.pathname.startsWith('/calendar');
        }
        return location.pathname.startsWith(path);
    };

    const isCalendarActive = (view) => location.pathname === `/calendar/${view}`;
    const isActive = (path) => location.pathname.startsWith(`/${path}`);

    const buttonClass = (active) => `
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
        ${active
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
        }
    `;

    return (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Calendar Views */}
                <button
                    onClick={() => navigate('/calendar/month')}
                    className={buttonClass(isCalendarActive('month'))}
                >
                    <Calendar size={14} />
                    <span>Mes</span>
                </button>

                <button
                    onClick={() => navigate('/calendar/week')}
                    className={buttonClass(isCalendarActive('week'))}
                >
                    <Calendar size={14} />
                    <span>Semanal</span>
                </button>

                {/* Spaces 
                <button
                    onClick={() => navigate('/spaces')}
                    className={buttonClass(isActive('spaces'))}
                >
                    <Building2 size={14} />
                    <span>espacios</span>
                </button>
*/}
                {/* Components 
                <button
                    onClick={() => navigate('/components')}
                    className={buttonClass(isActive('components'))}
                >
                    <Box size={14} />
                    <span>componentes</span>
                </button>
*/}
                {/* Houses */}
                <button
                    onClick={() => navigate('/houses')}
                    className={buttonClass(isActive('houses'))}
                >
                    <Home size={14} />
                    <span>Casas</span>
                </button>

                {/* Parcels */}
                {/* <button
                    onClick={() => navigate('/parcels')}
                    className={buttonClass(isActive('parcels'))}
                >
                    <MapPin size={14} />
                    <span>parcelacion</span>
                </button>
*/}
                {/* Team */}
                <button
                    onClick={() => navigate('/team')}
                    className={buttonClass(isActive('team'))}
                >
                    <Users size={14} />
                    <span>Equipo</span>
                </button>

                {/* Llamados */}
                <button
                    onClick={() => navigate('/calls')}
                    className={`${buttonClass(isActive('calls'))} relative`}
                >
                    <Bell size={14} />
                    <span>Llamados</span>
                    {pendingCallsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                            {pendingCallsCount > 99 ? '99+' : pendingCallsCount}
                        </span>
                    )}
                </button>

                {/* Protocols */}
                <button
                    onClick={() => navigate('/protocols')}
                    className={buttonClass(isActive('protocols'))}
                >
                    <FileText size={14} />
                    <span>Protocolos</span>
                </button>

                {/* Materials
                <button
                    onClick={() => navigate('/materials')}
                    className={buttonClass(isActive('materials'))}
                >
                    <Package size={14} />
                    <span>materiales</span>
                </button>
 */}
                {/* Directory */}
                <button
                    onClick={() => navigate('/directory')}
                    className={buttonClass(isActive('directory'))}
                >
                    <BookOpen size={14} />
                    <span>Directorio</span>
                </button>

                {/* Importer 
                <button
                    onClick={() => {
                        setShowImporter(true);
                        dispatch(setSelectedTask(null));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border bg-gray-900 text-white border-gray-900 hover:bg-gray-800 shadow-sm ml-2"
                >
                    <Upload size={14} />
                    <span>Importador</span>
                </button>
                */}
            </div>

            <JsonImporterModal
                isOpen={showImporter}
                onClose={() => setShowImporter(false)}
            />
        </div>
    );
};

export default TopNavigation;
