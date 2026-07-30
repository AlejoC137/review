import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('custom_user_admin') === 'true';
  });
  const [isBimManager, setIsBimManager] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const setBimManager = (finished) => {
    setIsBimManager(finished);
  };

  useEffect(() => {
    // Check local storage for persistent custom session from user_profiles
    const storedUserId = localStorage.getItem('custom_user_id');
    if (storedUserId) {
      checkUserSession(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const checkUserSession = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        // Evaluate finished identically to how signIn evaluates it
        if (data.finished === false) {
          localStorage.removeItem('custom_user_id');
          setUser(null);
          setIsAdmin(false);
        } else {
          setUser(data);
          const adminValue = data.admin;
          const calculatedIsAdmin = adminValue === true || adminValue === 'true' || adminValue === 1 || adminValue === 'TRUE';
          setIsAdmin(calculatedIsAdmin);
          localStorage.setItem('custom_user_admin', String(calculatedIsAdmin));
          localStorage.setItem('custom_user_mail', data.mail || '');
          const bimManagerValue = data.bim_manager;
          setIsBimManager(bimManagerValue === true || bimManagerValue === 'true' || bimManagerValue === 1 || bimManagerValue === 'TRUE');
          const demoMode = data.mail === 'demo@arca.com';
          setIsDemo(demoMode);
          if (demoMode) {
            localStorage.setItem('isDemo', 'true');
          } else {
            localStorage.removeItem('isDemo');
          }
        }
      } else {
        // Invalid session or user deleted
        console.error("Session fetch failed or user not found:", error);
        localStorage.removeItem('custom_user_id');
        localStorage.removeItem('custom_user_admin');
        localStorage.removeItem('custom_user_mail');
        setUser(null);
        setIsAdmin(false);
        setIsDemo(false);
        localStorage.removeItem('isDemo');
      }
    } catch (err) {
      console.error("Session check error:", err);
      localStorage.removeItem('custom_user_id');
      localStorage.removeItem('custom_user_admin');
      localStorage.removeItem('custom_user_mail');
      setUser(null);
      setIsAdmin(false);
      setIsDemo(false);
      localStorage.removeItem('isDemo');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAdmin,
    isBimManager,
    isDemo,
    setBimManager,
    signIn: async (email, password) => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('mail', email)
          .eq('password', password)
          .single();

        if (error || !data) {
          return { error: new Error("Credenciales inválidas, verifica tu correo o contraseña.") };
        }

        if (data.finished === false) {
          return { error: new Error("Esta cuenta ha sido desactivada por un administrador.") };
        }

        // Custom Login Success
        localStorage.setItem('custom_user_id', data.id);
        setUser(data);
        const adminValue = data.admin;
        const calculatedIsAdmin = adminValue === true || adminValue === 'true' || adminValue === 1 || adminValue === 'TRUE';
        setIsAdmin(calculatedIsAdmin);
        localStorage.setItem('custom_user_admin', String(calculatedIsAdmin));
        localStorage.setItem('custom_user_mail', data.mail || '');
        const bimManagerValue = data.bim_manager;
        setIsBimManager(bimManagerValue === true || bimManagerValue === 'true' || bimManagerValue === 1 || bimManagerValue === 'TRUE');
        const demoMode = data.mail === 'demo@arca.com';
        setIsDemo(demoMode);
        if (demoMode) {
          localStorage.setItem('isDemo', 'true');
        } else {
          localStorage.removeItem('isDemo');
        }

        return { error: null };
      } catch (err) {
        return { error: new Error("Error interno de conexión.") };
      }
    },
    signOut: async () => {
      localStorage.removeItem('custom_user_id');
      localStorage.removeItem('custom_user_admin');
      localStorage.removeItem('custom_user_mail');
      setUser(null);
      setIsAdmin(false);
      setIsDemo(false);
      localStorage.removeItem('isDemo');
      return { error: null };
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
