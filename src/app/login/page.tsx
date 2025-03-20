'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux'; // Importar useDispatch de react-redux
import { login } from '../redux/authSlice'; // Acción para almacenar el token en Redux

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const dispatch = useDispatch(); // Inicializar el dispatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiar errores antes de enviar

    try {
      // Enviar credenciales al backend
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      // Si la respuesta es exitosa, obtener el token
      const token = response.data.token;

      // Despachar la acción para almacenar el token en Redux
      dispatch(login(token));

      // Guardar el token en el localStorage (si necesitas también hacerlo)
      localStorage.setItem('authToken', token);

      // Redirigir al dashboard o página principal
      router.push('/dashboard'); // Cambia esto por la ruta correspondiente
    } catch (error: any) {
      setError('Credenciales incorrectas o error en la solicitud');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 hover:scale-105">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-800">Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 text-gray-700"
              placeholder="Ingresa tu correo electrónico"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 text-gray-700"
              placeholder="Ingresa tu contraseña"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            Iniciar sesión
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">¿No tienes una cuenta? <a href="/register" className="text-blue-600 hover:underline">Regístrate</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
