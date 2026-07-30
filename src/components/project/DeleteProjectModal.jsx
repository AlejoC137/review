import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, AlertTriangle, Lock, ShieldAlert, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { lifecycleService } from '../../services/lifecycleService';
import { useAuth } from '../../context/AuthContext';

export default function DeleteProjectModal({ isOpen, onClose, project, onProjectDeleted }) {
  const { user, isAdmin } = useAuth();
  
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setPassword('');
    setConfirmName('');
    setErrorMsg(null);
    setVerifyingPassword(false);
    setDeleting(false);
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  // Verification Step 1: Admin password check
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Debes ingresar tu clave de Administrador.');
      return;
    }

    setVerifyingPassword(true);
    setErrorMsg(null);

    try {
      // Check user password
      if (user?.password && user.password === password) {
        setStep(2);
        setErrorMsg(null);
        return;
      }

      // Check via Supabase query if user object password isn't directly matched
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user?.id || localStorage.getItem('custom_user_id'))
        .eq('password', password)
        .maybeSingle();

      if (!error && data) {
        setStep(2);
        setErrorMsg(null);
      } else {
        setErrorMsg('Clave de administrador incorrecta. Verifica tu contraseña.');
      }
    } catch (err) {
      console.error("Error verificando clave:", err);
      setErrorMsg('Error al verificar la clave de seguridad.');
    } finally {
      setVerifyingPassword(false);
    }
  };

  // Step 2: Final deletion confirmation
  const handleFinalDelete = async (e) => {
    e.preventDefault();

    if (confirmName.trim().toLowerCase() !== project.name.trim().toLowerCase()) {
      setErrorMsg(`El nombre ingresado no coincide con "${project.name}".`);
      return;
    }

    setDeleting(true);
    setErrorMsg(null);

    try {
      await lifecycleService.deleteProject(project.id);
      if (onProjectDeleted) {
        await onProjectDeleted(project.id);
      }
      onClose();
    } catch (err) {
      console.error("Error al eliminar proyecto:", err);
      setErrorMsg(err.message || 'Ocurrió un error al eliminar el proyecto.');
    } finally {
      setDeleting(false);
    }
  };

  const isNameMatched = confirmName.trim().toLowerCase() === project.name.trim().toLowerCase();

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div 
        className="bg-[#fcf9f4] border-2 border-red-700 w-full max-w-lg shadow-[12px_12px_0_0_rgba(185,28,28,1)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b-2 border-red-700 bg-red-700 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 border border-white/20">
              <ShieldAlert size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-mono text-base font-black tracking-wider uppercase leading-none">
                ELIMINAR PROYECTO
              </h2>
              <span className="text-[10px] font-mono text-red-100 uppercase tracking-widest font-bold">
                PASO {step} DE 2 — CONFIRMACIÓN DE SEGURIDAD
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="hover:bg-white/10 p-1.5 transition-colors border border-transparent text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-2 border-b-2 border-[#1c1c19] text-center font-mono text-[10px] font-black uppercase tracking-wider">
          <div className={`py-2 border-r-2 border-[#1c1c19] ${step === 1 ? 'bg-red-100 text-red-900 font-extrabold' : 'bg-gray-100 text-gray-400'}`}>
            1. Verificación de Clave
          </div>
          <div className={`py-2 ${step === 2 ? 'bg-red-600 text-white font-extrabold' : 'bg-gray-100 text-gray-400'}`}>
            2. Confirmación Definitiva
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-5 bg-red-100 border-2 border-red-700 text-red-900 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* STEP 1: PASSWORD CONFIRMATION */}
          {step === 1 && (
            <form onSubmit={handleVerifyPassword} className="space-y-5">
              <div className="bg-amber-50 border-2 border-amber-500 p-4 flex gap-3 items-start">
                <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs font-sans text-amber-950">
                  <p className="font-bold mb-1 uppercase font-mono text-amber-900">Acción de Administrador Requerida</p>
                  <p>Vas a eliminar el proyecto <strong className="uppercase font-mono underline">{project.name}</strong>. Para continuar, confirma tu identidad de administrador ingresando tu contraseña.</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-black uppercase text-[#1c1c19] tracking-wider mb-2 flex items-center gap-1.5">
                  <Lock size={14} className="text-red-700" />
                  Contraseña de Administrador <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border-2 border-[#1c1c19] px-4 py-3 text-sm font-mono font-bold text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-red-600 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-[#1c1c19]/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-mono text-xs font-black uppercase tracking-wider hover:bg-[#e5e2dd] transition-all shadow-[3px_3px_0_0_rgba(28,28,25,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={verifyingPassword || !password}
                  className="px-6 py-2.5 bg-red-700 text-white border-2 border-[#1c1c19] font-mono text-xs font-black uppercase tracking-wider hover:bg-black transition-all flex items-center gap-2 shadow-[3px_3px_0_0_rgba(28,28,25,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
                >
                  {verifyingPassword ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar Clave</span>
                      <ArrowRight size={16} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: DOUBLE CONFIRMATION WITH PROJECT NAME */}
          {step === 2 && (
            <form onSubmit={handleFinalDelete} className="space-y-5">
              <div className="bg-red-100 border-2 border-red-700 p-4 flex gap-3 items-start text-red-950">
                <ShieldAlert size={28} className="text-red-700 shrink-0 mt-0.5" />
                <div className="text-xs font-sans">
                  <p className="font-mono font-black uppercase text-red-900 text-sm mb-1">¡ADVERTENCIA IRREVERSIBLE!</p>
                  <p className="leading-snug">Esta acción eliminará el proyecto <strong className="font-mono font-bold uppercase underline">{project.name}</strong> y toda su información, tableros, subproyectos y materiales asociados.</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-black uppercase text-[#1c1c19] tracking-wider mb-2">
                  Escribe exactamente el nombre del proyecto para confirmar:
                </label>
                <div className="p-2.5 bg-white border-2 border-[#1c1c19] mb-2 font-mono font-black text-center text-xs tracking-wider uppercase text-red-700 selection:bg-red-200">
                  {project.name}
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Escribe el nombre del proyecto aquí..."
                  className="w-full bg-white border-2 border-[#1c1c19] px-4 py-3 text-xs font-mono font-bold text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-red-600 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] transition-all uppercase"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t-2 border-[#1c1c19]/10">
                <button
                  type="button"
                  onClick={() => { setStep(1); setErrorMsg(null); }}
                  className="text-xs font-mono font-bold text-gray-600 underline hover:text-black uppercase"
                >
                  ← Volver al Paso 1
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-mono text-xs font-black uppercase tracking-wider hover:bg-[#e5e2dd] transition-all shadow-[3px_3px_0_0_rgba(28,28,25,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={deleting || !isNameMatched}
                    className="px-6 py-2.5 bg-red-700 text-white border-2 border-[#1c1c19] font-mono text-xs font-black uppercase tracking-wider hover:bg-black transition-all flex items-center gap-2 shadow-[3px_3px_0_0_rgba(28,28,25,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} strokeWidth={2.5} />
                        <span>ELIMINAR DEFNIITIVAMENTE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
