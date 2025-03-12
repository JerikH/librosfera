import React, { useState } from 'react';

export default function RegistrationPage({ onBackToLogin }) {
  // State to track selected preferences
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [showPreferencesList, setShowPreferencesList] = useState(false);
  
  // Sample preferences list
  const availablePreferences = [
    'Ficción', 'No ficción', 'Ciencia ficción', 'Fantasía', 
    'Misterio', 'Romance', 'Biografía', 'Historia', 
    'Ciencia', 'Filosofía', 'Arte', 'Tecnología'
  ];
  
  // Toggle selection of a preference
  const togglePreference = (preference) => {
    if (selectedPreferences.includes(preference)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== preference));
    } else {
      setSelectedPreferences([...selectedPreferences, preference]);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Registrarse</h1>
      
      <form className="flex flex-col gap-4">
        {/* Nombre */}
        <div>
          <label className="block font-medium mb-1">Nombre</label>
          <input 
            type="text" 
            placeholder="Escribe tu nombre" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Apellido */}
        <div>
          <label className="block font-medium mb-1">Apellido</label>
          <input 
            type="text" 
            placeholder="Escribe tu apellido" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Correo */}
        <div>
          <label className="block font-medium mb-1">Correo</label>
          <input 
            type="email" 
            placeholder="Escribe tu correo" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* ID */}
        <div>
          <label className="block font-medium mb-1">ID</label>
          <input 
            type="text" 
            placeholder="Número de documento" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Dirección */}
        <div>
          <label className="block font-medium mb-1">Dirección</label>
          <input 
            type="text" 
            placeholder="Escribe su dirección" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Género */}
        <div>
          <label className="block font-medium mb-1">Género</label>
          <input 
            type="text" 
            placeholder="Escribe su género" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Usuario */}
        <div>
          <label className="block font-medium mb-1">Usuario</label>
          <input 
            type="text" 
            placeholder="Escribe su usuario" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Contraseña */}
        <div>
          <label className="block font-medium mb-1">Contraseña</label>
          <input 
            type="password" 
            placeholder="Escribe su contraseña" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Preferencias - Multi-Select */}
        <div className="relative">
          <label className="block font-medium mb-1">Preferencias</label>
          <div 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 flex justify-between items-center cursor-pointer"
            onClick={() => setShowPreferencesList(!showPreferencesList)}
          >
            <div className="truncate">
              {selectedPreferences.length > 0 
                ? selectedPreferences.join(', ') 
                : "Selecciona preferencias"}
            </div>
            <div className="text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
          
          {/* Dropdown Selection */}
          {showPreferencesList && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {availablePreferences.map((preference) => (
                <div 
                  key={preference}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => togglePreference(preference)}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedPreferences.includes(preference)}
                    onChange={() => {}}
                    className="mr-2"
                  />
                  {preference}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Fecha de Nacimiento */}
        <div>
          <label className="block font-medium mb-1">Fecha de Nacimiento</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="mm / dd / yyyy" 
              className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Lugar de Nacimiento */}
        <div>
          <label className="block font-medium mb-1">Lugar de Nacimiento</label>
          <input 
            type="text" 
            placeholder="Lugar de nacimiento" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Submit Buttons */}
        <div className="mt-4 flex flex-col gap-2">
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white py-3 rounded font-medium hover:bg-blue-600 transition-colors"
          >
            Registrarse
          </button>
          
          <button 
            type="button" 
            className="w-full text-blue-500 py-2 rounded font-medium hover:underline"
            onClick={onBackToLogin}
          >
            Iniciar sesión
          </button>
        </div>
      </form>
    </div>
  );
}