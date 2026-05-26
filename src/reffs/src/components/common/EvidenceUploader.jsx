import { useState, useEffect } from 'react';
import { uploadEvidence, deleteEvidence } from '../../services/storageService';
import { Camera, Image as ImageIcon, Loader2, Trash2, Eye, UploadCloud } from 'lucide-react';

const EvidenceUploader = ({ currentUrl, onUpload, label = "Evidencia Fotográfica", pathPrefix = "doc" }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentUrl);

    useEffect(() => {
        setPreview(currentUrl);
    }, [currentUrl]);

    // Cleanup local previews
    useEffect(() => {
        return () => {
            if (preview?.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        // Local preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        try {
            const publicUrl = await uploadEvidence(file, pathPrefix);
            onUpload(publicUrl); // Callback to parent
            setPreview(publicUrl); // Confirm with actual URL
        } catch (error) {
            alert('Error al subir imagen: ' + error.message);
            setPreview(currentUrl); // Revert on error
        } finally {
            setUploading(false);
        }
    };

    const triggerInput = () => document.getElementById(`evidence-input-${pathPrefix}`).click();

    return (
        <div className="border border-gray-200 dark:border-zinc-800 rounded-lg p-2 bg-gray-50/50 dark:bg-zinc-900/50">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Camera size={12} /> {label}
            </h4>

            <input
                id={`evidence-input-${pathPrefix}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {!preview ? (
                // Empty State
                <div
                    onClick={triggerInput}
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 cursor-pointer hover:border-blue-400 transition-colors group"
                >
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud size={16} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">Click para subir foto</span>
                    <span className="text-[8px] text-gray-400">Max 100KB (auto-comprime)</span>
                </div>
            ) : (
                // Preview State
                <div className="relative group">
                    <div className="relative aspect-video w-full overflow-hidden rounded border border-gray-200 dark:border-zinc-700 bg-black">
                        <img
                            src={preview}
                            alt="Evidencia"
                            className={`w-full h-full object-contain transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`}
                        />
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="flex items-center gap-1 px-2 py-1 bg-black/70 text-white rounded text-[10px] backdrop-blur-sm">
                                    <Loader2 size={12} className="animate-spin" /> Comprimiendo...
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions Overlay */}
                    {!uploading && (
                        <div className="flex items-center gap-2 mt-2">
                            <a
                                href={preview}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[10px] font-medium bg-white border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition-colors"
                            >
                                <Eye size={12} /> Ver
                            </a>
                            <button
                                onClick={triggerInput}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[10px] font-medium bg-blue-50 border border-blue-200 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            >
                                <ImageIcon size={12} /> Cambiar
                            </button>
                            <button
                                onClick={async () => {
                                    if (window.confirm('¿Eliminar imagen definitivamente?')) {
                                        try {
                                            if (currentUrl) {
                                                await deleteEvidence(currentUrl);
                                            }
                                            onUpload(null);
                                            setPreview(null);
                                        } catch (error) {
                                            console.error("Error removing image:", error);
                                            alert("Error eliminando imagen");
                                        }
                                    }
                                }}
                                className="flex-0 px-2 py-1 text-[10px] font-medium bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
                                title="Eliminar imagen"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EvidenceUploader;
