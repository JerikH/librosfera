import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManageStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [mapCenter, setMapCenter] = useState([19.432608, -99.133209]); // CDMX por defecto
  const [newMarkerPosition, setNewMarkerPosition] = useState(null);
  
  // Form state
  const [storeForm, setStoreForm] = useState({
    id: null,
    name: '',
    address: '',
    phone: '',
    email: '',
    lat: null,
    lng: null,
    description: ''
  });

  // Referencias
  const searchInputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const storeMarkersRef = useRef([]);
  const newMarkerRef = useRef(null);
  const L = useRef(null);

  // Inicializar Leaflet
  useEffect(() => {
    // Importar Leaflet solo en el cliente
    if (typeof window !== 'undefined') {
      try {
        L.current = require('leaflet');
        console.log("Leaflet inicializado correctamente");
        initMap();
      } catch (err) {
        console.error("Error al cargar Leaflet:", err);
      }
    }
    
    return () => {
      // Limpiar mapa al desmontar
      if (mapInstanceRef.current) {
        console.log("Limpiando mapa");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Función para inicializar el mapa
  const initMap = () => {
    if (!L.current || !mapRef.current || mapInstanceRef.current) return;
    console.log("Inicializando mapa...");
    
    try {
      // Resolver problema de íconos
      const iconRetinaUrl = require('leaflet/dist/images/marker-icon-2x.png');
      const iconUrl = require('leaflet/dist/images/marker-icon.png');
      const shadowUrl = require('leaflet/dist/images/marker-shadow.png');
      
      delete L.current.Icon.Default.prototype._getIconUrl;
      
      L.current.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      
      // Crear mapa
      mapInstanceRef.current = L.current.map(mapRef.current).setView(mapCenter, 13);
      
      // Agregar capa de mosaicos
      L.current.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
      
      // Eventos importantes:
      
      // 1. Evento click para seleccionar ubicación
      mapInstanceRef.current.on('click', function(e) {
        console.log("Click en mapa:", e.latlng);
        
        // Solo procesar el clic si estamos en modo edición o adición
        if (isEditing || isAdding) {
          handleMapClick(e.latlng.lat, e.latlng.lng);
        } else {
          console.log("Click ignorado: no estamos en modo edición/adición");
        }
      });
      
      // Cargar marcadores
      loadStores();
      
    } catch (err) {
      console.error("Error en inicialización del mapa:", err);
    }
  };

  // Observar cambios en isEditing/isAdding para actualizar el comportamiento del mapa
  useEffect(() => {
    console.log("Estado de edición cambió - isEditing:", isEditing, "isAdding:", isAdding);
  }, [isEditing, isAdding]);

  // Actualizar vista del mapa cuando cambia el centro
  useEffect(() => {
    if (mapInstanceRef.current) {
      console.log("Actualizando centro del mapa a:", mapCenter);
      mapInstanceRef.current.setView(mapCenter, 13);
    }
  }, [mapCenter]);

  // Actualizar marcadores cuando cambian las tiendas
  useEffect(() => {
    if (stores.length > 0) {
      console.log("Actualizando marcadores de tiendas:", stores.length);
      updateStoreMarkers();
    }
  }, [stores]);

  // Actualizar marcador de nueva ubicación
  useEffect(() => {
    if (newMarkerPosition) {
      console.log("Actualizando posición de nuevo marcador:", newMarkerPosition);
      updateNewLocationMarker();
    }
  }, [newMarkerPosition]);

  // Cargar tiendas
  const loadStores = () => {
    setLoading(true);
    console.log("Cargando tiendas...");
    
    // Simulación
    setTimeout(() => {
      const mockStores = [
        { 
          id: 1, 
          name: 'Librosfera Central', 
          address: 'Av. Insurgentes Sur 1602, Benito Juárez, 03940 CDMX', 
          phone: '55 1234 5678', 
          email: 'central@librosfera.com',
          description: 'Tienda principal con la mayor variedad de libros y áreas de lectura.',
          lat: 19.3849, 
          lng: -99.1732 
        },
        { 
          id: 2, 
          name: 'Librosfera Norte', 
          address: 'Av. Eduardo Molina 1623, Gustavo A. Madero, 07820 CDMX', 
          phone: '55 8765 4321', 
          email: 'norte@librosfera.com',
          description: 'Especializada en literatura infantil y juvenil.',
          lat: 19.4869, 
          lng: -99.0959 
        },
        { 
          id: 3, 
          name: 'Librosfera Sur', 
          address: 'División del Norte 3651, Coyoacán, 04610 CDMX', 
          phone: '55 2468 1357', 
          email: 'sur@librosfera.com',
          description: 'Especializada en literatura académica y científica.',
          lat: 19.3348, 
          lng: -99.1551 
        }
      ];
      
      setStores(mockStores);
      console.log("Tiendas cargadas correctamente:", mockStores.length);
      setLoading(false);
      
      // Actualizar marcadores
      if (mapInstanceRef.current) {
        updateStoreMarkers();
      }
    }, 1500);
  };

  // Actualizar marcadores de tiendas
  const updateStoreMarkers = () => {
    if (!L.current || !mapInstanceRef.current) {
      console.log("No se pueden actualizar marcadores: mapa no inicializado");
      return;
    }
    
    // Limpiar marcadores existentes
    storeMarkersRef.current.forEach(marker => {
      marker.remove();
    });
    storeMarkersRef.current = [];
    
    // Crear nuevos marcadores
    stores.forEach(store => {
      try {
        const marker = L.current.marker([store.lat, store.lng])
          .addTo(mapInstanceRef.current);
        
        // Contenido del popup
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <div style="text-align: center;">
            <h3 style="font-weight: bold; font-size: 16px;">${store.name}</h3>
            <p style="font-size: 14px; margin-top: 4px;">${store.address}</p>
            ${store.phone ? `<p style="font-size: 14px; margin-top: 4px;">Tel: ${store.phone}</p>` : ''}
            <div style="margin-top: 8px; display: flex; justify-content: center; gap: 8px;">
              <button id="edit-store-${store.id}" style="font-size: 12px; background-color: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer;">
                Editar
              </button>
              <button id="delete-store-${store.id}" style="font-size: 12px; background-color: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer;">
                Eliminar
              </button>
            </div>
          </div>
        `;
        
        const popup = L.current.popup()
          .setContent(popupContent);
        
        marker.bindPopup(popup);
        
        // Agregar event listeners a los botones cuando se abra el popup
        marker.on('popupopen', () => {
          setTimeout(() => {
            const editBtn = document.getElementById(`edit-store-${store.id}`);
            const deleteBtn = document.getElementById(`delete-store-${store.id}`);
            
            if (editBtn) {
              editBtn.addEventListener('click', () => {
                handleEdit(store);
                marker.closePopup();
              });
            }
            
            if (deleteBtn) {
              deleteBtn.addEventListener('click', () => {
                handleDelete(store.id);
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
    
    console.log("Marcadores actualizados:", storeMarkersRef.current.length);
  };

  // Actualizar marcador de nueva ubicación
  const updateNewLocationMarker = () => {
    if (!L.current || !mapInstanceRef.current) return;
    
    // Eliminar marcador existente
    if (newMarkerRef.current) {
      newMarkerRef.current.remove();
      newMarkerRef.current = null;
    }
    
    // Si tenemos una nueva posición, crear marcador
    if (newMarkerPosition) {
      try {
        newMarkerRef.current = L.current.marker(newMarkerPosition, {
          draggable: true
        }).addTo(mapInstanceRef.current);
        
        // Popup con información
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <div>
            <h3 style="font-weight: bold; color: #1d4ed8;">Nueva ubicación</h3>
            <p style="font-size: 14px;">Lat: ${newMarkerPosition[0].toFixed(6)}</p>
            <p style="font-size: 14px;">Lng: ${newMarkerPosition[1].toFixed(6)}</p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">Puedes arrastrar este marcador para ajustar la posición</p>
          </div>
        `;
        
        newMarkerRef.current.bindPopup(popupContent);
        
        // Evento de arrastre
        newMarkerRef.current.on('dragend', () => {
          const position = newMarkerRef.current.getLatLng();
          console.log("Marcador arrastrado a:", position);
          
          setNewMarkerPosition([position.lat, position.lng]);
          setStoreForm(prev => ({
            ...prev,
            lat: position.lat,
            lng: position.lng
          }));
          
          // Actualizar popup después de arrastrar
          const newPopupContent = document.createElement('div');
          newPopupContent.innerHTML = `
            <div>
              <h3 style="font-weight: bold; color: #1d4ed8;">Nueva ubicación</h3>
              <p style="font-size: 14px;">Lat: ${position.lat.toFixed(6)}</p>
              <p style="font-size: 14px;">Lng: ${position.lng.toFixed(6)}</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">Puedes arrastrar este marcador para ajustar la posición</p>
            </div>
          `;
          
          newMarkerRef.current.setPopupContent(newPopupContent);
        });
        
        // Abrir popup
        newMarkerRef.current.openPopup();
      } catch (err) {
        console.error("Error al crear marcador para nueva ubicación:", err);
      }
    }
  };

  // Manejar click en el mapa
  const handleMapClick = (lat, lng) => {
    console.log("Click en mapa procesado: lat=" + lat + ", lng=" + lng);
    
    // Asegurarse de que estamos en modo edición o adición
    if (!isEditing && !isAdding) {
      console.log("Click ignorado: no estamos en modo edición o adición");
      return;
    }
    
    // Actualizar posición del marcador
    setNewMarkerPosition([lat, lng]);
    
    // Actualizar formulario
    setStoreForm(prev => ({
      ...prev,
      lat: lat,
      lng: lng
    }));
    
    toast.info('Posición seleccionada. Para obtener la dirección exacta, usa el buscador.');
  };

  // Búsqueda de dirección (simulada)
  const searchAddress = (e) => {
    e.preventDefault();
    
    // Verificar que tenemos acceso al input
    if (!searchInputRef.current) {
      console.error("No se pudo acceder al campo de búsqueda");
      return;
    }
    
    const address = searchInputRef.current.value;
    console.log("Buscando dirección:", address);
    
    if (!address.trim()) {
      toast.error('Ingresa una dirección para buscar');
      return;
    }

    setLoading(true);
    
    // Simulación de búsqueda
    setTimeout(() => {
      try {
        // Generar coordenadas aleatorias cerca del centro
        const offset = (Math.random() - 0.5) * 0.1;
        const newLat = mapCenter[0] + offset;
        const newLng = mapCenter[1] + offset;
        
        console.log("Ubicación encontrada:", { lat: newLat, lng: newLng, address });
        
        // Actualizar estado
        setNewMarkerPosition([newLat, newLng]);
        setMapCenter([newLat, newLng]);
        
        setStoreForm(prev => ({
          ...prev,
          address: address,
          lat: newLat,
          lng: newLng
        }));
        
        toast.success('Ubicación encontrada');
      } catch (err) {
        console.error("Error en búsqueda de dirección:", err);
        toast.error('Error al buscar la dirección');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStoreForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar tienda
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!storeForm.name || !storeForm.address || !storeForm.lat || !storeForm.lng) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    
    setLoading(true);
    console.log("Guardando tienda:", storeForm);
    
    // Simulación de guardado
    setTimeout(() => {
      try {
        if (isEditing) {
          // Actualizar tienda existente
          const updatedStores = stores.map(store => 
            store.id === storeForm.id ? {...storeForm} : store
          );
          setStores(updatedStores);
          toast.success('Tienda actualizada exitosamente');
        } else {
          // Agregar nueva tienda
          const newStore = {
            ...storeForm,
            id: Date.now() // En un sistema real, vendría del backend
          };
          setStores(prevStores => [...prevStores, newStore]);
          toast.success('Tienda agregada exitosamente');
        }
        
        resetForm();
      } catch (err) {
        console.error("Error al guardar tienda:", err);
        toast.error('Error al guardar los datos');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  // Editar tienda
  const handleEdit = (store) => {
    console.log("Editando tienda:", store);
    
    setSelectedStore(store);
    setStoreForm({
      id: store.id,
      name: store.name,
      address: store.address,
      phone: store.phone || '',
      email: store.email || '',
      description: store.description || '',
      lat: store.lat,
      lng: store.lng
    });
    
    setIsEditing(true);
    setIsAdding(false);
    setMapCenter([store.lat, store.lng]);
    setNewMarkerPosition([store.lat, store.lng]);
    
    // Actualizar campo de búsqueda
    if (searchInputRef.current) {
      searchInputRef.current.value = store.address;
    }
  };

  // Eliminar tienda
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro que deseas eliminar esta tienda?')) {
      setLoading(true);
      console.log("Eliminando tienda:", id);
      
      // Simulación de eliminación
      setTimeout(() => {
        try {
          const updatedStores = stores.filter(store => store.id !== id);
          setStores(updatedStores);
          
          if (selectedStore && selectedStore.id === id) {
            setSelectedStore(null);
            setIsEditing(false);
          }
          
          toast.success('Tienda eliminada exitosamente');
        } catch (err) {
          console.error("Error al eliminar tienda:", err);
          toast.error('Error al eliminar la tienda');
        } finally {
          setLoading(false);
        }
      }, 1000);
    }
  };

  // Agregar nueva tienda
  const handleAddNew = () => {
    console.log("Agregando nueva tienda");
    resetForm();
    setIsAdding(true);
    setIsEditing(false);
    
    // Si el mapa ya está centrado en algún lugar, usamos ese como posición inicial
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      setMapCenter([center.lat, center.lng]);
    }
  };

  // Cancelar edición/adición
  const handleCancel = () => {
    console.log("Cancelando operación");
    resetForm();
  };

  // Resetear formulario
  const resetForm = () => {
    setStoreForm({
      id: null,
      name: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      lat: null,
      lng: null
    });
    
    setSelectedStore(null);
    setIsEditing(false);
    setIsAdding(false);
    setNewMarkerPosition(null);
    
    // Limpiar marcador temporal
    if (newMarkerRef.current && mapInstanceRef.current) {
      newMarkerRef.current.remove();
      newMarkerRef.current = null;
    }
    
    // Limpiar campo de búsqueda
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Administrar Tiendas Físicas
          </h1>
          
          {!isEditing && !isAdding && (
            <button
              onClick={handleAddNew}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nueva Tienda
            </button>
          )}
        </div>
        
        {/* Buscador de direcciones */}
        {(isEditing || isAdding) && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              Buscar ubicación
            </h2>
            <form onSubmit={searchAddress} className="flex">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ingresa una dirección..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={storeForm.address}
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Buscando...</span>
                  </div>
                ) : (
                  <span>Buscar</span>
                )}
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-1">
              También puedes hacer clic directamente en el mapa para seleccionar una ubicación
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listado de tiendas */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700">
                Tiendas Registradas
              </h2>
            </div>
            
            <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
              {loading && stores.length === 0 ? (
                <div className="flex justify-center items-center p-8">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : stores.length === 0 ? (
                <div className="text-center py-8 px-4 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p>No hay tiendas registradas</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {stores.map(store => (
                    <li 
                      key={store.id} 
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        selectedStore?.id === store.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{store.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{store.address}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button 
                            onClick={() => setMapCenter([store.lat, store.lng])}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                          >
                            Ver en mapa
                          </button>
                          <button 
                            onClick={() => handleEdit(store)}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(store.id)}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        {/* Mapa y formulario */}
        <div className="lg:col-span-2">
          {/* Mapa */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div 
              ref={mapRef} 
              id="map-container" 
              className="h-[400px] md:h-[500px]"
            ></div>
          </div>
          
          {/* Formulario */}
          {(isEditing || isAdding) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {isEditing ? 'Editar Tienda' : 'Agregar Nueva Tienda'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Tienda *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={storeForm.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre de la tienda"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={storeForm.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Teléfono de contacto"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={storeForm.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Dirección completa"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={storeForm.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Correo electrónico"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={storeForm.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Breve descripción de la tienda"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitud *
                    </label>
                    <input
                      type="number"
                      name="lat"
                      value={storeForm.lat || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      placeholder="Latitud"
                      step="0.000001"
                      required
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitud *
                    </label>
                    <input
                      type="number"
                      name="lng"
                      value={storeForm.lng || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      placeholder="Longitud"
                      step="0.000001"
                      required
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center"
                    disabled={loading || !storeForm.lat || !storeForm.lng}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>{isEditing ? 'Actualizar Tienda' : 'Guardar Tienda'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageStores;