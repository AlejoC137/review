/**
 * nativePrint
 * 
 * Handles printing of a specific DOM element by creating a temporary iframe,
 * copying all styles from the main document, and printing the iframe's window.
 * 
 * @param {string} elementId - The ID of the element to print.
 * @param {string} title - The document title for the print job.
 */
export const handleNativePrint = (elementId, title = 'Document') => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Print Error: Element with ID "${elementId}" not found.`);
        alert("No se encontró el contenido para imprimir.");
        return;
    }

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Get the iframe's document
    const doc = iframe.contentWindow.document;

    // Write the basic HTML structure
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta charset="utf-8">
            <style>
                body {
                    background-color: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                /* Ensure hidden elements in print view are visible if needed, 
                   but usually we rely on the cloned content's classes */
            </style>
        </head>
        <body>
            <div id="print-content"></div>
        </body>
        </html>
    `);
    doc.close();

    // Copy all stylesheets from the main document
    // We clone them to ensure mapped styles (like Tailwind) are preserved
    const styles = document.querySelectorAll('link[rel="stylesheet"], style');
    styles.forEach(styleNode => {
        doc.head.appendChild(styleNode.cloneNode(true));
    });

    // Copy the content
    const contentClone = element.cloneNode(true);

    // Ensure form inputs allow their values to be seen (cloning sometimes misses value)
    const originalInputs = element.querySelectorAll('input, select, textarea');
    const clonedInputs = contentClone.querySelectorAll('input, select, textarea');

    originalInputs.forEach((input, i) => {
        if (clonedInputs[i]) {
            if (input.type === 'checkbox' || input.type === 'radio') {
                clonedInputs[i].checked = input.checked;
            } else {
                clonedInputs[i].value = input.value;
            }
        }
    });

    const container = doc.getElementById('print-content');
    container.appendChild(contentClone);

    // Wait for styles to load (small delay) then print
    // For link tags, we might need to wait, but usually a small timeout is enough for local/cached styles
    setTimeout(() => {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch (e) {
            console.error("Print Error:", e);
        } finally {
            // Remove iframe after interactions
            // We can't know exactly when they cancel/print, but we leave it for a bit or remove on focus back
            // A long timeout is usually safe or listening to afterprint events if supported
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000); // 1 second might be too fast if the dialog takes time to appear? 
            // Actually, window.print() is blocking in many browsers, so this runs after dialog closes.
        }
    }, 500);
};
