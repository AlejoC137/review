import React, { useState } from 'react';
import { X, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminModal({ isOpen, onClose }) {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] w-full max-w-sm shadow-[8px_8px_0_0_rgba(28,28,25,0.2)]">
        <div className="flex justify-between items-center border-b-2 border-[#1c1c19] bg-[#e5e2dd] p-4">
          <div className="flex items-center space-x-2">
            {isAdmin ? <Unlock size={18} className="text-[#0f4369]" /> : <Lock size={18} className="text-[#1c1c19]" />}
            <h2 className="font-display font-bold text-[#1c1c19] tracking-widest uppercase">System Config</h2>
          </div>
          <button onClick={onClose} className="hover:bg-[#1c1c19] hover:text-white p-1 transition-colors border-2 border-transparent">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {isAdmin ? (
            <div className="text-center">
              <p className="text-[#1c1c19] font-sans mb-6">Admin mode is currently active.</p>
              <button 
                onClick={async () => {
                  await signOut();
                  onClose();
                  navigate('/');
                }}
                className="w-full bg-[#1c1c19] text-white border-2 border-[#1c1c19] font-display font-bold tracking-widest uppercase py-3 hover:bg-[#e5e2dd] hover:text-[#1c1c19] transition-colors"
              >
                Sign Out / Deactivate
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[#1c1c19] text-sm font-sans mb-4">You must authenticate via the portal to access admin features.</p>
              <button 
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="w-full bg-[#0f4369] text-white border-2 border-[#1c1c19] font-display font-bold tracking-widest uppercase py-3 hover:bg-[#1c1c19] transition-colors shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]"
              >
                Proceed to Auth Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
