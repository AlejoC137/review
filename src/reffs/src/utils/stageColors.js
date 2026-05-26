const COLORS = [
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
    'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500',
    'bg-slate-500', 'bg-gray-500', 'bg-zinc-500',
    'bg-neutral-500', 'bg-stone-500', 'bg-red-400'
];

export const getStageColor = (stageId) => {
    if (!stageId) return { bar: 'bg-gray-300', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };

    let hash = 0;
    const str = String(stageId);
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;

    const baseColor = COLORS[index];

    return {
        bar: baseColor,
        bg: baseColor.replace('500', '50'),
        text: baseColor.replace('bg-', 'text-').replace('500', '700'),
        border: baseColor.replace('bg-', 'border-').replace('500', '200')
    };
};
