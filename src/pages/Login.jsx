import React from 'react';
import LoginForm from '../components/auth/LoginForm';




export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans" style={{ backgroundColor: '#fcf9f4' }}>
      <div className="absolute top-8 left-8 bottom-8 right-8 border-2 border-[#c2c7cf]/30 pointer-events-none md:block hidden">
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#72777f]" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#72777f]" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#72777f]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#72777f]" />
      </div>

      <div className="relative z-10 w-full px-4 flex justify-center">
        <LoginForm />
      </div>

      <div className="absolute bottom-12 right-12 text-[10px] text-[#72777f] hidden md:block uppercase tracking-widest text-right font-mono">
        <span className="block mb-1 text-[#493f36] font-bold">Draft No. 1.0</span>
        BIM Implementation Protocol
      </div>
    </div>
  );
}
