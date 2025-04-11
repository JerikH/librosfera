import React from 'react';
import { Home, ShoppingBag, ShoppingCart, CreditCard, User } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, userData, isLoading, logoutUser }) => {
  // Format user name from userData
  const userName = userData ? `${userData.nombres || ''} ${userData.apellidos || ''}` : 'Usuario';
  
  // Get first letter for avatar
  const userInitial = userData && userData.nombres ? userData.nombres.charAt(0).toUpperCase() : 'U';
  
  return (
    <div className="w-[320px] bg-[#1a2235] text-white flex flex-col h-full">
      <div className="p-6 flex flex-col items-center">
        <div className="rounded-full bg-gray-200 mb-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex justify-center items-center">
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="text-gray-500 text-lg">{userInitial}</span>
            )}
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">
          {isLoading ? 'Cargando...' : userName}
        </h2>
        <button className="mt-2 bg-blue-600 text-white py-1 px-6 rounded-md text-sm">
          Editar Perfil
        </button>
      </div>
      
      <div className="bg-gray-300 text-gray-800 mx-4 mt-6 rounded-3xl p-4 flex-grow">
        <nav className="flex-1">
          <ul className="space-y-5">
            <li 
              className="flex items-center py-2 cursor-pointer" 
              onClick={() => setActiveTab('home')}
            >
              <Home size={20} className="mr-3" />
              <span className={activeTab === 'home' ? 'font-bold' : ''}>Inicio</span>
              {activeTab === 'home' && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>}
            </li>
            <li 
              className="flex items-center py-2 cursor-pointer" 
              onClick={() => setActiveTab('compras')}
            >
              <ShoppingBag size={20} className="mr-3" />
              <span className={activeTab === 'compras' ? 'font-bold' : ''}>Mis Compras</span>
              {activeTab === 'compras' && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>}
            </li>
            <li 
              className="flex items-center py-2 cursor-pointer" 
              onClick={() => setActiveTab('carrito')}
            >
              <ShoppingCart size={20} className="mr-3" />
              <span className={activeTab === 'carrito' ? 'font-bold' : ''}>Carrito de Compras</span>
              {activeTab === 'carrito' && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>}
            </li>
            <li 
              className="flex items-center py-2 cursor-pointer" 
              onClick={() => setActiveTab('tarjeta')}
            >
              <CreditCard size={20} className="mr-3" />
              <span className={activeTab === 'tarjeta' ? 'font-bold' : ''}>Agregar o editar tarjeta</span>
              {activeTab === 'tarjeta' && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>}
            </li>
            <li 
              className="flex items-center py-2 cursor-pointer" 
              onClick={() => setActiveTab('profile')}
            >
              <User size={20} className="mr-3" />
              <span className={activeTab === 'profile' ? 'font-bold' : ''}>Mi Perfil</span>
              {activeTab === 'profile' && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>}
            </li>
          </ul>
        </nav>
      </div>
      
      <div className="py-2 px-4">
        <div className="flex justify-center mb-2">
          <span className="text-xl font-bold">Librosfera</span>
        </div>
        <p className="text-center text-sm opacity-70">Tu librería de confianza</p>
      </div>
    </div>
  );
};

export default Sidebar;