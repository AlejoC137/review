import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { X, Printer } from 'lucide-react';

const PDFModal = ({ isOpen, onClose, title = "Vista Previa de Impresión", children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Printer size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* PDF Viewer Content */}
                <div className="flex-1 bg-gray-100 relative">
                    <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }} showToolbar={true}>
                        {children}
                    </PDFViewer>
                </div>

                {/* Footer (Optional info) */}
                <div className="px-6 py-2 bg-white border-t border-gray-100 text-xs text-gray-400 text-center">
                    Utiliza el botón de imprimir de la barra de herramientas superior para generar tu documento.
                </div>
            </div>
        </div>
    );
};

export default PDFModal;
