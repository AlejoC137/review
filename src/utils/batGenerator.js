export const generateImplementationBat = (mapData, planName, excludedModes = new Set()) => {
    if (!mapData) return;

    const lines = [
        "@echo off",
        "title BIM Implementation Folder Scaffolder",
        "echo =========================================",
        "echo   BIM IMPLEMENTATION FOLDER SCAFFOLDER",
        "echo =========================================",
        `echo Project: ${planName || 'Unnamed Plan'}`,
        "echo.",
        "set /p confirm=This will create folders and files in the current directory. Proceed? (y/n): ",
        'if /i "%confirm%" neq "y" exit',
        "echo.",
        "echo Creating structure...",
        "echo."
    ];

    // Helper to check if a node or any of its children should be created
    const isIncluded = (mode) => {
        if (mode === 'LOCAL') return !excludedModes.has('LOCAL');
        if (mode === 'CLOUD') return !excludedModes.has('CLOUD');
        if (mode === 'BOTH') return !excludedModes.has('LOCAL') || !excludedModes.has('CLOUD');
        return true; // Default/Inherit should be handled by parent
    };

    const shouldCreateNode = (node, parentMode = 'LOCAL') => {
        const currentMode = !node.storage_mode || node.storage_mode === 'INHERIT' ? parentMode : node.storage_mode;
        
        // If this node is included based on its mode, we need it
        if (isIncluded(currentMode)) return true;
        
        // If it has children, check if any of them need to be created
        if (node.children && node.children.length > 0) {
            return node.children.some(child => shouldCreateNode(child, currentMode));
        }
        
        return false;
    };

    const traverse = (node, currentPath = "", parentMode = 'LOCAL') => {
        const currentMode = !node.storage_mode || node.storage_mode === 'INHERIT' ? parentMode : node.storage_mode;
        
        // Skip entirely if neither this node nor its descendants are needed
        if (!shouldCreateNode(node, parentMode)) return;

        const safeName = (node.name || "Unnamed").replace(/[/\\?%*:|"<>]/g, '-');
        const nodePath = currentPath ? `${currentPath}\\${safeName}` : safeName;

        // Determine if we should create a folder or a file
        const isFolder = node.type === 'FOLDER' || (node.children && node.children.length > 0);
        
        if (isFolder) {
            lines.push(`if not exist "${nodePath}" mkdir "${nodePath}"`);
            if (node.children) {
                node.children.forEach(child => traverse(child, nodePath, currentMode));
            }
        } else {
            // It's a file. Only create it if it's explicitly included in the current filter
            if (isIncluded(currentMode)) {
                const ext = node.type && node.type.startsWith('.') ? node.type : '.txt';
                const fileName = safeName.toLowerCase().endsWith(ext.toLowerCase()) ? safeName : `${safeName}${ext}`;
                const filePath = currentPath ? `${currentPath}\\${fileName}` : fileName;
                
                lines.push(`echo [BIM MOCKUP] > "${filePath}"`);
                if (node.description) {
                    lines.push(`echo Description: ${node.description.replace(/"/g, '""')} >> "${filePath}"`);
                }
            }
        }
    };

    traverse(mapData);

    lines.push("echo.");
    lines.push("echo =========================================");
    lines.push("echo   STRUCTURE CREATED SUCCESSFULLY");
    lines.push("echo =========================================");
    lines.push("pause");

    const blob = new Blob([lines.join("\r\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bim_setup_${(planName || 'plan').toLowerCase().replace(/\s+/g, '_')}.bat`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const generateCloudReport = (mapData, planName, excludedModes = new Set()) => {
    if (!mapData) return;

    const lines = [
        "=========================================",
        "   BIM CLOUD STRUCTURE REPORT (CDE)",
        "=========================================",
        `Project: ${planName || 'Unnamed Plan'}`,
        `Date: ${new Date().toLocaleString()}`,
        "-----------------------------------------",
        ""
    ];

    const traverse = (node, level = 0, parentMode = 'LOCAL') => {
        const currentMode = !node.storage_mode || node.storage_mode === 'INHERIT' ? parentMode : node.storage_mode;

        // Skip if this mode is excluded
        if (excludedModes.has(currentMode)) {
            if (node.children) {
                node.children.forEach(child => traverse(child, level, currentMode));
            }
            return;
        }
        
        // Skip nodes that are strictly LOCAL (Report is for cloud)
        if (currentMode === 'LOCAL') {
            if (node.children) {
                node.children.forEach(child => traverse(child, level, currentMode));
            }
            return;
        }

        const indent = "  ".repeat(level);
        lines.push(`${indent}${node.type === 'FOLDER' ? '[DIR]' : '[FILE]'} ${node.name} (${currentMode})`);

        if (node.children && node.children.length > 0) {
            node.children.forEach(child => traverse(child, level + 1, currentMode));
        }
    };

    traverse(mapData);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cloud_report_${(planName || 'bim_plan').toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
