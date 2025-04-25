import React, { useState, useEffect } from 'react';

const Dashboard = ({ userData, onEditProfile }) => {
  const [balance, setBalance] = useState(8000);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [userLibrary, setUserLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulación de carga de datos
    const loadData = async () => {
      try {
        // Aquí se podrían hacer llamadas API para obtener los datos reales
        setTimeout(() => {
          // Datos de ejemplo para compras recientes
          const purchasesData = [
            {
              id: 1,
              bookId: 5,
              title: 'Libro 5',
              price: 14200.00,
              returnable: true,
              date: '2023-11-05'
            },
            {
              id: 2,
              bookId: 4,
              title: 'Libro 4',
              price: 12999.00,
              returnable: false,
              date: '2023-10-28'
            }
          ];
          
          // Datos de ejemplo para la biblioteca del usuario
          const libraryData = [
            { id: 2, title: 'Libro 2', type: 'book' },
            { id: 3, title: 'Libro 3', type: 'book' },
            { id: 4, title: 'Libro 4', type: 'book', featured: true },
            { id: 5, title: 'Libro 5', type: 'book' },
            { id: 6, title: 'Libro 6', type: 'course' }
          ];
          
          setRecentPurchases(purchasesData);
          setUserLibrary(libraryData);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Cargando información...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Buenos Días, <span className="text-gray-400">{userData?.usuario || userData?.username}</span>
        </h1>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Buscar libro..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          {/* Balance card */}
          <div className="bg-[#515F7D] rounded-lg p-6 h-48 mb-6 relative overflow-hidden">
            <div>
              <p className="text-gray-300 mb-1">Saldo disponible</p>
              <h3 className="text-white text-3xl font-bold">$ {balance.toLocaleString('es-CO')}</h3>
            </div>
            
            {/* Graph visualization (simplified) */}
            <div className="absolute bottom-0 left-0 right-0 h-24">
              <svg viewBox="0 0 400 100" className="w-full h-full">
                <path
                  d="M0,50 Q50,30 100,50 T200,60 T300,40 T400,50"
                  fill="none"
                  stroke="#4287f5"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
          
          {/* Recent purchases */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Compras recientes</h2>
            <div className="space-y-4">
              {recentPurchases.map(purchase => (
                <div key={purchase.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${purchase.bookId % 2 === 0 ? 'bg-yellow-100' : 'bg-pink-100'} flex items-center justify-center`}>
                      <span className="text-xs">
                        Libro<br/>{purchase.bookId}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium">{purchase.title}</h4>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${purchase.returnable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          Devolución {purchase.returnable ? 'Disponible' : 'no disponible'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$ {purchase.price.toLocaleString('es-CO')}</div>
                    <div className="text-xs text-gray-500">{purchase.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right column - Library */}
        <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tus libros</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {userLibrary.map(item => (
              <div 
                key={item.id} 
                className={`flex items-center p-3 rounded-md ${
                  item.featured ? 'bg-black text-white' : 
                  item.type === 'course' ? 'bg-blue-50' : 'bg-yellow-50'
                }`}
              >
                <div className="mr-3">
                  {item.type === 'course' ? (
                    <span className="text-blue-500">$</span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                </div>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <a href="#" className="text-blue-600 hover:underline text-sm">Ver todos los libros</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;