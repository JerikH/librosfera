import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const CheckoutStoreSelectionPage = () => {
  const [selectedStore, setSelectedStore] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(35000);
  const [total, setTotal] = useState(35000);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([4.8126, -75.6946]); // Pereira por defecto

  // Referencias para el mapa
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const storeMarkersRef = useRef([]);
  const L = useRef(null);

  // Lista de tiendas disponibles
  const availableStores = [
    { 
      id: 1, 
      nombre: 'Sede Principal - Centro', 
      direccion: 'Carrera 8 #23-45', 
      ciudad: 'Pereira',
      telefono: '3332221',
      horario: 'Lu a Sá: 9 a 19 hs.',
      distancia: '0 mts.',
      coordenadas: { lat: 4.8126, lng: -75.6946 }
    },
    { 
      id: 2, 
      nombre: 'Sede Circunvalar', 
      direccion: 'Av. Circunvalar #9-42', 
      ciudad: 'Pereira',
      telefono: '3332222',
      horario: 'Lu a Sá: 10 a 20 hs.',
      distancia: '1.2 km',
      coordenadas: { lat: 4.8145, lng: -75.6896 }
    },
    { 
      id: 3, 
      nombre: 'Centro Comercial Victoria', 
      direccion: 'C.C. Victoria Plaza Local 235', 
      ciudad: 'Pereira',
      telefono: '3332223',
      horario: 'Lu a Do: 10 a 20 hs.',
      distancia: '581 mts.',
      coordenadas: { lat: 4.8156, lng: -75.6936 }
    },
    { 
      id: 4, 
      nombre: 'Tienda Álamos', 
      direccion: 'Carrera 12 #11-13 Local 67', 
      ciudad: 'Pereira',
      telefono: '3332224',
      horario: 'Lu a Sá: 9 a 19 hs.',
      distancia: '955 mts.',
      coordenadas: { lat: 4.8176, lng: -75.6916 }
    },
    { 
      id: 5, 
      nombre: 'Biblioteca Central', 
      direccion: 'Carrera 10 Bis #15-20', 
      ciudad: 'Pereira',
      telefono: '3332225',
      horario: 'Lu a Vi: 8 a 18 hs.',
      distancia: '750 mts.',
      coordenadas: { lat: 4.8136, lng: -75.6956 }
    }
  ];

  // Filtrar tiendas basadas en la búsqueda
  const filteredStores = availableStores.filter(store => 
    store.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.direccion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Inicializar Leaflet
  useEffect(() => {
    // Importar Leaflet solo en el cliente
    if (typeof window !== 'undefined') {
      const loadLeaflet = async () => {
        try {
          // En un entorno real, esto se cargaría correctamente
          // Aquí simulamos la carga para el propósito de la demostración
          L.current = await import('leaflet').then(module => module.default);
          initMap();
        } catch (err) {
          console.error("Error al cargar Leaflet:", err);
          // En caso de error, mostramos el mapa de respaldo
        }
      };
      
      loadLeaflet();
    }
    
    return () => {
      // Limpiar mapa al desmontar
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Función para inicializar el mapa
  const initMap = () => {
    if (!L.current || !mapRef.current || mapInstanceRef.current) return;
    
    try {
      // En un entorno real, aquí se inicializaría el mapa de Leaflet
      // Configurar íconos del marcador
      delete L.current.Icon.Default.prototype._getIconUrl;
      
      L.current.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
      });
      
      // Crear mapa
      mapInstanceRef.current = L.current.map(mapRef.current).setView(mapCenter, 15);
      
      // Agregar capa de mosaicos
      L.current.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
      
      // Cargar marcadores de tiendas
      updateStoreMarkers();
      
    } catch (err) {
      console.error("Error en inicialización del mapa:", err);
    }
  };

  // Actualizar marcadores de tiendas
  const updateStoreMarkers = () => {
    if (!L.current || !mapInstanceRef.current) return;
    
    // Limpiar marcadores existentes
    storeMarkersRef.current.forEach(marker => {
      marker.remove();
    });
    storeMarkersRef.current = [];
    
    // Crear nuevos marcadores
    availableStores.forEach(store => {
      try {
        const marker = L.current.marker([store.coordenadas.lat, store.coordenadas.lng])
          .addTo(mapInstanceRef.current);
        
        // Contenido del popup
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <div style="text-align: center; min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 16px;">${store.nombre}</h3>
            <p style="font-size: 14px; margin-top: 4px;">${store.direccion}</p>
            <p style="font-size: 12px; margin-top: 4px;">${store.horario}</p>
            <button id="select-store-${store.id}" style="font-size: 14px; background-color: #2563eb; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; margin-top: 8px;">
              Seleccionar tienda
            </button>
          </div>
        `;
        
        const popup = L.current.popup()
          .setContent(popupContent);
        
        marker.bindPopup(popup);
        
        // Agregar event listeners a los botones cuando se abra el popup
        marker.on('popupopen', () => {
          setTimeout(() => {
            const selectBtn = document.getElementById(`select-store-${store.id}`);
            
            if (selectBtn) {
              selectBtn.addEventListener('click', () => {
                handleSelectStore(store);
                marker.closePopup();
              });
            }
          }, 100);
        });
        
        storeMarkersRef.current.push(marker);
      } catch (err) {
        console.error("Error al crear marcador para tienda:", err);
      }
    });
  };

  // Actualizar vista del mapa cuando cambia el centro
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(mapCenter, 15);
    }
  }, [mapCenter]);

  // Cargar datos del carrito
  useEffect(() => {
    const fetchCartData = async () => {
      setIsLoading(true);
      try {
        // Obtener carrito del localStorage
        const storedCart = localStorage.getItem('shoppingCart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItems(parsedCart);
          
          // Calcular subtotal (simulado)
          const calculatedSubtotal = 35000; // Valor fijo para el ejemplo
          setSubtotal(calculatedSubtotal);
          setTotal(calculatedSubtotal); // No hay costo de envío para recoger en tienda
        }
        
        // Recuperar las preferencias de envío
        const shippingPrefs = localStorage.getItem('shippingPreferences');
        if (shippingPrefs) {
          const parsedPrefs = JSON.parse(shippingPrefs);
          // Verificar si ya había seleccionado una tienda antes
          if (parsedPrefs.storeId) {
            const preselectedStore = availableStores.find(store => 
              store.id === parseInt(parsedPrefs.storeId)
            );
            
            if (preselectedStore) {
              setSelectedStore(preselectedStore);
              setMapCenter([preselectedStore.coordenadas.lat, preselectedStore.coordenadas.lng]);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar datos del carrito:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartData();
  }, []);

  // Seleccionar una tienda
  const handleSelectStore = (store) => {
    setSelectedStore(store);
    setMapCenter([store.coordenadas.lat, store.coordenadas.lng]);
    
    // Scroll al detalle de la tienda en móviles
    const storeDetailElement = document.getElementById('store-detail');
    if (storeDetailElement && window.innerWidth < 768) {
      storeDetailElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Confirmar selección y continuar
  const handleConfirm = () => {
    if (!selectedStore) {
      alert('Por favor selecciona una tienda para continuar');
      return;
    }
    
    try {
      // Actualizar preferencias de envío
      const currentPrefs = localStorage.getItem('shippingPreferences')
        ? JSON.parse(localStorage.getItem('shippingPreferences'))
        : {};
        
      const updatedPrefs = {
        ...currentPrefs,
        storeId: selectedStore.id,
        storeName: selectedStore.nombre,
        storeAddress: selectedStore.direccion
      };
      
      // Guardar en localStorage antes de navegar
      localStorage.setItem('shippingPreferences', JSON.stringify(updatedPrefs));
      
      // Navegar a la página de pago
      window.location.href = '/checkout/payment';
    } catch (error) {
      console.error("Error al confirmar la tienda:", error);
      alert("Ha ocurrido un error al procesar su selección. Por favor intente nuevamente.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Solo la barra azul oscura superior */}
      <header className="bg-gray-900 text-white py-4 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold mr-3">Librosfera</a>
            <span className="text-sm text-gray-300">Tu librería de confianza</span>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => window.location.href = "/mi-cuenta"} 
              className="text-sm hover:underline"
            >
              Mi Cuenta
            </button>
            <button 
              onClick={() => window.location.href = "/mis-pedidos"} 
              className="text-sm hover:underline"
            >
              Mis Pedidos
            </button>
            <button 
              onClick={() => window.location.href = "/logout"} 
              className="text-sm hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>
      
      {/* Contenido principal */}
      <div className="flex-grow bg-gray-100">
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Seleccionar tienda de recogida</h1>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Columna izquierda - Lista de tiendas y búsqueda */}
            <div className="lg:w-3/5 space-y-4">
              {/* Barra de búsqueda */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Busca una ubicación"
                    className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center mt-3 space-x-2">
                  <button className="px-4 py-1 text-sm border rounded-full text-gray-700 hover:bg-gray-50">
                    Cierra tarde
                  </button>
                  <button className="px-4 py-1 text-sm text-blue-600 hover:underline">
                    Más filtros
                  </button>
                </div>
              </div>
              
              {/* Lista de tiendas */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  {filteredStores.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredStores.map((store) => (
                        <div 
                          key={store.id} 
                          className={`p-4 hover:bg-gray-50 transition cursor-pointer ${selectedStore?.id === store.id ? 'border-l-4 border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => handleSelectStore(store)}
                        >
                          <h3 className="font-bold text-gray-800">{store.nombre}</h3>
                          <p className="text-gray-600 text-sm mt-1">{store.direccion}, {store.ciudad} - a {store.distancia}</p>
                          <p className="text-gray-500 text-sm mt-1">{store.horario}</p>
                          
                          <div className="mt-3 flex justify-between items-center">
                            <p className="text-sm text-gray-500">
                              Llega a la tienda el jueves
                            </p>
                            <button
                              className={`px-4 py-1.5 rounded text-sm font-medium ${
                                selectedStore?.id === store.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStore(store);
                              }}
                            >
                              {selectedStore?.id === store.id ? 'Seleccionada' : 'Elegir'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No se encontraron tiendas que coincidan con tu búsqueda
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Columna derecha - Mapa y resumen */}
            <div className="lg:w-2/5 space-y-4">
              {/* Mapa interactivo */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div 
                  ref={mapRef}
                  className="h-[400px] w-full relative"
                >
                  {/* Mapa de respaldo en caso de que Leaflet no cargue */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-300 z-0">
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm">Cargando mapa de ubicaciones...</p>
                    </div>
                  </div>
                </div>
                
                {/* Información de tienda seleccionada */}
                {selectedStore && (
                  <div id="store-detail" className="p-4 border-t">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{selectedStore.nombre}</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Dirección</p>
                            <p className="text-sm">{selectedStore.direccion}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Teléfono</p>
                            <p className="text-sm">{selectedStore.telefono}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-500">Horario</p>
                            <p className="text-sm">{selectedStore.horario}</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleConfirm}
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Resumen de compra */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Resumen de compra</h2>
                <div className="border-b pb-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Producto{cartItems.length !== 1 ? 's' : ''}</span>
                    <span>$ {subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retiro</span>
                    <span className="text-green-600">Gratis</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center font-bold">
                  <span>Total</span>
                  <span>$ {total.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutStoreSelectionPage;