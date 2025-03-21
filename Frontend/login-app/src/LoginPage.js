import React, { useState } from 'react';
import RegistrationPage from './RegistrationPage'; // Import the registration component
import PasswordResetPage from './PasswordResetPage'; // Import the password reset component

export default function LoginPage() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  
  // If registration page should be shown, render it instead
  if (showRegistration) {
    return <RegistrationPage onBackToLogin={() => setShowRegistration(false)} />;
  }
  
  // If password reset page should be shown, render it instead
  if (showPasswordReset) {
    return <PasswordResetPage onBackToLogin={() => setShowPasswordReset(false)} />;
  }

  return (
    <div className="flex h-screen w-full">
      {/* Left Side - Black Background with Logo */}
      <div className="hidden md:flex md:w-1/2 bg-black text-white flex-col items-center justify-center">
        <div className="mb-6 w-2/5">
          <img 
            src="/l2.png" 
            alt="Librosfera Logo" 
            className="w-full h-auto"
          />
        </div>
        <h1 className="text-5xl font-bold mb-2">Librosfera</h1>
        <p className="text-xl">Tu librería de confianza</p>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col h-full">
        <div className="flex flex-col justify-between h-full p-10">
          {/* Top Section (Only visible on mobile) */}
          <div className="md:hidden flex flex-col items-center mb-6">
            <div className="w-2/5 mb-4">
              <img 
                src="/l2.png" 
                alt="Librosfera Logo" 
                className="w-full h-auto"
              />
            </div>
            <h1 className="text-3xl font-bold">Librosfera</h1>
          </div>
          
          {/* Login Form Section */}
          <div className="flex-grow flex flex-col justify-center">
            <h2 className="text-4xl font-bold mb-6">Iniciar Sesión</h2>
            <p className="mb-6">
              ¿No tienes cuenta? <a 
                href="#" 
                className="text-blue-600 font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRegistration(true);
                }}
              >
                Crear Cuenta
              </a>
            </p>
            
            <form className="w-full max-w-lg">
              {/* Email Field */}
              <div className="mb-6">
                <input
                  type="email"
                  placeholder="Correo Electrónico"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              {/* Password Field */}
              <div className="mb-6">
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              {/* Remember Me and Change Password */}
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center select-none">
                  <input type="checkbox" className="mr-2" />
                  Recordarme
                </label>
                <a 
                  href="#" 
                  className="text-gray-500"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPasswordReset(true);
                  }}
                >
                  Cambiar Contraseña
                </a>
              </div>
              
              {/* Login Button */}
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar sesión
              </button>
            </form>
          </div>
          
          {/* Bottom Registration Link */}
          <div className="mt-auto">
            <p className="text-gray-500 text-center">
              ¿Eres nuevo? <a 
                href="/Register" 
                className="text-blue-600 font-medium"
              >
                Registrarse
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}