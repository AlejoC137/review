import supabase from '../config/supabaseClient';
import imageCompression from 'browser-image-compression';

/**
 * Uploads an evidence image file to Supabase Storage after compression.
 * @param {File} file - The file object from input.
 * @param {string} pathPrefix - Optional prefix for the path (e.g., 'tasks' or 'actions').
 * @returns {Promise<string>} - The public URL of the uploaded image.
 */
export const uploadEvidence = async (file, pathPrefix = 'general') => {
    if (!file) throw new Error("No file provided");

    try {
        // 1. Compress Image
        const options = {
            maxSizeMB: 0.1,          // Target ~100KB
            maxWidthOrHeight: 800,   // Resize if larger
            useWebWorker: true
        };

        const compressedFile = await imageCompression(file, options);
        console.log(`Original: ${file.size / 1024} KB, Compressed: ${compressedFile.size / 1024} KB`);

        // 2. Upload to Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${pathPrefix}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('evidencias')
            .upload(filePath, compressedFile);

        if (error) {
            throw error;
        }

        // 3. Get Public URL
        const { data: publicUrlData } = supabase.storage
            .from('evidencias')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;

    } catch (error) {
        console.error('Error uploading evidence:', error);

        // Handle "Bucket not found" error specifically
        if (error.message && (error.message.includes('Bucket not found') || error.error === 'Bucket not found')) {
            try {
                // Try to create the bucket if it doesn't exist (works if policy allows)
                const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('evidencias', {
                    public: true
                });

                if (bucketError) {
                    throw new Error("El bucket 'evidencias' no existe y no se pudo crear automáticamente. Por favor créalo en Supabase Storage.");
                }

                // Retry upload
                const { error: retryError } = await supabase.storage
                    .from('evidencias')
                    .upload(filePath, compressedFile);

                if (retryError) throw retryError;

                // Get URL after successful retry
                const { data: publicUrlData } = supabase.storage
                    .from('evidencias')
                    .getPublicUrl(filePath);

                return publicUrlData.publicUrl;

            } catch (creationError) {
                console.error("Auto-creation failed:", creationError);
                throw new Error("Error crítico: El bucket 'evidencias' no existe en Supabase. Por favor ejecute el script SQL de configuración o cree el bucket manualmente.");
            }
        }

        throw error;
    }
};

/**
 * Deletes an evidence image from Supabase Storage.
 * @param {string} publicUrl - The full public URL of the image to delete.
 */
export const deleteEvidence = async (publicUrl) => {
    if (!publicUrl) return;

    try {
        // Extract file path from URL
        // URL format: .../storage/v1/object/public/evidencias/filename.ext
        const urlParts = publicUrl.split('/evidencias/');
        if (urlParts.length < 2) return;

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from('evidencias')
            .remove([filePath]);

        if (error) {
            console.error('Error deleting evidence from storage:', error);
            throw error;
        }
        console.log('Successfully deleted evidence from storage:', filePath);
    } catch (error) {
        console.error('Error in deleteEvidence:', error);
        // Don't throw, just log. We don't want to block UI updates if cleanup fails.
    }
};

/**
 * Uploads an image for the Bitacora (Log).
 * Wrapper around uploadEvidence with specific path prefix.
 */
export const uploadBitacoraEvidence = async (file) => {
    return uploadEvidence(file, 'bitacora');
};
