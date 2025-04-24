import React, { useState, useEffect } from 'react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'delete'
  const [filterType, setFilterType] = useState('all'); // 'all', 'cliente', 'administrador', 'root'

  useEffect(() => {
    // Simular carga de usuarios
    const fetchUsers = async () => {
      try {
        // Aquí iría una llamada API real para obtener usuarios
        setTimeout(() => {
          const dummyUsers = [
            {
              id: 1,
              usuario: 'juan.perez',
              email: 'juan.perez@example.com',
              tipo_usuario: 'cliente',
              fecha_registro: '2025-02-15T10:30:00Z',
              ultimo_acceso: '2025-04-22T14:20:00Z',
              activo: true,
              nombres: 'Juan',
              apellidos: 'Pérez',
              telefono: '123456789',
              direccion: 'Calle Principal 123',
              ciudad: 'Madrid',
              pedidos_totales: 12,
              gasto_total: 450.75
            },
            {
              id: 2,
              usuario: 'maria.lopez',
              email: 'maria.lopez@example.com',
              tipo_usuario: 'cliente',
              fecha_registro: '2025-01-20T09:15:00Z',
              ultimo_acceso: '2025-04-23T11:45:00Z',
              activo: true,
              nombres: 'María',
              apellidos: 'López',
              telefono: '987654321',
              direccion: 'Avenida Central 456',
              ciudad: 'Barcelona',
              pedidos_totales: 8,
              gasto_total: 320.50
            },
            {
              id: 3,
              usuario: 'admin.librosfera',
              email: 'admin@librosfera.com',
              tipo_usuario: 'administrador',
              fecha_registro: '2024-11-05T08:00:00Z',
              ultimo_acceso: '2025-04-24T09:30:00Z',
              activo: true,
              nombres: 'Admin',
              apellidos: 'Librosfera',
              telefono: '555123456',
              direccion: 'Calle de la Librería 1',
              ciudad: 'Valencia',
              pedidos_totales: 0,
              gasto_total: 0
            },
            {
              id: 4,
              usuario: 'carlos.rodriguez',
              email: 'carlos.rodriguez@example.com',
              tipo_usuario: 'cliente',
              fecha_registro: '2025-03-10T15:20:00Z',
              ultimo_acceso: '2025-04-20T18:10:00Z',
              activo: false,
              nombres: 'Carlos',
              apellidos: 'Rodríguez',
              telefono: '654789123',
              direccion: 'Plaza Mayor 78',
              ciudad: 'Sevilla',
              pedidos_totales: 3,
              gasto_total: 89.99
            },
            {
              id: 5,
              usuario: 'root.system',
              email: 'root@librosfera.com',
              tipo_usuario: 'root',
              fecha_registro: '2024-10-01T00:00:00Z',
              ultimo_acceso: '2025-04-24T08:00:00Z',
              activo: true,
              nombres: 'System',
              apellidos: 'Administrator',
              telefono: '000000000',
              direccion: 'Servidor Central',
              ciudad: 'Datacenter',
              pedidos_totales: 0,
              gasto_total: 0
            }
          ];
          setUsers(dummyUsers);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filtrar usuarios por término de búsqueda y tipo
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.nombres} ${user.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || user.tipo_usuario === filterType;
    
    return matchesSearch && matchesType;
  });

  // Manejar apertura del modal
  const openModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Obtener etiqueta de tipo de usuario
  const getUserTypeLabel = (type) => {
    switch(type) {
      case 'cliente':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Cliente</span>;
      case 'administrador':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Administrador</span>;
      case 'root':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Root</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{type}</span>;
    }
  };

  // Modal de usuario
  const UserModal = () => {
    if (!selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <span className="material-icons-outlined">close</span>
          </button>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            Detalles del Usuario
            <div className="ml-3">
              {getUserTypeLabel(selectedUser.tipo_usuario)}
            </div>
            <div className="ml-auto">
              {selectedUser.activo ? (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Activo</span>
              ) : (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Inactivo</span>
              )}
            </div>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">INFORMACIÓN BÁSICA</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nombre de usuario</p>
                  <p className="font-medium">{selectedUser.usuario}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nombre completo</p>
                  <p className="font-medium">{selectedUser.nombres} {selectedUser.apellidos}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{selectedUser.telefono || 'No disponible'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">DIRECCIÓN</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">{selectedUser.direccion || 'No disponible'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ciudad</p>
                  <p className="font-medium">{selectedUser.ciudad || 'No disponible'}</p>
                </div>
              </div>
              
              <h3 className="text-sm font-semibold text-gray-500 mt-6 mb-2">INFORMACIÓN DE CUENTA</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Fecha de registro</p>
                  <p className="font-medium">{formatDate(selectedUser.fecha_registro)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Último acceso</p>
                  <p className="font-medium">{formatDate(selectedUser.ultimo_acceso)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {selectedUser.tipo_usuario === 'cliente' && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">ACTIVIDAD DE COMPRA</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-600">Pedidos totales</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedUser.pedidos_totales}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-green-600">Gasto total</p>
                  <p className="text-2xl font-bold text-green-700">${selectedUser.gasto_total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-end space-x-3">
            {modalMode === 'view' && (
              <>
                <button
                  onClick={() => openModal('edit', selectedUser)}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Editar Usuario
                </button>
                <button
                  onClick={() => openModal('delete', selectedUser)}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  {selectedUser.activo ? 'Desactivar' : 'Activar'} Usuario
                </button>
              </>
            )}
            {modalMode === 'delete' && (
              <>
                <div className="text-center w-full mb-4">
                  <p className="text-lg mb-4">
                    ¿Está seguro que desea {selectedUser.activo ? 'desactivar' : 'activar'} al usuario "{selectedUser.usuario}"?
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        const updatedUsers = users.map(user => 
                          user.id === selectedUser.id ? { ...user, activo: !user.activo } : user
                        );
                        setUsers(updatedUsers);
                        setIsModalOpen(false);
                      }}
                      className={`px-4 py-2 ${selectedUser.activo ? 'bg-red-600' : 'bg-green-600'} text-white rounded`}
                    >
                      {selectedUser.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestionar Usuarios</h1>
        
        <div className="flex space-x-4">
          {/* Filtros de tipo de usuario */}
          <div className="flex rounded-md overflow-hidden border border-gray-300">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-sm ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('cliente')}
              className={`px-3 py-1 text-sm ${filterType === 'cliente' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Clientes
            </button>
            <button
              onClick={() => setFilterType('administrador')}
              className={`px-3 py-1 text-sm ${filterType === 'administrador' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Administradores
            </button>
          </div>
          
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar usuario"
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No se encontraron usuarios que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de registro
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {user.nombres ? user.nombres.charAt(0) : user.usuario.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.usuario}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUserTypeLabel(user.tipo_usuario)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.fecha_registro)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.activo ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal('view', user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => openModal('edit', user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openModal('delete', user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {user.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal */}
      {isModalOpen && <UserModal />}
    </div>
  );
};

export default ManageUsers;