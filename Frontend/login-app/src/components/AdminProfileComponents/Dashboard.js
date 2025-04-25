import React, { useState, useEffect } from 'react';

const Dashboard = ({ userData }) => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalSales: 0,
    pendingMessages: 0,
    recentActivity: []
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de estadísticas
    const fetchStats = async () => {
      try {
        // Aquí iría una llamada API real para obtener estadísticas
        // Simulamos una respuesta después de un segundo
        setTimeout(() => {
          setStats({
            totalBooks: 247,
            totalUsers: 1458,
            totalSales: 856,
            pendingMessages: 12,
            recentActivity: [
              { id: 1, type: 'user', action: 'Nuevo usuario registrado', timestamp: '2023-11-10 14:25', user: 'maria_lopez' },
              { id: 2, type: 'book', action: 'Nuevo libro añadido', timestamp: '2023-11-10 13:15', book: 'Historia de la Literatura' },
              { id: 3, type: 'sale', action: 'Nueva venta completada', timestamp: '2023-11-10 12:40', amount: '$45.99' },
              { id: 4, type: 'message', action: 'Nuevo mensaje recibido', timestamp: '2023-11-10 10:18', from: 'Pedro Sánchez' },
              { id: 5, type: 'book', action: 'Libro actualizado', timestamp: '2023-11-09 16:50', book: 'Matemáticas Avanzadas' }
            ]
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Componente para mostrar una estadística con iconos SVG
  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );

  // Iconos SVG para las tarjetas de estadísticas
  const icons = {
    book: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    people: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    shopping_cart: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    ),
    mail: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    ),
    person: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    book_small: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    shopping_cart_small: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    ),
    mail_small: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    ),
    arrow_forward: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    )
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Bienvenido, {userData?.username || 'Administrador'}
        </h1>
        <p className="text-gray-600">
          Panel de control y resumen de actividades
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Libros Totales" 
              value={stats.totalBooks} 
              icon={icons.book} 
              color="bg-blue-500" 
            />
            <StatCard 
              title="Usuarios" 
              value={stats.totalUsers} 
              icon={icons.people} 
              color="bg-green-500" 
            />
            <StatCard 
              title="Ventas" 
              value={stats.totalSales} 
              icon={icons.shopping_cart} 
              color="bg-purple-500" 
            />
            <StatCard 
              title="Mensajes Pendientes" 
              value={stats.pendingMessages} 
              icon={icons.mail} 
              color="bg-amber-500" 
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
            <div className="divide-y divide-gray-200">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="py-3 flex items-start">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center mt-1
                    ${activity.type === 'user' ? 'bg-green-100 text-green-600' : ''}
                    ${activity.type === 'book' ? 'bg-blue-100 text-blue-600' : ''}
                    ${activity.type === 'sale' ? 'bg-purple-100 text-purple-600' : ''}
                    ${activity.type === 'message' ? 'bg-amber-100 text-amber-600' : ''}
                  `}>
                    {activity.type === 'user' && icons.person}
                    {activity.type === 'book' && icons.book_small}
                    {activity.type === 'sale' && icons.shopping_cart_small}
                    {activity.type === 'message' && icons.mail_small}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                    <div className="flex justify-between">
                      <p className="text-xs text-gray-500">
                        {activity.user && `Usuario: ${activity.user}`}
                        {activity.book && `Libro: ${activity.book}`}
                        {activity.amount && `Monto: ${activity.amount}`}
                        {activity.from && `De: ${activity.from}`}
                      </p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="text-blue-600 text-sm hover:text-blue-800 font-medium flex items-center">
                Ver todas las actividades
                <span className="ml-1">{icons.arrow_forward}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;