import React from 'react';
import { logoutUser } from './authUtils';

const Sidebar = ({ activeTab, setActiveTab, userData, isLoading, onEditProfile }) => {
  // Elementos de navegación
  const navItems = [
    { id: 'home', name: 'Dashboard', icon: 'dashboard' },
    { id: 'profile', name: 'Perfil', icon: 'person' },
    { id: 'compras', name: 'Mis Compras', icon: 'shopping_bag' },
    { id: 'carrito', name: 'Carrito', icon: 'shopping_cart' },
    { id: 'tarjeta', name: 'Método de Pago', icon: 'credit_card' }
  ];

  return (
    <div className="w-64 bg-gray-700 h-full flex flex-col">
      {/* User info */}
      <div className="flex flex-col items-center justify-center py-8 border-b border-gray-600">
        <div className="w-24 h-24 bg-white rounded-full overflow-hidden mb-4">
          {userData?.profileImage ? (
            <img 
              src={userData.profileImage} 
              alt={userData.usuario} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-yellow-200">
              <span className="text-4xl font-bold text-yellow-500">
                {userData?.usuario?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
        <h2 className="text-white text-xl font-semibold mb-1">
          {isLoading ? 'Cargando...' : (userData?.usuario || 'Usuario')}
        </h2>
        <p className="text-gray-300 text-sm mb-3">
          {isLoading ? '' : (userData?.email || '')}
        </p>
        <button 
          onClick={onEditProfile}
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Editar Perfil
        </button>
      </div>

      {/* Navigation */}
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
                <span className="material-icons-outlined mr-3">{item.icon}</span>
                <span>{item.name}</span>
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