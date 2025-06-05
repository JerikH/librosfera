import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken } from './authUtils';
import { useNavigate } from 'react-router-dom';

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPurchases();
  }, []);

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

  const handleViewDetails = (purchaseId) => {
    // Navegar a la página de detalles con el ID de la compra
    navigate(`/profile/purchases/${purchaseId}`);
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

  if (loading) {
    return (
      <div className="w-full p-6">
        <h2 className="text-2xl font-bold mb-6">Mis Compras</h2>
        <div className="bg-white rounded-lg shadow p-6">
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchPurchases}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Compras</h2>
        <button
          onClick={fetchPurchases}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Actualizar
        </button>
      </div>

      {/* Resumen de compras */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white mb-6">
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

      <div className="bg-white rounded-lg shadow">
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
                <div key={purchase._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                    <h4 className="font-medium text-gray-700 mb-2">Productos:</h4>
                    <div className="space-y-2">
                      {purchase.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <p className="font-medium">{item.snapshot.titulo}</p>
                            <p className="text-sm text-gray-600">por {item.snapshot.autor}</p>
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
                      <h5 className="font-medium text-gray-700 mb-1">Método de Pago</h5>
                      <p className="text-sm text-gray-600">
                        {getPaymentMethodText(purchase.pago.metodo)}
                        {purchase.pago.ultimos_digitos && ` ****${purchase.pago.ultimos_digitos}`}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Envío</h5>
                      <p className="text-sm text-gray-600 capitalize">
                        {purchase.envio.tipo} - {purchase.envio.estado_envio}
                      </p>
                    </div>
                  </div>
                  
                  {/* Botón Ver Detalles (NUEVO) */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={() => handleViewDetails(purchase._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver detalles
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