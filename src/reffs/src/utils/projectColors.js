const COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500'
];

export const getProjectColor = (projectId) => {
    // Simple hash simulado para demo. En prod usa el ID real.
    if (!projectId) return { bar: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

    // Use a simple hash code of the string
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
        hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;

    const baseColor = COLORS[index];

    // Retornamos clases de Tailwind para borde y fondo sutil
    return {
        bar: baseColor,
        bg: baseColor.replace('500', '50'),  // Fondo muy suave
        text: baseColor.replace('bg-', 'text-').replace('500', '700'), // Texto oscuro legible
        border: baseColor.replace('bg-', 'border-').replace('500', '200')
    };
};
