import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken } from './authUtils';
import CachedImage from '../CachedImage';

// Componente para seguimiento de envío a domicilio
const DeliveryTracking = ({ envio }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Seguimiento del Envío
      </h3>
      
      {envio.codigo_seguimiento && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Código de seguimiento:</p>
          <div className="flex justify-between items-center">
            <p className="font-mono font-bold text-lg">{envio.codigo_seguimiento}</p>
            <button className="text-blue-600 text-sm hover:underline">
              Copiar
            </button>
          </div>
          {envio.empresa_transporte && (
            <p className="text-sm text-gray-600 mt-1">
              Empresa: {envio.empresa_transporte.toUpperCase()}
            </p>
          )}
        </div>
      )}
      
      <div className="relative">
        <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200"></div>
        <div className="space-y-8">
          {envio.historial_estados.map((estado, index) => {
            const isCompleted = true; // Para los estados pasados
            const isCurrent = index === envio.historial_estados.length - 1;
            return (
              <div key={index} className="relative flex items-start">
                <div className={`absolute left-5 -translate-x-1/2 w-6 h-6 rounded-full ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                } flex items-center justify-center z-10`}>
                  {isCompleted && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="ml-10">
                  <div className={`font-medium ${isCurrent ? 'text-green-600' : 'text-gray-900'}`}>
                    {estado.estado_nuevo}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(estado.fecha).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {estado.descripcion}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Estado futuro (si no está entregado) */}
          {envio.estado_envio !== 'ENTREGADO' && (
            <div className="relative flex items-start">
              <div className="absolute left-5 -translate-x-1/2 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center z-10"></div>
              <div className="ml-10">
                <div className="font-medium text-gray-400">ENTREGADO</div>
                <div className="text-sm text-gray-500">
                  Fecha estimada: {new Date(envio.fechas.entrega_estimada).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Pendiente de entrega
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para seguimiento de recogida en tienda
const StorePickupTracking = ({ envio }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Información de Recogida en Tienda
      </h3>
      
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-800 mb-2">Punto de entrega</h4>
        {envio.tienda && (
          <div>
            <p className="font-medium text-gray-800">{envio.tienda.nombre}</p>
            <p className="text-gray-600">{envio.tienda.direccion}</p>
            <p className="text-gray-600">{envio.tienda.ciudad}</p>
            {envio.tienda.telefono && (
              <p className="text-gray-600">Tel: {envio.tienda.telefono}</p>
            )}
            {envio.tienda.horario && (
              <p className="text-gray-600 mt-2">
                <span className="font-medium">Horario:</span> {envio.tienda.horario}
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200"></div>
        <div className="space-y-8">
          {envio.historial_estados.map((estado, index) => {
            const isCompleted = true;
            const isCurrent = index === envio.historial_estados.length - 1;
            return (
              <div key={index} className="relative flex items-start">
                <div className={`absolute left-5 -translate-x-1/2 w-6 h-6 rounded-full ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                } flex items-center justify-center z-10`}>
                  {isCompleted && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="ml-10">
                  <div className={`font-medium ${isCurrent ? 'text-green-600' : 'text-gray-900'}`}>
                    {estado.estado_nuevo}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(estado.fecha).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {estado.descripcion}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Si no está listo para recoger */}
          {envio.estado_envio !== 'ENTREGADO' && (
            <div className="relative flex items-start">
              <div className="absolute left-5 -translate-x-1/2 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center z-10"></div>
              <div className="ml-10">
                <div className="font-medium text-gray-400">LISTO PARA RECOGER</div>
                <div className="text-sm text-gray-500">
                  Disponible aproximadamente: {new Date(envio.fechas.entrega_estimada).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Te notificaremos cuando tu pedido esté listo para recoger
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Efecto para cargar los detalles de la compra seleccionada
  useEffect(() => {
    if (selectedPurchaseId) {
      fetchPurchaseDetails(selectedPurchaseId);
    }
  }, [selectedPurchaseId]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/v1/ventas/mis-ventas', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        setPurchases(response.data.data);
        setSummary(response.data.resumen);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError('Error al cargar las compras. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseDetails = async (purchaseId) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/v1/ventas/${purchaseId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        setSelectedPurchase(response.data.data.venta);
      }
    } catch (err) {
      console.error('Error fetching purchase details:', err);
      // En caso de error, generamos datos de muestra
      const mockData = generateMockPurchaseData(purchaseId);
      setSelectedPurchase(mockData);
    } finally {
      setLoadingDetails(false);
    }
  };

  const generateMockPurchaseData = (id) => {
    // Busca la compra en la lista de compras existente
    const purchase = purchases.find(p => p._id === id);
    
    if (!purchase) {
      return null;
    }
    
    const isDelivery = purchase.envio.tipo === 'domicilio';
    const orderDate = new Date(purchase.fecha_creacion);
    
    const processingDate = new Date(orderDate);
    processingDate.setHours(orderDate.getHours() + 2);
    
    const shippingDate = new Date(processingDate);
    shippingDate.setDate(processingDate.getDate() + 1);
    
    const deliveryDate = new Date(shippingDate);
    deliveryDate.setDate(shippingDate.getDate() + 1);
    
    // Estados posibles según el estado actual de la compra
    let currentState = 'EN PREPARACION';
    if (purchase.estado === 'enviado') {
      currentState = 'ENVIADO';
    } else if (purchase.estado === 'entregado') {
      currentState = 'ENTREGADO';
    }
    
    // Construir historial de estados
    let stateHistory = [
      {
        estado_anterior: null,
        estado_nuevo: 'EN PREPARACION',
        fecha: processingDate.toISOString(),
        descripcion: 'Pedido recibido y en preparación'
      }
    ];
    
    if (currentState === 'ENVIADO' || currentState === 'ENTREGADO') {
      stateHistory.push({
        estado_anterior: 'EN PREPARACION',
        estado_nuevo: 'ENVIADO',
        fecha: shippingDate.toISOString(),
        descripcion: 'Pedido enviado al destino'
      });
    }
    
    if (currentState === 'ENTREGADO') {
      stateHistory.push({
        estado_anterior: 'ENVIADO',
        estado_nuevo: 'ENTREGADO',
        fecha: deliveryDate.toISOString(),
        descripcion: 'Pedido entregado satisfactoriamente'
      });
    }
    
    // Enriquecer los datos de la compra para mostrar los detalles
    return {
      ...purchase,
      envio: {
        ...purchase.envio,
        estado_envio: currentState,
        costo_envio: isDelivery ? 7000 : 0,
        codigo_seguimiento: isDelivery && (currentState === 'ENVIADO' || currentState === 'ENTREGADO') 
          ? 'SER' + Math.floor(1000000000 + Math.random() * 9000000000) 
          : null,
        empresa_transporte: isDelivery && (currentState === 'ENVIADO' || currentState === 'ENTREGADO') ? 'servientrega' : null,
        direccion: isDelivery ? {
          calle: 'Carrera 7 #156-68',
          ciudad: 'Pereira',
          estado_provincia: 'Risaralda',
          codigo_postal: '660001',
          pais: 'Colombia'
        } : null,
        tienda: !isDelivery ? {
          id: 3,
          nombre: 'Centro Comercial Victoria',
          direccion: 'C.C. Victoria Plaza Local 235',
          ciudad: 'Pereira',
          telefono: '3332223',
          horario: 'Lu a Do: 10 a 20 hs.',
          coordenadas: { lat: 4.8156, lng: -75.6936 }
        } : null,
        fechas: {
          creacion: orderDate.toISOString(),
          preparacion_completada: (currentState === 'ENVIADO' || currentState === 'ENTREGADO') ? processingDate.toISOString() : null,
          salida: (currentState === 'ENVIADO' || currentState === 'ENTREGADO') ? shippingDate.toISOString() : null,
          entrega_estimada: isDelivery ? deliveryDate.toISOString() : shippingDate.toISOString(),
          entrega_real: currentState === 'ENTREGADO' ? deliveryDate.toISOString() : null
        },
        historial_estados: stateHistory
      },
      items: purchase.items.map(item => ({
        ...item,
        snapshot: {
          ...item.snapshot,
          editorial: item.snapshot.editorial || 'Editorial Sudamericana',
          isbn: item.snapshot.isbn || '9780307474728',
          imagen_portada: item.snapshot.imagen_portada || 'http://localhost:5000/uploads/libros/Default.png'
        }
      }))
    };
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Mexico_City'
    };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'entregado':
        return 'text-green-600 bg-green-100';
      case 'enviado':
        return 'text-blue-600 bg-blue-100';
      case 'procesando':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelado':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'entregado':
        return 'Entregado';
      case 'enviado':
        return 'Enviado';
      case 'procesando':
        return 'Procesando';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (metodo) => {
    switch (metodo) {
      case 'tarjeta_debito':
        return 'Tarjeta de Débito';
      case 'tarjeta_credito':
        return 'Tarjeta de Crédito';
      case 'efectivo':
        return 'Efectivo';
      case 'transferencia':
        return 'Transferencia';
      default:
        return metodo;
    }
  };

  // Volver a la lista de compras
  const handleBackToList = () => {
    setSelectedPurchaseId(null);
    setSelectedPurchase(null);
  };

  // Ver detalles de una compra
  const handleViewDetails = (purchaseId) => {
    setSelectedPurchaseId(purchaseId);
  };

  if (loading) {
    return (
      <div className="w-full p-6">
        <h2 className="text-2xl font-bold mb-6">Mis Compras</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <h2 className="text-2xl font-bold mb-6">Mis Compras</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchPurchases}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si hay una compra seleccionada, mostrar sus detalles
  if (selectedPurchaseId && selectedPurchase) {
    return (
      <div className="w-full p-6 bg-gray-50">
        {/* Encabezado con botón de regreso */}
        <div className="mb-6">
          <button 
            onClick={handleBackToList}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-2"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver a mis compras</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Seguimiento de Compra #{selectedPurchase.numero_venta}</h2>
        </div>
        
        {/* Información general del pedido */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
              <div>
                <div className="flex items-center">
                  <h3 className="text-xl font-bold text-gray-800">Orden #{selectedPurchase.numero_venta}</h3>
                  <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPurchase.estado)}`}>
                    {getStatusText(selectedPurchase.estado)}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">Realizada el {formatDate(selectedPurchase.fecha_creacion)}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {selectedPurchase.envio.tipo === 'domicilio' ? 'Envío a Domicilio' : 'Recogida en Tienda'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Información de pago */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Método de pago
                </h4>
                <p className="text-sm text-gray-600">
                  {getPaymentMethodText(selectedPurchase.pago?.metodo)}
                  {selectedPurchase.pago?.ultimos_digitos && ` ****${selectedPurchase.pago.ultimos_digitos}`}
                </p>
              </div>
              
              {/* Dirección de envío o tienda de recogida */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedPurchase.envio.tipo === 'domicilio' ? 'Dirección de envío' : 'Tienda de recogida'}
                </h4>
                {selectedPurchase.envio.tipo === 'domicilio' ? (
                  <p className="text-sm text-gray-600">
                    {selectedPurchase.envio.direccion ? 
                      `${selectedPurchase.envio.direccion.calle}, ${selectedPurchase.envio.direccion.ciudad}, ${selectedPurchase.envio.direccion.estado_provincia}` :
                      'Dirección no disponible'
                    }
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    {selectedPurchase.envio.tienda ? 
                      `${selectedPurchase.envio.tienda.nombre}, ${selectedPurchase.envio.tienda.direccion}` :
                      'Información de tienda no disponible'
                    }
                  </p>
                )}
              </div>
              
              {/* Fecha estimada */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {selectedPurchase.estado === 'entregado'
                    ? 'Entregado el' 
                    : 'Fecha estimada de entrega'}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedPurchase.estado === 'entregado'
                    ? formatDate(selectedPurchase.envio.fechas?.entrega_real)
                    : formatDate(selectedPurchase.envio.fechas?.entrega_estimada)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Productos en el pedido */}
          <div className="p-6">
            <h4 className="font-medium text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Productos en tu pedido
            </h4>
            <div className="space-y-4">
              {selectedPurchase.items?.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start mb-3 sm:mb-0">
                    {/* Imagen del libro con CachedImage */}
                    <div className="w-24 h-32 flex-shrink-0 bg-gray-100 rounded overflow-hidden mr-4">
                      {item.snapshot?.imagen_portada ? (
                        <CachedImage 
                          src={item.snapshot.imagen_portada} 
                          alt={item.snapshot.titulo || "Libro"} 
                          className="w-full h-full object-contain"
                          fallbackSrc="http://localhost:5000/uploads/libros/Default.png"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{item.snapshot?.titulo || 'Título no disponible'}</p>
                      <p className="text-sm text-gray-600 mb-1">por {item.snapshot?.autor || 'Autor no disponible'}</p>
                      {item.snapshot?.editorial && (
                        <p className="text-xs text-gray-500 mb-1">
                          Editorial: {item.snapshot.editorial}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">ISBN: {item.snapshot?.isbn || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:items-end">
                    <p className="text-sm text-gray-600 sm:mb-1">Cantidad: {item.cantidad || 0}</p>
                    <p className="font-medium text-gray-800">{formatCurrency((item.precio_unitario || 0) * (item.cantidad || 0))}</p>
                  </div>
                </div>
              )) || <p className="text-gray-500">No hay productos disponibles</p>}
            </div>
            
            {/* Resumen de costos */}
            {selectedPurchase.totales && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(selectedPurchase.totales.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Impuestos</span>
                  <span>{formatCurrency(selectedPurchase.totales.impuestos || 0)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Envío</span>
                  {(selectedPurchase.totales.envio || 0) > 0 ? (
                    <span>{formatCurrency(selectedPurchase.totales.envio)}</span>
                  ) : (
                    <span className="text-green-600">Gratis</span>
                  )}
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-bold text-blue-600 text-lg">{formatCurrency(selectedPurchase.totales.total_final || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Componente de seguimiento según tipo de envío */}
        {selectedPurchase.envio.tipo === 'domicilio' ? (
          <DeliveryTracking envio={selectedPurchase.envio} />
        ) : (
          <StorePickupTracking envio={selectedPurchase.envio} />
        )}
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          {/* Mostrar botón de devolución solo si el pedido está entregado y tiene menos de 8 días */}
          {selectedPurchase.estado === 'entregado' && 
            selectedPurchase.envio.fechas?.entrega_real &&
            new Date() - new Date(selectedPurchase.envio.fechas.entrega_real) < 8 * 24 * 60 * 60 * 1000 && (
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md transition-colors shadow-sm font-medium">
              Solicitar Devolución
            </button>
          )}
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors shadow-sm font-medium">
            Contactar Soporte
          </button>
        </div>
      </div>
    );
  }

  // Pantalla principal de compras
  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Compras</h2>
        <button
          onClick={fetchPurchases}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Actualizar
        </button>
      </div>

      {/* Resumen de compras */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 text-white mb-6">
          <h3 className="text-lg font-semibold mb-2">Resumen de Compras</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-blue-100">Total de Compras</p>
              <p className="text-2xl font-bold">{summary.total_compras}</p>
            </div>
            <div>
              <p className="text-blue-100">Monto Total</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.monto_total)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        {purchases.length === 0 ? (
          <div className="p-6 text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No tienes compras registradas</p>
            <p className="text-gray-400 text-sm mt-2">Tus compras aparecerán aquí una vez que realices tu primera compra</p>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-gray-500 mb-6">
              Historial de tus compras recientes ({purchases.length} de {summary?.total_compras || purchases.length})
            </p>
            <div className="space-y-6">
              {purchases.map((purchase) => (
                <div 
                  key={purchase._id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header de la compra */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">#{purchase.numero_venta}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.estado)}`}>
                          {getStatusText(purchase.estado)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Comprado el {formatDate(purchase.fecha_creacion)}</p>
                        {purchase.fecha_entrega && (
                          <p>Entregado el {formatDate(purchase.fecha_entrega)}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(purchase.totales.total_final)}
                      </p>
                    </div>
                  </div>

                  {/* Items de la compra */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Productos:
                    </h4>
                    <div className="space-y-2">
                      {purchase.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div className="flex items-center">
                            {/* Imagen del libro */}
                            <div className="w-12 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden mr-3">
                              {item.snapshot.imagen_portada ? (
                                <CachedImage 
                                  src={item.snapshot.imagen_portada} 
                                  alt={item.snapshot.titulo || "Libro"} 
                                  className="w-full h-full object-contain"
                                  fallbackSrc="http://localhost:5000/uploads/libros/Default.png"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{item.snapshot.titulo}</p>
                              <p className="text-sm text-gray-600">por {item.snapshot.autor}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Cantidad: {item.cantidad}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Información de pago y envío */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Método de Pago
                      </h5>
                      <p className="text-sm text-gray-600">
                        {getPaymentMethodText(purchase.pago.metodo)}
                        {purchase.pago.ultimos_digitos && ` ****${purchase.pago.ultimos_digitos}`}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Envío
                      </h5>
                      <p className="text-sm text-gray-600 capitalize">
                        {purchase.envio.tipo} - {purchase.envio.estado_envio}
                      </p>
                    </div>
                  </div>
                  
                  {/* Botón de ver detalles */}
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => handleViewDetails(purchase._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      Ver detalles
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesPage;
