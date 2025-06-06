import React, { useState, useEffect, useCallback } from 'react';

const ManageSales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [statistics, setStatistics] = useState(null);

  // Estados de envío disponibles
  const shippingStates = [
    { value: 'preparando', label: 'Preparando', color: 'bg-blue-100 text-blue-800' },
    { value: 'listo_para_envio', label: 'Listo para envío', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'enviado', label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
    { value: 'entregado', label: 'Entregado', color: 'bg-green-100 text-green-800' }
  ];

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // Utility - Get auth token from cookie
  const getAuthToken = useCallback(() => {
    const dataCookie = getCookie("data");
    if (!dataCookie) return '';
    
    try {
      const parsedData = JSON.parse(dataCookie);
      return parsedData.authToken || '';
    } catch (e) {
      console.error('Error parsing auth token:', e);
      return '';
    }
  }, []);

  const getApiHeaders = () => ({
    'Authorization': `Bearer ${getAuthToken()}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch sales statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ventas/estadisticas`,
        { 
          method: 'GET',
          headers: getApiHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setStatistics(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchSales = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '200',
      });

      // Add filters to params only if they have values
      if (filters.estado && filters.estado !== 'todos') {
        params.append('estado', filters.estado);
      }
      
      // Only search if there's a meaningful search term (at least 2 characters)
      if (filters.searchTerm && filters.searchTerm.length >= 2) {
        params.append('numero_venta', filters.searchTerm);
      }
      
      if (filters.dateFrom) {
        params.append('fecha_desde', new Date(filters.dateFrom).toISOString());
      }
      
      if (filters.dateTo) {
        params.append('fecha_hasta', new Date(filters.dateTo).toISOString());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/ventas/admin/todas?${params}`,
        {
          method: 'GET',
          headers: getApiHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          const ventasData = data.data?.ventas || [];
          setSales(Array.isArray(ventasData) ? ventasData : []);
          setTotalResults(ventasData.length || 0);
          setTotalPages(Math.ceil((ventasData.length || 0) / 50)); // Assuming 50 per page
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      alert('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleDetails = async (numeroVenta) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ventas/${numeroVenta}`,
        {
          method: 'GET',
          headers: getApiHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          return data.data.venta;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching sale details:', error);
      alert('Error al cargar los detalles de la venta');
      return null;
    }
  };

  // Load initial data and statistics
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Fetch sales when filters change (using debounced search term)
  useEffect(() => {
    const filters = {
      estado: statusFilter,
      searchTerm: debouncedSearchTerm,
      dateFrom: dateFilter,
      dateTo: dateFilter
    };
    
    fetchSales(currentPage, filters);
  }, [currentPage, statusFilter, debouncedSearchTerm, dateFilter]);

  // Apply local filtering for immediate UI response
  useEffect(() => {
    if (Array.isArray(sales)) {
      let filtered = [...sales];
      
      // If we have a search term but it's less than 2 characters, filter locally
      if (searchTerm && searchTerm.length < 2) {
        filtered = filtered.filter(sale => 
          sale.numero_venta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.id_cliente?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.id_cliente?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.id_cliente?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setFilteredSales(filtered);
    } else {
      setFilteredSales([]);
    }
  }, [sales, searchTerm]);

  const updateShippingStatus = async (numeroVenta, newStatus) => {
    try {
      const requestData = {
        estado: newStatus
      };

      // Add required fields based on status
      if (newStatus === 'enviado') {
        const numeroGuia = prompt('Ingrese el número de guía:');
        if (!numeroGuia) {
          alert('El número de guía es requerido para el estado "enviado"');
          return;
        }
        requestData.numero_guia = numeroGuia;
        
        const transportadora = prompt('Ingrese la transportadora (opcional):');
        if (transportadora) {
          requestData.transportadora = transportadora;
        }

        const notasEnvio = prompt('Notas adicionales del envío (opcional):');
        if (notasEnvio) {
          requestData.notas_envio = notasEnvio;
        }

        requestData.fecha_envio = new Date().toISOString();
      } else if (newStatus === 'entregado') {
        requestData.fecha_entrega = new Date().toISOString();
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/ventas/${numeroVenta}/envio`,
        {
          method: 'PATCH',
          headers: getApiHeaders(),
          body: JSON.stringify(requestData)
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Update local state
          setSales(prevSales => {
            if (!Array.isArray(prevSales)) return [];
            return prevSales.map(sale => 
              sale.numero_venta === numeroVenta 
                ? { 
                    ...sale, 
                    envio: { 
                      ...sale.envio, 
                      estado_envio: newStatus,
                      ...(requestData.numero_guia && { numero_guia: requestData.numero_guia }),
                      ...(requestData.transportadora && { transportadora: requestData.transportadora }),
                      ...(requestData.fecha_envio && { fecha_envio: requestData.fecha_envio }),
                      ...(requestData.fecha_entrega && { fecha_entrega: requestData.fecha_entrega }),
                      ...(requestData.notas_envio && { notas_envio: requestData.notas_envio })
                    }
                  }
                : sale
            );
          });
          
          // Update selected sale if it's the same one
          if (selectedSale && selectedSale.numero_venta === numeroVenta) {
            setSelectedSale(prev => ({
              ...prev,
              envio: {
                ...prev.envio,
                estado_envio: newStatus,
                ...(requestData.numero_guia && { numero_guia: requestData.numero_guia }),
                ...(requestData.transportadora && { transportadora: requestData.transportadora }),
                ...(requestData.fecha_envio && { fecha_envio: requestData.fecha_envio }),
                ...(requestData.fecha_entrega && { fecha_entrega: requestData.fecha_entrega }),
                ...(requestData.notas_envio && { notas_envio: requestData.notas_envio })
              }
            }));
          }
          
          alert(`Estado actualizado a: ${getStatusInfo(newStatus).label}`);
          
          // Refresh statistics
          fetchStatistics();
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating shipping status:', error);
      alert('Error al actualizar el estado del envío');
    }
  };

  const handleViewDetails = async (sale) => {
    const saleDetails = await fetchSaleDetails(sale.numero_venta);
    if (saleDetails) {
      setSelectedSale(saleDetails);
      setShowModal(true);
    }
  };

  const getStatusInfo = (status) => {
    return shippingStates.find(state => state.value === status) || 
           { value: status, label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setDateFilter('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Administrar Ventas</h1>
          <p className="text-gray-600">Gestiona los pedidos y actualiza el estado de los envíos</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Número de venta, cliente, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && searchTerm.length < 2 && (
                <p className="text-xs text-gray-500 mt-1">Ingrese al menos 2 caracteres para buscar</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="preparando">Preparando</option>
                {shippingStates.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Ventas</h3>
            <p className="text-2xl font-bold text-gray-900">
              {statistics?.resumen?.cantidad_ordenes || filteredSales.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Preparando</h3>
            <p className="text-2xl font-bold text-blue-600">
              {statistics?.por_estado?.find(estado => estado._id === 'preparando')?.cantidad || 
               filteredSales.filter(s => s.estado === 'preparando').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Listo para Envío</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {statistics?.por_estado?.find(estado => estado._id === 'listo_para_envio')?.cantidad || 
               filteredSales.filter(s => s.envio?.estado_envio === 'listo_para_envio').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Enviado</h3>
            <p className="text-2xl font-bold text-purple-600">
              {statistics?.por_estado?.find(estado => estado._id === 'enviado')?.cantidad || 
               filteredSales.filter(s => s.envio?.estado_envio === 'enviado').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Entregado</h3>
            <p className="text-2xl font-bold text-green-600">
              {statistics?.por_estado?.find(estado => estado._id === 'entregado')?.cantidad || 
               filteredSales.filter(s => s.envio?.estado_envio === 'entregado').length}
            </p>
          </div>
        </div>

        {/* Additional Statistics Row */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Ingresos Totales</h3>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(statistics.resumen?.total_ventas || 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Ticket Promedio</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(statistics.resumen?.ticket_promedio || 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Descuentos</h3>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(statistics.resumen?.total_descuentos || 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Envíos</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(statistics.resumen?.total_envios || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Lista de ventas */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Envío
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron ventas que coincidan con la búsqueda' : 'No se encontraron ventas'}
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const statusInfo = getStatusInfo(sale.estado || 'pendiente');
                    return (
                      <tr key={sale._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.numero_venta}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.id_cliente?.nombres} {sale.id_cliente?.apellidos}
                            </div>
                            <div className="text-sm text-gray-500">
                              {sale.id_cliente?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(sale.fecha_creacion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(sale.totales?.total_final || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(sale)}
                            className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                          >
                            Ver detalles
                          </button>
                          <button
                            onClick={() => handleViewDetails(sale)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                          >
                            Cambiar estado
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal para ver detalles y cambiar estado */}
        {showModal && selectedSale && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Detalle de Venta {selectedSale.numero_venta}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                {/* Información del cliente */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p><strong>Nombre:</strong> {selectedSale.id_cliente?.nombres} {selectedSale.id_cliente?.apellidos}</p>
                    <p><strong>Email:</strong> {selectedSale.id_cliente?.email}</p>
                    <p><strong>Teléfono:</strong> {selectedSale.id_cliente?.telefono || 'N/A'}</p>
                    <p><strong>Fecha de venta:</strong> {formatDate(selectedSale.fecha_creacion)}</p>
                    <p><strong>Total:</strong> {formatCurrency(selectedSale.totales?.total_final || 0)}</p>
                  </div>
                </div>

                {/* Productos */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Productos</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    {selectedSale.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
                        <div>
                          <span className="font-medium">{item.snapshot?.titulo}</span>
                          <p className="text-sm text-gray-600">Autor: {item.snapshot?.autor}</p>
                          <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                        </div>
                        <span className="font-medium">{formatCurrency(item.precios?.subtotal || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Información de envío */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Información de Envío</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p><strong>Tipo:</strong> {selectedSale.envio?.tipo}</p>
                    <p><strong>Estado:</strong> {getStatusInfo(selectedSale.envio?.estado_envio).label}</p>
                    {selectedSale.envio?.numero_guia && (
                      <p><strong>Número de guía:</strong> {selectedSale.envio.numero_guia}</p>
                    )}
                    {selectedSale.envio?.transportadora && (
                      <p><strong>Transportadora:</strong> {selectedSale.envio.transportadora}</p>
                    )}
                    {selectedSale.envio?.fecha_envio && (
                      <p><strong>Fecha de envío:</strong> {formatDate(selectedSale.envio.fecha_envio)}</p>
                    )}
                    {selectedSale.envio?.fecha_entrega && (
                      <p><strong>Fecha de entrega:</strong> {formatDate(selectedSale.envio.fecha_entrega)}</p>
                    )}
                    {selectedSale.envio?.notas_envio && (
                      <p><strong>Notas:</strong> {selectedSale.envio.notas_envio}</p>
                    )}
                    <p><strong>Dirección:</strong> {selectedSale.envio?.direccion?.calle}, {selectedSale.envio?.direccion?.ciudad}</p>
                  </div>
                </div>

                {/* Cambiar estado */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Cambiar Estado</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {shippingStates.map((state) => (
                      <button
                        key={state.value}
                        onClick={() => updateShippingStatus(selectedSale.numero_venta, state.value)}
                        disabled={state.value === selectedSale.envio?.estado_envio}
                        className={`p-2 text-sm rounded transition-colors ${
                          state.value === selectedSale.envio?.estado_envio
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                      >
                        {state.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSales;