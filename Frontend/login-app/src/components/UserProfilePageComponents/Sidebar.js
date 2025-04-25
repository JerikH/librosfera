import React, { useState } from 'react';
import { logoutUser } from './authUtils';
import CachedImage from '../CachedImage';

const Sidebar = ({ activeTab, setActiveTab, userData, isLoading, onEditProfile, onDataRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Elementos de navegación con iconos SVG
  const navItems = [
    { 
      id: 'home', 
      name: 'Inicio', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    { 
      id: 'profile', 
      name: 'Perfil', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    { 
      id: 'compras', 
      name: 'Mis Compras', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      )
    },
    { 
      id: 'carrito', 
      name: 'Carrito', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      )
    },
    { 
      id: 'tarjeta', 
      name: 'Método de Pago', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )
    }
  ];

  // Define profile image base URL
  const PROFILE_PIC_BASE_URL = '';
  const DEFAULT_PROFILE_PIC = 'http://localhost:5000/uploads/profiles/default.jpg';

  // Handle tab click - now just using the data passed from parent
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  // Determine profile image source
  const getProfileImageSrc = () => {
    if (userData?.foto_perfil) {
      return `${PROFILE_PIC_BASE_URL}${userData.foto_perfil}`;
    } else if (userData?.profileImage) {
      return userData.profileImage;
    } else {
      return `${PROFILE_PIC_BASE_URL}${DEFAULT_PROFILE_PIC}`;
    }
  };

  // Handle edit profile - no refresh needed here since EditProfile will handle it
  const handleEditProfile = () => {
    onEditProfile();
  };

  return (
    
    <div className="w-64 bg-gray-700 h-full flex flex-col">
      {/* User info */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden mb-3">
          {isLoading || refreshing ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <CachedImage 
              src={getProfileImageSrc()}
              alt={userData?.usuario || 'Usuario'} 
              className="w-full h-full object-cover"
              fallbackSrc={`${PROFILE_PIC_BASE_URL}${DEFAULT_PROFILE_PIC}`}
              fallbackComponent={
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <span className="text-2xl text-gray-700">
                    {userData?.usuario?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              }
            />
          )}
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">
          {isLoading || refreshing ? 'Cargando...' : (userData?.usuario || 'Usuario')}
        </h2>
        <button 
          onClick={handleEditProfile}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          disabled={isLoading || refreshing}
        >
          Editar Perfil
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="bg-gray-200 rounded-lg shadow-sm overflow-hidden">
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center py-3 px-4 ${
                    activeTab === item.id
                      ? 'bg-gray-300 text-blue-600 border-l-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={refreshing}
                >
                  <span className={`mr-3 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Logout button with refresh */}
      <div className="px-6 py-2">
        <button 
          onClick={() => logoutUser()}
          className="w-full flex items-center py-3 px-4 text-left text-gray-300 hover:bg-[#2D3958] hover:text-white rounded"
        >
          <span className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Company logo at bottom */}
      <div className="p-1 border-t border-[#2D3958] text-center">
        <h3 className="text-white text-xl font-bold">Librosfera</h3>
        <p className="text-gray-400 text-sm">Tu librería de confianza</p>
      </div>
    </div>
  );
};

export default Sidebar;