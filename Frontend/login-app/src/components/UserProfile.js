import React from 'react';
import { Home, ShoppingBag, ShoppingCart, CreditCard, BookOpen, Heart, DollarSign } from 'lucide-react';

const UserProfile = () => {
  return (
    <div className="flex h-screen bg-[#f9fafb]">
      {/* Left sidebar - Column 1 */}
      <div className="w-[320px] bg-[#1a2235] text-white flex flex-col">
        <div className="p-6 flex flex-col items-center">
          <div className="rounded-full bg-gray-200 mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex justify-center items-center">
              <span className="text-gray-500 text-lg">Usuario</span>
            </div>
          </div>
          <h2 className="text-lg font-bold mb-2">Juan Esteban</h2>
          <button className="mt-2 bg-blue-600 text-white py-1 px-6 rounded-md text-sm">
            Editar Perfil
          </button>
        </div>
        
        <div className="bg-gray-300 text-gray-800 mx-4 mt-6 rounded-3xl p-4">
          <nav className="flex-1">
            <ul className="space-y-5">
              <li className="flex items-center py-2">
                <Home size={20} className="mr-3" />
                <span className="font-bold">Inicio</span>
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
              </li>
              <li className="flex items-center py-2">
                <ShoppingBag size={20} className="mr-3" />
                <span>Mis Compras</span>
              </li>
              <li className="flex items-center py-2">
                <ShoppingCart size={20} className="mr-3" />
                <span>Carrito de Compras</span>
              </li>
              <li className="flex items-center py-2">
                <CreditCard size={20} className="mr-3" />
                <span>Agregar o editar tarjeta</span>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="p-4 mt-auto">
          <div className="flex justify-center mb-2">
            <span className="text-xl font-bold">Librosfera</span>
          </div>
          <p className="text-center text-sm opacity-70">Tu librería de confianza</p>
        </div>
      </div>
      
      {/* Main content - Using flex for the 2 remaining columns */}
      <div className="flex-1 flex">
        {/* Middle column - Column 2 (larger) */}
        <div className="w-2/3 p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">Buenos Días, <span className="text-gray-400">Juan Esteban</span></h1>
          </header>
          
          {/* Balance Card - Credit card dimensions */}
          <div className="bg-gray-600 text-white rounded-lg p-5 mb-8 w-96 h-56 flex flex-col justify-between">
            <div>
              <div className="text-sm">Saldo disponible</div>
              <div className="text-3xl font-bold mt-1">$ 8,000</div>
            </div>
            <div className="h-24">
              <svg viewBox="0 0 300 50" className="w-full h-full">
                <path d="M0,25 L50,10 L100,30 L150,5 L200,15 L250,30 L300,15" fill="none" stroke="#3b82f6" strokeWidth="2" />
                <path d="M150,25 L200,35 L250,15 L300,25" fill="none" stroke="#fff" strokeWidth="1" strokeOpacity="0.3" />
              </svg>
            </div>
          </div>
          
          {/* Recent Purchases */}
          <div>
            <h2 className="text-xl font-bold mb-4">Compras recientes</h2>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="border-b pb-5 mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-amber-100 border border-amber-200 flex justify-center items-center mr-3 p-1">
                      <div className="text-center text-xs">
                        <div>Libro</div>
                        <div>5</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="truncate max-w-[120px] mr-3">Libro 5</div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full whitespace-nowrap">Devolución Disponible</span>
                    </div>
                  </div>
                  <div className="font-bold">$ 14,200.00</div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-red-100 border border-red-200 flex justify-center items-center mr-3 p-1">
                      <div className="text-center text-xs">
                        <div>Libro</div>
                        <div>4</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="truncate max-w-[120px] mr-3">Libro 4</div>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full whitespace-nowrap">Devolución no disponible</span>
                    </div>
                  </div>
                  <div className="font-bold">$ 12,999.00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Column 3 (smaller) */}
        <div className="w-1/3 p-6">
          <div className="mb-8">
            {/* Search bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Buscar libro..."
                className="w-full border rounded-md py-2 px-3 pr-8"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          
            {/* Your Books */}
            <div>
              <h2 className="text-xl font-bold mb-4">Tus libros</h2>
              <div className="bg-gray-100 rounded-lg shadow p-5 flex flex-col">
                <div className="flex-grow overflow-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                  <ul className="space-y-4">
                    <li className="flex items-center">
                      <div className="w-12 h-16 bg-black rounded flex justify-center items-center mr-3">
                        <Heart size={18} className="text-white" />
                      </div>
                      <span>Libro 1</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-12 h-16 bg-amber-100 border border-amber-200 rounded flex justify-center items-center mr-3">
                        <BookOpen size={18} className="text-amber-800" />
                      </div>
                      <span>Libro 2</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-12 h-16 bg-amber-100 border border-amber-200 rounded flex justify-center items-center mr-3">
                        <BookOpen size={18} className="text-amber-800" />
                      </div>
                      <span>Libro 3</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-12 h-16 bg-black rounded flex justify-center items-center mr-3">
                        <BookOpen size={18} className="text-white" />
                      </div>
                      <span>Libro 4</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-12 h-16 bg-amber-100 border border-amber-200 rounded flex justify-center items-center mr-3">
                        <BookOpen size={18} className="text-amber-800" />
                      </div>
                      <span>Libro 5</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-12 h-16 bg-blue-100 border border-blue-300 rounded flex justify-center items-center mr-3">
                        <DollarSign size={18} className="text-blue-800" />
                      </div>
                      <span>Libro 6</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2 text-right border-t mt-3">
                  <a href="#" className="text-blue-600 text-sm hover:underline">Ver todos los libros</a>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;