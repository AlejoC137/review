import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';



const UserCreationForm = () => {
  const [formData, setFormData] = useState({
    userName: '',
    mail: '',
    password: '',
    finished: true,
    admin: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [createdProfile, setCreatedProfile] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setCreatedProfile(null);

    try {
      // Create user directly in the user_profiles table 
      const payload = {
        userName: formData.userName,
        mail: formData.mail,
        password: formData.password,
        finished: formData.finished,
        admin: formData.admin
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([payload])
        .select();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil de usuario creado exitosamente.' });
      if (data && data.length > 0) {
        setCreatedProfile(data[0]);
      }

      setFormData({ userName: '', mail: '', password: '', finished: true, admin: false });

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error al crear el perfil de usuario.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <div className="bg-white border-2 border-neutral-900 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] p-8 max-w-md w-full rounded-none">
        <h2 className="text-2xl font-bold font-space text-neutral-900 mb-6 uppercase tracking-tight border-b-2 border-neutral-900 pb-2">
          Crear Perfil de Usuario
        </h2>

        {message.text && (
          <div className={`mb-6 p-4 border-2 font-mono text-sm ${message.type === 'success' ? 'bg-green-100 border-green-900 text-green-900' : 'bg-red-100 border-red-900 text-red-900'}`}>
            {message.text}
          </div>
        )}

        {createdProfile && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-900 text-blue-900 font-mono text-sm break-all">
            <p className="font-bold mb-2">Perfil creado con ID:</p>
            <p className="select-all bg-white p-2 border border-blue-200">{createdProfile.id}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2 font-space">Nombre de Usuario (userName)</label>
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="e.g. Juan Perez"
              required
              className="w-full p-3 bg-neutral-50 border-2 border-neutral-900 focus:outline-none focus:ring-0 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2 font-space">Correo Electrónico (mail)</label>
            <input
              type="email"
              name="mail"
              value={formData.mail}
              onChange={handleChange}
              placeholder="usuario@ejemplo.com"
              required
              className="w-full p-3 bg-neutral-50 border-2 border-neutral-900 focus:outline-none focus:ring-0 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2 font-space">Contraseña (password)</label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full p-3 bg-neutral-50 border-2 border-neutral-900 focus:outline-none focus:ring-0 font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-3 bg-neutral-50 p-3 border-2 border-neutral-900">
            <input
              type="checkbox"
              name="finished"
              checked={formData.finished}
              onChange={handleChange}
              id="finished-checkbox"
              className="h-5 w-5 border-2 border-neutral-900 text-teal-600 focus:ring-teal-500 rounded-none cursor-pointer"
            />
            <label htmlFor="finished-checkbox" className="text-sm font-bold text-neutral-900 font-space cursor-pointer">
              Estado Activo (finished)
            </label>
          </div>

          <div className="flex items-center space-x-3 bg-neutral-50 p-3 border-2 border-neutral-900">
            <input
              type="checkbox"
              name="admin"
              checked={formData.admin}
              onChange={handleChange}
              id="admin-checkbox"
              className="h-5 w-5 border-2 border-neutral-900 text-teal-600 focus:ring-teal-500 rounded-none cursor-pointer"
            />
            <label htmlFor="admin-checkbox" className="text-sm font-bold text-neutral-900 font-space cursor-pointer">
              Es Administrador (admin)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-space font-bold py-3 px-4 border-2 border-neutral-900 drop-shadow-[2px_2px_0_rgba(0,0,0,1)] hover:drop-shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'CREANDO PERFIL...' : 'CREAR PERFIL'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserCreationForm;
