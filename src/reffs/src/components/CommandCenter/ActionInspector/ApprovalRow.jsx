import React from 'react';

const ApprovalRow = ({ label, reqField, statusField, data, onChange }) => {
    const isRequired = data[reqField];
    const isApproved = data[statusField];
    return (
        <div className={`p-1.5 rounded border transition-all ${isRequired ? 'bg-white border-gray-200' : 'border-gray-100 bg-gray-50/50 opacity-70'}`}>
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" checked={!!isRequired} onChange={(e) => onChange(reqField, e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3" />
                    <span className="text-[10px] font-medium text-gray-700">{label}</span>
                </label>
                {isRequired && (
                    <label className="flex items-center gap-1 cursor-pointer select-none bg-green-50 px-2 py-0.5 rounded-full border border-green-100 hover:bg-green-100 transition-colors">
                        <input type="checkbox" checked={!!isApproved} onChange={(e) => onChange(statusField, e.target.checked)} className="rounded border-green-400 text-green-600 focus:ring-green-500 h-3 w-3" />
                        <span className="text-[9px] font-bold text-green-700 uppercase">{isApproved ? 'OK' : 'Pend'}</span>
                    </label>
                )}
            </div>
        </div>
    );
};

export default ApprovalRow;
