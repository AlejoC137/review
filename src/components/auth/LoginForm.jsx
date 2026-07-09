import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import SiteLogo from '../ui/SiteLogo';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate('/roadmap');
    } catch (err) {
      setError(err.message || "Authentication failed. Verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#fcf9f4] border-2 border-[#1c1c19] relative shadow-[8px_8px_0_0_rgba(28,28,25,0.2)]">
      <div className="absolute -top-3 -right-3 w-12 h-6 bg-[#e5e2dd] border border-[#c2c7cf] rotate-12 z-20 flex items-center justify-center">
        <span className="text-[8px] text-[#493f36] font-bold tracking-widest font-mono">#42</span>
      </div>

      <div className="p-8 border-b-2 border-[#1c1c19] bg-[#f6f3ee] relative flex items-center gap-6">
        <div className=" bg-[#fcf9f4] shadow-[4px_4px_0_0_rgba(28,28,25,0.05)]">
          <SiteLogo className="w-20 h-20" color="#0f4369" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[#1c1c19] uppercase mt-0 font-mono tracking-wider">REVIEW</h2>
          <p className="text-sm font-sans text-[#1c1c19]/70 mt-1">La Herramienta de implementacion BIM</p>
        </div>
      </div>

      <div className="p-8 bg-[#fcf9f4]">
        {error && (
          <div className="mb-6 p-4 border-2 border-[#ba1a1a] bg-[#f6f3ee] relative">
            <div className="absolute -right-2 -top-2 w-6 h-6 bg-[#ba1a1a] text-white text-xs flex items-center justify-center border border-[#1c1c19] rotate-6 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] font-mono font-bold">X</div>
            <p className="font-sans text-sm text-[#ba1a1a] font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] text-[#1c1c19] font-bold uppercase tracking-widest block font-mono">
              Target [Email]
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#fcf9f4] border-2 border-[#72777f] focus:border-[#0f4369] p-3 text-sm font-sans focus:outline-none transition-colors rounded-none placeholder-[#c2c7cf] text-[#1c1c19]"
              placeholder="operator@bim.draft"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-[#1c1c19] font-bold uppercase tracking-widest flex flex-row items-center justify-between font-mono">
              <span>Pass_Key</span>
              <span className="text-[9px] text-[#493f36]">8_CHAR_MIN</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#fcf9f4] border-2 border-[#72777f] focus:border-[#0f4369] p-3 text-sm font-sans focus:outline-none transition-colors rounded-none placeholder-[#c2c7cf] text-[#1c1c19] tracking-widest"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0f4369] text-white border-2 border-transparent hover:border-[#1c1c19] p-4 text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center mt-4 active:translate-y-[2px] font-mono"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Execute Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
