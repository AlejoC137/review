import { Printer } from 'lucide-react';

const PrintButton = ({ onClick, className }) => {
    return (
        <button
            onClick={onClick}
            className={`p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors ${className || ''}`}
            title="Imprimir"
        >
            <Printer size={16} />
        </button>
    );
};

export default PrintButton;
