import React from 'react';
import { logoutUser } from '../UserProfilePageComponents/authUtils';

const Sidebar = ({ activeTab, setActiveTab, userData, isLoading, onEditProfile }) => {
  // Función para manejar el logout
  const handleLogout = async () => {
    await logoutUser();
    window.location.replace('/Login');
  };

  // Elementos de navegación para el administrador
  const navItems = [
    { id: 'inicio', name: 'Inicio', icon: 'inicio' },
    { id: 'administrar-libro', name: 'Administrar Libros', icon: 'libro' },
    { id: 'gestionar-usuarios', name: 'Gestionar Usuarios', icon: 'usuarios' },
    { id: 'gestionar-mensajes', name: 'Gestionar Mensajes', icon: 'mensaje' },
    { id: 'mi-perfil', name: 'Mi Perfil', icon: 'perfil' }
  ];

  return (
    <div className="w-64 bg-gray-700 h-full flex flex-col">
      {/* User info section at the top */}
      <div className="flex flex-col items-center justify-center py-8 border-b border-gray-600">
        <div className="w-24 h-24 bg-white rounded-full overflow-hidden mb-4">
          {userData?.profileImage ? (
            <img 
              src={userData.profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-yellow-200">
              <span className="text-4xl font-bold text-yellow-500">
                {userData?.usuario?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
          )}
        </div>
        <h2 className="text-white text-xl font-semibold mb-1">
          {isLoading ? 'Cargando...' : (userData?.usuario || 'Admin')}
        </h2>
        
        <button 
          onClick={onEditProfile}
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Editar Perfil
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center py-3 px-6 text-left ${
                  activeTab === item.id
                    ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {/* Reemplazamos los iconos con símbolos en español */}
                <span className="material-icons-outlined mr-3">
                  {item.icon === 'inicio' && 'home'}
                  {item.icon === 'libro' && 'book'}
                  {item.icon === 'usuarios' && 'people'}
                  {item.icon === 'mensaje' && 'mail'}
                  {item.icon === 'perfil' && 'person'}
                </span>
                <span>{item.name}</span>
                {activeTab === item.id && item.id === 'administrar-libro' && (
                  <span className="ml-auto mr-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Company logo at bottom */}
      <div className="p-4 border-t border-gray-600 text-center">
        <h3 className="text-white text-xl font-bold">Librosfera</h3>
        <p className="text-gray-400 text-sm">Tu librería de confianza</p>
      </div>
    </div>
  );
};

export default Sidebar;