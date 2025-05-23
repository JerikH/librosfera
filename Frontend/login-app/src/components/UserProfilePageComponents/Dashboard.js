import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const Dashboard = ({ userData }) => {
  // Estados para las tarjetas y navegación
  const [defaultCard, setDefaultCard] = useState(null);
  const [accountBalance, setAccountBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format user name from userData
  const userName = userData ? `${userData.nombres || ''} ${userData.apellidos || ''}` : 'Usuario';
  
  // Base URL para la API
  const API_BASE_URL = 'http://localhost:5000/api/v1';

  // Función para obtener cookie
  const getCookie = (name) => {
    const cookieMatch = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return cookieMatch ? cookieMatch[2] : null;
  };

  // Configuración base para axios
  const token = getCookie("data");
  let UserData = null;
  let authToken = '';

  try {
    if (token) {
      // Decodificar la cookie si está URL-encoded
      const decodedToken = decodeURIComponent(token);
      UserData = JSON.parse(decodedToken);
      authToken = UserData?.authToken || '';
    }
  } catch (error) {
    console.error('Error parsing user data from cookie:', error);
    // Si hay error, intentar con el token sin decodificar
    try {
      if (token) {
        UserData = JSON.parse(token);
        authToken = UserData?.authToken || '';
      }
    } catch (secondError) {
      console.error('Error parsing user data (second attempt):', secondError);
      UserData = null;
      authToken = '';
    }
  }

  const axiosConfig = useMemo(() => ({
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }), [authToken]);

  // Función para obtener la tarjeta principal del usuario
  const fetchDefaultCard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/tarjetas`, axiosConfig);
      
      if (response.data.status === 'success') {
        // Transformar los datos de la API al formato que espera el componente
        const transformedCards = response.data.data.map(card => ({
          id: card.id_tarjeta,
          type: card.marca === 'visa' ? 'Visa' : 'Mastercard',
          bank: `${card.tipo.charAt(0).toUpperCase() + card.tipo.slice(1)} ${card.marca.toUpperCase()}`,
          lastFour: card.ultimos_digitos,
          cardholderName: card.nombre_titular,
          expiryMonth: card.fecha_expiracion.mes.toString().padStart(2, '0'),
          expiryYear: card.fecha_expiracion.anio.toString().slice(-2),
          isDefault: card.predeterminada,
          isActive: card.activa,
          cardType: card.tipo,
          balance: card.saldo || 0,
          brand: card.marca
        }));
        
        // Buscar la tarjeta predeterminada
        const defaultCard = transformedCards.find(card => card.isDefault);
        setDefaultCard(defaultCard);
        
        // Si no hay tarjeta predeterminada, usar saldo de cuenta por defecto
        if (!defaultCard) {
          setAccountBalance(8000); // Saldo por defecto
        }
      }
    } catch (err) {
      console.error('Error fetching default card:', err);
      setError('Error al cargar la tarjeta principal.');
      setAccountBalance(8000); // Fallback al saldo por defecto
    } finally {
      setLoading(false);
    }
  }, [axiosConfig]);

  // Función para manejar la navegación a tarjetas
  // const handleNavigateToCards = () => {
  //   // Aquí puedes usar react-router si lo tienes configurado
  //   // navigate('/cards');
  //   window.location.href = '/cards'; // Redirige a la página de tarjetas
  // };

  // useEffect para cargar la tarjeta predeterminada al montar el componente
  useEffect(() => {
    fetchDefaultCard();
  }, [fetchDefaultCard]);

  // Función para renderizar la tarjeta principal
  const renderMainCard = () => {
    if (loading) {
      return (
        <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg p-5 mb-8 w-96 h-56 flex flex-col justify-center items-center shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white opacity-80">Cargando tarjeta...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg p-5 mb-8 w-96 h-56 flex flex-col justify-center items-center shadow-lg">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white opacity-80 text-center mb-2">{error}</p>
          <button 
            onClick={fetchDefaultCard}
            className="bg-white text-red-600 font-medium py-2 px-4 rounded-md hover:bg-red-50 transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (defaultCard) {
      // Mostrar la tarjeta predeterminada del usuario
      return (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-5 mb-8 w-96 h-56 flex flex-col justify-between shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
             >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-80">Tarjeta {defaultCard.type}</p>
              <p className="font-bold text-lg">{defaultCard.bank}</p>
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full mt-1 inline-block">
                Principal
              </div>
            </div>
            <div className="w-12 h-8">
              {defaultCard.type === 'Visa' && (
                <svg className="h-full w-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4C35.0457 4 44 12.9543 44 24Z" fill="white"/>
                  <path d="M21.6267 28.8999H18.2653L20.202 19.0999H23.5653L21.6267 28.8999ZM30.4653 19.3867C29.7053 19.0999 28.602 18.7999 27.262 18.7999C24.0267 18.7999 21.7253 20.5133 21.7033 22.9619C21.682 24.7467 23.342 25.7353 24.614 26.3467C25.9193 26.9733 26.342 27.3867 26.342 27.9476C26.3353 28.8133 25.2867 29.2133 24.3153 29.2133C22.9873 29.2133 22.2833 29.0133 21.1433 28.5619L20.722 28.3553L20.262 31.0133C21.1573 31.3867 22.8753 31.7133 24.6553 31.7267C28.082 31.7267 30.342 30.0399 30.3663 27.4076C30.3793 26.0133 29.482 24.9476 27.522 24.0133C26.3433 23.4399 25.6267 23.0399 25.6267 22.4533C25.6333 21.9219 26.2353 21.3619 27.5673 21.3619C28.6673 21.3476 29.4753 21.6133 30.0887 21.8867L30.3967 22.0133L30.8433 19.4533L30.4653 19.3867ZM36.602 19.0999H34.0553C33.2953 19.0999 32.7353 19.2999 32.3887 19.9619L27.8753 28.8999H31.2953C31.2953 28.8999 31.8353 27.4733 31.9353 27.2133H35.5653C35.642 27.5399 35.9353 28.8999 35.9353 28.8999H39.0007L36.602 19.0999ZM32.8953 24.9219C33.0953 24.3999 33.9153 22.3019 33.9153 22.3019C33.9073 22.3219 34.1153 21.7619 34.242 21.4219L34.4153 22.2019C34.4153 22.2019 34.9087 24.4133 35.0087 24.9219H32.8953Z" fill="#00579F"/>
                  <path d="M16.8667 19.0999L13.6667 25.7066L13.3333 24.1733C12.7733 22.4199 11.0667 20.5333 9.14667 19.5733L12.0533 28.8866H15.5L20.4333 19.0999H16.8667Z" fill="#00579F"/>
                  <path d="M11.5333 19.0999H6.71998L6.66665 19.3666C10.22 20.1666 12.6667 21.9666 13.3333 24.1733L12.1467 19.9733C11.9733 19.2733 11.82 19.1133 11.5333 19.0999Z" fill="#FAA61A"/>
                </svg>
              )}
              {defaultCard.type === 'Mastercard' && (
                <svg className="h-full w-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4C35.0457 4 44 12.9543 44 24Z" fill="white"/>
                  <path d="M24 32C28.4183 32 32 28.4183 32 24C32 19.5817 28.4183 16 24 16C19.5817 16 16 19.5817 16 24C16 28.4183 19.5817 32 24 32Z" fill="#F26122"/>
                  <path d="M24 16C21.25 16 18.75 17.2 17 19.15C17.7879 18.3669 18.7373 17.7461 19.7868 17.3297C20.8362 16.9133 21.9625 16.7099 23.1 16.7333C24.2224 16.7129 25.3375 16.9179 26.371 17.3345C27.4045 17.7511 28.3368 18.3703 29.1047 19.1491C29.8726 19.9279 30.4785 20.8686 30.8806 21.9076C31.2827 22.9467 31.4721 24.0645 31.4367 25.1867C31.41 26.3242 31.2066 27.4505 30.7902 28.5C30.3738 29.5494 29.7531 30.4988 28.97 31.2867C30.92 29.5333 32.12 27.0333 32.12 24.0333C32.12 21.0333 30.9433 18.5333 29 16.75C27.6162 16.2518 26.115 16.0027 24.6033 16.0267C24.4033 16.0267 24.2033 16.0267 24 16.0267V16Z" fill="#EA1D25"/>
                  <path d="M16 24C16 27.0333 17.1767 29.5333 19.1233 31.3167C20.5103 31.8213 22.0168 32.0654 23.5333 32.0333C23.7333 32.0333 23.9333 32.0333 24.1333 32.0333C26.9367 32.0333 29.45 30.85 31.2 28.95C30.4083 29.7333 29.455 30.3538 28.4015 30.7683C27.348 31.1828 26.2173 31.3827 25.0833 31.3533C23.9609 31.3737 22.8458 31.1687 21.8123 30.7521C20.7789 30.3356 19.8465 29.7164 19.0786 28.9376C18.3107 28.1588 17.7048 27.2181 17.3027 26.1791C16.9007 25.14 16.7112 24.0222 16.7467 22.9C16.7733 21.7625 16.9767 20.6362 17.3932 19.5868C17.8096 18.5373 18.4303 17.5879 19.2133 16.8C17.2733 18.5533 16 21.05 16 24Z" fill="#F69E1E"/>
                </svg>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm opacity-80">Número de tarjeta</p>
            <p className="font-mono">•••• •••• •••• {defaultCard.lastFour}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm opacity-80">Saldo disponible</p>
            <div className="font-bold text-2xl flex items-baseline">
              ${defaultCard.balance.toLocaleString('es-CO')}
              <span className="text-sm ml-1 opacity-90">COP</span>
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80">TITULAR</p>
              <p className="text-sm">{defaultCard.cardholderName}</p>
            </div>
            <div>
              <p className="text-xs opacity-80">VENCE</p>
              <p className="text-sm">{defaultCard.expiryMonth}/{defaultCard.expiryYear}</p>
            </div>
          </div>
        </div>
      );
    } else {
      // Mostrar tarjeta de saldo por defecto si no hay tarjeta principal
      return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-5 mb-8 w-96 h-56 flex flex-col justify-between shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
             >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-80">Tarjeta de</p>
              <p className="font-bold text-lg">SALDO</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm opacity-80">Saldo disponible</p>
            <div className="font-bold text-3xl flex items-baseline">
              ${accountBalance.toLocaleString('es-CO')}
              <span className="text-sm ml-1 opacity-90">COP</span>
            </div>
          </div>
          
          {/* Gráfico decorativo */}
          <div className="h-16 mb-4">
            <svg viewBox="0 0 300 50" className="w-full h-full">
              <path d="M0,25 L50,10 L100,30 L150,5 L200,15 L250,30 L300,15" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
              <path d="M150,25 L200,35 L250,15 L300,25" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="text-sm opacity-80">
              <p>Válida indefinidamente</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                
              }}
              className="bg-white text-blue-600 font-medium py-2 px-4 rounded-md hover:bg-blue-50 transition-colors text-sm"
            >
              Agregar tarjeta
            </button>
          </div>
        </div>
      );
    }
  };
  
  return (
    <>
      {/* Middle column - Column 2 (larger) */}
      <div className="w-2/3 p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Buenos Días, <span className="text-gray-400">{userName}</span></h1>
        </header>
        
        {/* Main Card - Tarjeta principal del usuario o saldo por defecto */}
        {renderMainCard()}
        
        {/* Recent Purchases */}
        {/* <div>
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
        </div> */}
      </div>
      
      {/* Right column - Column 3 (smaller) */}
      <div className="w-1/3 p-6">
        {/* Tarjeta de acceso rápido a métodos de pago */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Acceso Rápido</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Métodos de Pago</p>
                  <p className="text-sm text-gray-500">
                    {defaultCard ? `${defaultCard.type} •••• ${defaultCard.lastFour}` : 'Gestiona tus tarjetas'}
                  </p>
                </div>
              </div>
              <button 
                
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              <button 
                
                className="w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors flex items-center"
              >
                <span className="text-sm text-gray-600">💳 Ver todas las tarjetas</span>
              </button>
              <button 
                
                className="w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors flex items-center"
              >
                <span className="text-sm text-gray-600">💰 Recargar saldo</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Resumen de actividad */}
        {/* <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Actividad Reciente</h3>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Recarga de saldo</p>
                    <p className="text-xs text-gray-500">Hace 2 días</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">+$50,000</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Compra de libro</p>
                    <p className="text-xs text-gray-500">Hace 3 días</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-red-600">-$14,200</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t">
              <button 
                onClick={handleNavigateToCards}
                className="text-blue-600 text-sm hover:underline"
              >
                Ver historial completo
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </>
  );
};

export default Dashboard;