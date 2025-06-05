import React, { useState, useEffect } from 'react';

const ManageSales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('');

  // Estados de envío disponibles
  const shippingStates = [
    { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'procesando', label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
    { value: 'enviado', label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
    { value: 'en_transito', label: 'En Tránsito', color: 'bg-orange-100 text-orange-800' },
    { value: 'entregado', label: 'Entregado', color: 'bg-green-100 text-green-800' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ];

  // Datos simulados (mock data)
  const mockSalesData = [
    {
      id_venta: 1001,
      cliente_nombre: 'María García',
      cliente_email: 'maria.garcia@email.com',
      fecha_venta: '2024-03-15T10:30:00Z',
      total: 45000,
      estado_envio: 'pendiente',
      productos: [
        { nombre: 'Cien años de soledad', cantidad: 1, precio: 25000 },
        { nombre: 'El amor en los tiempos del cólera', cantidad: 1, precio: 20000 }
      ]
    },
    {
      id_venta: 1002,
      cliente_nombre: 'Carlos Rodríguez',
      cliente_email: 'carlos.rodriguez@email.com',
      fecha_venta: '2024-03-14T14:15:00Z',
      total: 32000,
      estado_envio: 'procesando',
      productos: [
        { nombre: 'Don Quijote de la Mancha', cantidad: 2, precio: 16000 }
      ]
    },
    {
      id_venta: 1003,
      cliente_nombre: 'Ana López',
      cliente_email: 'ana.lopez@email.com',
      fecha_venta: '2024-03-13T09:45:00Z',
      total: 78000,
      estado_envio: 'enviado',
      productos: [
        { nombre: 'La Odisea', cantidad: 1, precio: 28000 },
        { nombre: 'Matemáticas Avanzadas', cantidad: 1, precio: 50000 }
      ]
    },
    {
      id_venta: 1004,
      cliente_nombre: 'Diego Martínez',
      cliente_email: 'diego.martinez@email.com',
      fecha_venta: '2024-03-12T16:20:00Z',
      total: 55000,
      estado_envio: 'en_transito',
      productos: [
        { nombre: 'Historia Universal', cantidad: 1, precio: 35000 },
        { nombre: 'Geografía Mundial', cantidad: 1, precio: 20000 }
      ]
    },
    {
      id_venta: 1005,
      cliente_nombre: 'Laura Sánchez',
      cliente_email: 'laura.sanchez@email.com',
      fecha_venta: '2024-03-11T11:10:00Z',
      total: 42000,
      estado_envio: 'entregado',
      productos: [
        { nombre: 'Química Orgánica', cantidad: 1, precio: 42000 }
      ]
    },
    {
      id_venta: 1006,
      cliente_nombre: 'Roberto Fernández',
      cliente_email: 'roberto.fernandez@email.com',
      fecha_venta: '2024-03-10T13:30:00Z',
      total: 25000,
      estado_envio: 'cancelado',
      productos: [
        { nombre: 'El Principito', cantidad: 1, precio: 15000 },
        { nombre: 'Alice en el País de las Maravillas', cantidad: 1, precio: 10000 }
      ]
    },
    {
      id_venta: 1007,
      cliente_nombre: 'Sofia Herrera',
      cliente_email: 'sofia.herrera@email.com',
      fecha_venta: '2024-03-09T15:45:00Z',
      total: 67000,
      estado_envio: 'pendiente',
      productos: [
        { nombre: 'Física Cuántica', cantidad: 1, precio: 45000 },
        { nombre: 'Estadística Aplicada', cantidad: 1, precio: 22000 }
      ]
    },
    {
      id_venta: 1008,
      cliente_nombre: 'Andrés Torres',
      cliente_email: 'andres.torres@email.com',
      fecha_venta: '2024-03-08T08:15:00Z',
      total: 38000,
      estado_envio: 'procesando',
      productos: [
        { nombre: 'Literatura Española', cantidad: 1, precio: 28000 },
        { nombre: 'Poesía Contemporánea', cantidad: 1, precio: 10000 }
      ]
    }
  ];

  // Simular carga de datos
  useEffect(() => {
    const loadMockData = () => {
      setLoading(true);
      // Simular delay de carga
      setTimeout(() => {
        setSales(mockSalesData);
        setLoading(false);
      }, 1000);
    };

    loadMockData();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [sales, searchTerm, statusFilter, dateFilter]);

  const applyFilters = () => {
    let filtered = [...sales];

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(sale => 
        sale.id_venta?.toString().includes(searchTerm) ||
        sale.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(sale => sale.estado_envio === statusFilter);
    }

    // Filtro por fecha
    if (dateFilter) {
      filtered = filtered.filter(sale => 
        new Date(sale.fecha_venta).toISOString().split('T')[0] === dateFilter
      );
    }

    setFilteredSales(filtered);
  };

  const updateShippingStatus = (saleId, newStatus) => {
    try {
      // Simular actualización en el estado local
      setSales(prevSales => 
        prevSales.map(sale => 
          sale.id_venta === saleId 
            ? { ...sale, estado_envio: newStatus }
            : sale
        )
      );
      
      // Cerrar modal
      setShowModal(false);
      setSelectedSale(null);
      
      // Mostrar mensaje de éxito
      alert(`Estado actualizado a: ${getStatusInfo(newStatus).label}`);
    } catch (error) {
      console.error('Error updating shipping status:', error);
      alert('Error al actualizar el estado del envío');
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
                placeholder="ID venta, cliente, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('todos');
                  setDateFilter('');
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Ventas</h3>
            <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {sales.filter(s => s.estado_envio === 'pendiente').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">En Tránsito</h3>
            <p className="text-2xl font-bold text-blue-600">
              {sales.filter(s => s.estado_envio === 'en_transito').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Entregados</h3>
            <p className="text-2xl font-bold text-green-600">
              {sales.filter(s => s.estado_envio === 'entregado').length}
            </p>
          </div>
        </div>

        {/* Lista de ventas */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Venta
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
                      No se encontraron ventas
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const statusInfo = getStatusInfo(sale.estado_envio);
                    return (
                      <tr key={sale.id_venta} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{sale.id_venta}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.cliente_nombre || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {sale.cliente_email || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(sale.fecha_venta)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(sale.total || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Ver detalles
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
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
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Detalle de Venta #{selectedSale.id_venta}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                {/* Información del cliente */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p><strong>Nombre:</strong> {selectedSale.cliente_nombre || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedSale.cliente_email || 'N/A'}</p>
                    <p><strong>Fecha de venta:</strong> {formatDate(selectedSale.fecha_venta)}</p>
                    <p><strong>Total:</strong> {formatCurrency(selectedSale.total || 0)}</p>
                  </div>
                </div>

                {/* Productos */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Productos</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    {selectedSale.productos?.map((producto, index) => (
                      <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
                        <span>{producto.nombre} (x{producto.cantidad})</span>
                        <span className="font-medium">{formatCurrency(producto.precio * producto.cantidad)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estado actual */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Estado Actual del Envío</h4>
                  <div className="mb-4">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusInfo(selectedSale.estado_envio).color}`}>
                      {getStatusInfo(selectedSale.estado_envio).label}
                    </span>
                  </div>
                </div>

                {/* Cambiar estado */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Cambiar Estado</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {shippingStates.map((state) => (
                      <button
                        key={state.value}
                        onClick={() => updateShippingStatus(selectedSale.id_venta, state.value)}
                        disabled={state.value === selectedSale.estado_envio}
                        className={`p-2 text-sm rounded transition-colors ${
                          state.value === selectedSale.estado_envio
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
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded"
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