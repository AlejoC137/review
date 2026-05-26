const COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-teal-500',
    'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
];

export const getStaffColor = (staffId) => {
    if (!staffId) return { bar: 'bg-gray-300', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };

    let hash = 0;
    const str = String(staffId);
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
