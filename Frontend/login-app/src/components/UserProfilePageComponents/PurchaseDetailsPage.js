import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthToken } from './authUtils';
import UserLayout from '../UserLayout';

// Componentes auxiliares para diferentes tipos de seguimiento
import DeliveryTracking from './DeliveryTracking';
import StorePickupTracking from './StorePickupTracking';

const PurchaseDetailsPage = () => {
  const { purchaseId } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPurchaseDetails();
  }, [purchaseId]);

  const fetchPurchaseDetails = async () => {
    try {
      
      setLoading(true);
      setError(null);
      
      // En un entorno real, esta llamada traería los detalles desde el backend
      const response = await axios.get(`http://localhost:5000/api/v1/ventas/${purchaseId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("response:", response.data);

      if (response.data.status === 'success') {
        setPurchase(response.data.data.venta);
      }
    } catch (err) {
      console.error('Error fetching purchase details:', err);
      
      // Para propósitos de demostración, usamos datos simulados
      const mockData = generateMockPurchaseData(purchaseId);
      setPurchase(mockData);
      
      // En producción mostraríamos un error
      // setError('No se pudieron cargar los detalles de la compra. Por favor intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Función para generar datos de demostración
  const generateMockPurchaseData = (id) => {
    // Definir si el ejemplo será envío a domicilio o recogida en tienda
    const isDelivery = Math.random() > 0.5;
    
    // Generar fechas lógicas para el seguimiento
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - 3); // 3 días atrás
    
    const processingDate = new Date(orderDate);
    processingDate.setHours(orderDate.getHours() + 2);
    
    const shippingDate = new Date(processingDate);
    shippingDate.setDate(processingDate.getDate() + 1);
    
    const deliveryDate = new Date(shippingDate);
    deliveryDate.setDate(shippingDate.getDate() + 1);
    
    // Estado aleatorio del pedido
    const possibleStates = ['EN PREPARACION', 'ENVIADO', 'ENTREGADO'];
    const randomStateIndex = Math.floor(Math.random() * 3);
    const currentState = possibleStates[randomStateIndex];
    
    // Historial de estados basado en el estado actual
    let stateHistory = [
      {
        estado_anterior: null,
        estado_nuevo: 'EN PREPARACION',
        fecha: processingDate.toISOString(),
        descripcion: 'Pedido recibido y en preparación'
      }
    ];
    
    if (randomStateIndex >= 1) {
      stateHistory.push({
        estado_anterior: 'EN PREPARACION',
        estado_nuevo: 'ENVIADO',
        fecha: shippingDate.toISOString(),
        descripcion: 'Pedido enviado al destino'
      });
    }
    
    if (randomStateIndex >= 2) {
      stateHistory.push({
        estado_anterior: 'ENVIADO',
        estado_nuevo: 'ENTREGADO',
        fecha: deliveryDate.toISOString(),
        descripcion: 'Pedido entregado satisfactoriamente'
      });
    }
    
    return {
      _id: id,
      numero_venta: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      fecha_creacion: orderDate.toISOString(),
      estado: currentState === 'ENTREGADO' ? 'entregado' : 
              currentState === 'ENVIADO' ? 'enviado' : 'procesando',
      items: [
        {
          snapshot: {
            titulo: 'Cien años de soledad',
            autor: 'Gabriel García Márquez',
            editorial: 'Editorial Sudamericana',
            isbn: '9780307474728'
          },
          cantidad: 1,
          precio_unitario: 35000
        },
        {
          snapshot: {
            titulo: 'El amor en los tiempos del cólera',
            autor: 'Gabriel García Márquez',
            editorial: 'Editorial Oveja Negra',
            isbn: '9780307387264'
          },
          cantidad: 1,
          precio_unitario: 32000
        }
      ],
      totales: {
        subtotal: 67000,
        descuentos: 0,
        impuestos: 12730,
        envio: isDelivery ? 7000 : 0,
        total_final: isDelivery ? 86730 : 79730
      },
      envio: {
        tipo: isDelivery ? 'domicilio' : 'tienda',
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
        estado_envio: currentState,
        costo_envio: isDelivery ? 7000 : 0,
        codigo_seguimiento: isDelivery && randomStateIndex >= 1 ? 'SER' + Math.floor(1000000000 + Math.random() * 9000000000) : null,
        empresa_transporte: isDelivery && randomStateIndex >= 1 ? 'servientrega' : null,
        fechas: {
          creacion: orderDate.toISOString(),
          preparacion_completada: randomStateIndex >= 1 ? processingDate.toISOString() : null,
          salida: randomStateIndex >= 1 ? shippingDate.toISOString() : null,
          entrega_estimada: isDelivery ? deliveryDate.toISOString() : shippingDate.toISOString(),
          entrega_real: randomStateIndex >= 2 ? deliveryDate.toISOString() : null
        },
        historial_estados: stateHistory
      },
      pago: {
        metodo: 'tarjeta_credito',
        estado: 'completado',
        ultimos_digitos: '4242'
      }
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pendiente';
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (loading) {
    return (
      <UserLayout>
        <div className="w-full p-6">
          <div className="flex items-center mb-6">
            <button 
              onClick={() => navigate('/profile/purchases')}
              className="mr-3 text-blue-500 hover:text-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold">Cargando detalles...</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-6 bg-gray-200 rounded col-span-1"></div>
                  <div className="h-6 bg-gray-200 rounded col-span-2"></div>
                </div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="w-full p-6">
          <div className="flex items-center mb-6">
            <button 
              onClick={() => navigate('/profile/purchases')}
              className="mr-3 text-blue-500 hover:text-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold">Detalles de la compra</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchPurchaseDetails}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!purchase) {
    return (
      <UserLayout>
        <div className="w-full p-6">
          <div className="flex items-center mb-6">
            <button 
              onClick={() => navigate('/profile/purchases')}
              className="mr-3 text-blue-500 hover:text-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold">Detalles de la compra</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">No se encontró la información de la compra</p>
              <button
                onClick={() => navigate('/profile/purchases')}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Volver a mis compras
              </button>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="w-full p-6">
        {/* Encabezado con botón de regreso */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate('/profile/purchases')}
            className="mr-3 text-blue-500 hover:text-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver</span>
          </button>
          <h2 className="text-2xl font-bold">Seguimiento de Compra #{purchase.numero_venta}</h2>
        </div>
        
        {/* Información general del pedido */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Orden #{purchase.numero_venta}</h3>
                <p className="text-gray-600">Realizada el {formatDate(purchase.fecha_creacion)}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {purchase.envio.tipo === 'domicilio' ? 'Envío a Domicilio' : 'Recogida en Tienda'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Información de pago */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Método de pago</h4>
                <p className="text-sm text-gray-600">
                  {getPaymentMethodText(purchase.pago.metodo)}
                  {purchase.pago.ultimos_digitos && ` ****${purchase.pago.ultimos_digitos}`}
                </p>
              </div>
              
              {/* Dirección de envío o tienda de recogida */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  {purchase.envio.tipo === 'domicilio' ? 'Dirección de envío' : 'Tienda de recogida'}
                </h4>
                {purchase.envio.tipo === 'domicilio' ? (
                  <p className="text-sm text-gray-600">
                    {purchase.envio.direccion.calle}, {purchase.envio.direccion.ciudad}, {purchase.envio.direccion.estado_provincia}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    {purchase.envio.tienda.nombre}, {purchase.envio.tienda.direccion}
                  </p>
                )}
              </div>
              
              {/* Fecha estimada */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  {purchase.envio.estado_envio === 'ENTREGADO' 
                    ? 'Entregado el' 
                    : 'Fecha estimada de entrega'}
                </h4>
                <p className="text-sm text-gray-600">
                  {/* {purchase.envio.estado_envio === 'ENTREGADO' 
                    ? formatDate(purchase.envio.fechas.entrega_real)
                    : formatDate(purchase.envio.fechas.entrega_estimada)} */}
                </p>
              </div>
            </div>
          </div>
          
          {/* Productos en el pedido */}
          <div className="p-6">
            <h4 className="font-medium text-gray-700 mb-4">Productos en tu pedido</h4>
            <div className="space-y-4">
              {purchase.items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start mb-3 sm:mb-0">
                    {/* Aquí podría ir una imagen del libro */}
                    <div className="w-12 h-16 bg-gray-200 rounded mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">{item.snapshot.titulo}</p>
                      <p className="text-sm text-gray-600">por {item.snapshot.autor}</p>
                      <p className="text-xs text-gray-500">ISBN: {item.snapshot.isbn}</p>
                    </div>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:items-end">
                    <p className="text-sm text-gray-600 sm:mb-1">Cantidad: {item.cantidad}</p>
                    <p className="font-medium">{formatCurrency(item.precio_unitario * item.cantidad)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Resumen de costos */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(purchase.totales.subtotal)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Impuestos</span>
                <span>{formatCurrency(purchase.totales.impuestos)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Envío</span>
                {purchase.totales.envio > 0 ? (
                  <span>{formatCurrency(purchase.totales.envio)}</span>
                ) : (
                  <span className="text-green-600">Gratis</span>
                )}
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                <span>Total</span>
                <span>{formatCurrency(purchase.totales.total_final)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Componente de seguimiento según tipo de envío */}
        {purchase.envio.tipo === 'domicilio' ? (
          <DeliveryTracking envio={purchase.envio} />
        ) : (
          <StorePickupTracking envio={purchase.envio} />
        )}
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          {/* Mostrar botón de devolución solo si el pedido está entregado y tiene menos de 8 días */}
          {/* {purchase.envio.estado_envio === 'ENTREGADO' && 
            new Date() - new Date(purchase.envio.fechas.entrega_real) < 8 * 24 * 60 * 60 * 1000 && (
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded transition-colors">
              Solicitar Devolución
            </button>
          )} */}
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors">
            Contactar Soporte
          </button>
        </div>
      </div>
    </UserLayout>
  );
};

export default PurchaseDetailsPage;