import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CachedImage from '../CachedImage'; // Assuming this component exists in your project

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'delete'
  const [filterType, setFilterType] = useState('all'); // 'all', 'cliente', 'administrador', 'root'
  const [pagination, setPagination] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    totalPaginas: 0
  });
  const [editFormData, setEditFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Define profile image URLs
  const API_BASE_URL = 'http://localhost:5000';
  const DEFAULT_PROFILE_PIC = `${API_BASE_URL}/uploads/profiles/default.jpg`;

  // API token from localStorage
  
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const getAuthToken = () => {
    const dataCookie = getCookie("data");
    if (!dataCookie) return '';
    
    try {
      const parsedData = JSON.parse(dataCookie);
      return parsedData.authToken || '';
    } catch (e) {
      console.error('Error parsing auth token:', e);
      return '';
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.pagina, filterType]);

  // Function to fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/api/v1/users?page=${pagination.pagina}&limit=${pagination.limite}`;
      
      // Add filter type if not 'all'
      if (filterType !== 'all') {
        url += `&tipo_usuario=${filterType}`;
      }
      
      // Add search term if present
      if (searchTerm.trim()) {
        url += `&usuario=${searchTerm.trim()}&email=${searchTerm.trim()}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.data.status === 'success') {
        setUsers(response.data.data);
        setPagination(response.data.paginacion);
      } else {
        throw new Error('Error al obtener usuarios');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setActionMessage({
        type: 'error',
        text: 'Error al cargar usuarios. Por favor, inténtelo de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error('Error al obtener detalles del usuario');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setActionMessage({
        type: 'error',
        text: 'Error al cargar detalles del usuario.'
      });
      return null;
    }
  };

  // Handle search action
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPaginas) {
      setPagination(prev => ({ ...prev, pagina: newPage }));
    }
  };

  // Determine profile image source
  const getProfileImageSrc = (user) => {
    if (!user) return DEFAULT_PROFILE_PIC;
    
    if (user.foto_perfil) {
      // Check if the URL is already absolute
      return user.foto_perfil.startsWith('http') 
        ? user.foto_perfil 
        : `${API_BASE_URL}${user.foto_perfil.startsWith('/') ? '' : '/'}${user.foto_perfil}`;
    }
    
    return DEFAULT_PROFILE_PIC;
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

  // Check if user can be modified or deactivated
  const canModifyUser = (user) => {
    return user && user.tipo_usuario === 'cliente';
  };

  // Manejar apertura del modal
  const openModal = async (mode, user = null) => {
    if (user) {
      // For detailed view and actions, fetch complete user details
      if (mode === 'view' || mode === 'edit' || mode === 'delete') {
        setIsLoading(true);
        const userDetails = await fetchUserDetails(user._id);
        setSelectedUser(userDetails);
        
        if (mode === 'edit') {
          setEditFormData({
            nombres: userDetails.nombres || '',
            apellidos: userDetails.apellidos || '',
            DNI: userDetails.DNI || '',
            telefono: userDetails.telefono || '',
            email: userDetails.email || '',
            activo: userDetails.activo || false,
            cargo: userDetails.cargo || '',
          });
        }
        
        setIsLoading(false);
      } else {
        setSelectedUser(user);
      }
    }
    
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/${selectedUser._id}`,
        editFormData,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        setActionMessage({
          type: 'success',
          text: 'Usuario actualizado correctamente'
        });
        
        // Update the user in the list
        setUsers(prev => prev.map(user => 
          user._id === selectedUser._id ? { ...user, ...editFormData } : user
        ));
        
        // Close modal after a short delay
        setTimeout(() => {
          setIsModalOpen(false);
          fetchUsers(); // Refresh the list
        }, 1500);
      } else {
        throw new Error('Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setFormErrors({ general: 'Error al actualizar el usuario. Por favor, inténtelo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user activation/deactivation
  const handleToggleUserStatus = async () => {
    setIsSubmitting(true);
    
    try {
      if (selectedUser.activo) {
        // Deactivate user
        const response = await axios.delete(
          `${API_BASE_URL}/api/v1/users/${selectedUser._id}`,
          {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.data.status === 'success') {
          setActionMessage({
            type: 'success',
            text: 'Usuario desactivado correctamente'
          });
          
          // Update user status in the list
          setUsers(prev => prev.map(user => 
            user._id === selectedUser._id ? { ...user, activo: false } : user
          ));
        } else {
          throw new Error('Error al desactivar usuario');
        }
      } else {
        // Activate user (using PUT to update the user's active status)
        const response = await axios.put(
          `${API_BASE_URL}/api/v1/users/${selectedUser._id}`,
          { activo: true },
          {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.status === 'success') {
          setActionMessage({
            type: 'success',
            text: 'Usuario activado correctamente'
          });
          
          // Update user status in the list
          setUsers(prev => prev.map(user => 
            user._id === selectedUser._id ? { ...user, activo: true } : user
          ));
        } else {
          throw new Error('Error al activar usuario');
        }
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        setIsModalOpen(false);
        fetchUsers(); // Refresh the list
      }, 1500);
    } catch (error) {
      console.error('Error toggling user status:', error);
      setActionMessage({
        type: 'error',
        text: `Error al ${selectedUser.activo ? 'desactivar' : 'activar'} al usuario.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal Content Component
  const UserModal = () => {
    if (!selectedUser) return null;

    const isRestrictedUser = selectedUser.tipo_usuario === 'administrador' || selectedUser.tipo_usuario === 'root';

    // View User Details Modal
    if (modalMode === 'view') {
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
            
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 mr-4">
                <CachedImage 
                  src={getProfileImageSrc(selectedUser)}
                  alt={selectedUser.usuario || 'Usuario'} 
                  className="w-full h-full object-cover"
                  fallbackSrc={DEFAULT_PROFILE_PIC}
                  fallbackComponent={
                    <div className="w-full h-full flex items-center justify-center bg-yellow-200">
                      <span className="text-2xl font-bold text-yellow-500">
                        {selectedUser.usuario?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  }
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedUser.usuario}</h3>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">INFORMACIÓN BÁSICA</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nombre completo</p>
                    <p className="font-medium">{selectedUser.nombres} {selectedUser.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">DNI</p>
                    <p className="font-medium">{selectedUser.DNI || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{selectedUser.telefono || 'No disponible'}</p>
                  </div>
                  {selectedUser.telefono_alternativo && (
                    <div>
                      <p className="text-sm text-gray-500">Teléfono alternativo</p>
                      <p className="font-medium">{selectedUser.telefono_alternativo}</p>
                    </div>
                  )}
                  {selectedUser.cargo && (
                    <div>
                      <p className="text-sm text-gray-500">Cargo</p>
                      <p className="font-medium">{selectedUser.cargo}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                {selectedUser.direcciones && selectedUser.direcciones.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">DIRECCIÓN</h3>
                    <div className="space-y-3">
                      {selectedUser.direcciones.map((dir, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium">{dir.tipo || 'Principal'}</p>
                          <p className="text-sm">{dir.calle}</p>
                          <p className="text-sm">{dir.codigo_postal}, {dir.ciudad}</p>
                          <p className="text-sm">{dir.pais}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                <h3 className="text-sm font-semibold text-gray-500 mt-6 mb-2">INFORMACIÓN DE CUENTA</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Fecha de registro</p>
                    <p className="font-medium">{formatDate(selectedUser.fecha_registro)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Última actualización</p>
                    <p className="font-medium">{formatDate(selectedUser.fecha_actualizacion)}</p>
                  </div>
                </div>
                
                {selectedUser.preferencias && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">PREFERENCIAS</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {selectedUser.preferencias.temas && selectedUser.preferencias.temas.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500">Temas de interés</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedUser.preferencias.temas.map((tema, idx) => (
                              <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {tema}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedUser.preferencias.autores && selectedUser.preferencias.autores.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Autores favoritos</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedUser.preferencias.autores.map((autor, idx) => (
                              <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {autor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              {!isRestrictedUser && (
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
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Edit User Form Modal
    if (modalMode === 'edit') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <span className="material-icons-outlined">close</span>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Editar Usuario
            </h2>
            
            {actionMessage.text && (
              <div className={`p-4 mb-4 rounded ${
                actionMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {actionMessage.text}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres
                  </label>
                  <input
                    type="text"
                    name="nombres"
                    value={editFormData.nombres || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="apellidos"
                    value={editFormData.apellidos || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    name="DNI"
                    value={editFormData.DNI || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={editFormData.telefono || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo / Rol
                  </label>
                  <input
                    type="text"
                    name="cargo"
                    value={editFormData.cargo || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={editFormData.activo || false}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña (Dejar en blanco para mantener la actual)
                  </label>
                  <input
                    type="password"
                    name="password"
                    //value={editFormData.password || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Nueva contraseña"
                  />
                </div>
              </div>
              
              {formErrors.general && (
                <div className="text-red-600 text-sm">
                  {formErrors.general}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    
    // Delete/Deactivate User Confirmation Modal
    if (modalMode === 'delete') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <span className="material-icons-outlined">close</span>
            </button>
            
            <div className="text-center py-4">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full overflow-hidden">
                <CachedImage 
                  src={getProfileImageSrc(selectedUser)}
                  alt={selectedUser.usuario || 'Usuario'} 
                  className="w-full h-full object-cover"
                  fallbackSrc={DEFAULT_PROFILE_PIC}
                  fallbackComponent={
                    <div className="w-full h-full flex items-center justify-center bg-yellow-200">
                      <span className="text-4xl font-bold text-yellow-500">
                        {selectedUser.usuario?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  }
                />
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {selectedUser.activo ? 'Desactivar' : 'Activar'} Usuario
              </h2>
              
              {actionMessage.text && (
                <div className={`p-4 mb-4 rounded ${
                  actionMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {actionMessage.text}
                </div>
              )}
              
              <p className="text-gray-600 mb-8">
                ¿Está seguro que desea {selectedUser.activo ? 'desactivar' : 'activar'} al usuario <strong>{selectedUser.usuario}</strong>?
                {selectedUser.activo && (
                  <span className="block mt-2 text-sm text-gray-500">
                    El usuario perderá acceso a la plataforma pero sus datos se conservarán.
                  </span>
                )}
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleToggleUserStatus}
                  className={`px-4 py-2 ${
                    selectedUser.activo ? 'bg-red-600' : 'bg-green-600'
                  } text-white rounded flex items-center justify-center`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Procesando...
                    </>
                  ) : (
                    selectedUser.activo ? 'Sí, desactivar' : 'Sí, activar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
      {/* Header and search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestionar Usuarios</h1>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
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
            <button
              onClick={() => setFilterType('root')}
              className={`px-3 py-1 text-sm ${filterType === 'root' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Root
            </button>
          </div>
          
          {/* Búsqueda */}
          <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar por usuario o email"
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <button 
              type="submit" 
              className="absolute right-2 top-2 text-blue-600 hover:text-blue-800"
            >
              <span className="material-icons-outlined text-sm">search</span>
            </button>
          </form>
        </div>
      </div>

      {/* Mensajes de estado */}
      {actionMessage.text && !isModalOpen && (
        <div className={`p-4 mb-6 rounded ${
          actionMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
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
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          <CachedImage 
                            src={getProfileImageSrc(user)}
                            alt={user.usuario || 'Usuario'} 
                            className="w-full h-full object-cover"
                            fallbackSrc={DEFAULT_PROFILE_PIC}
                            fallbackComponent={
                              <div className="w-full h-full flex items-center justify-center bg-yellow-200">
                                <span className="text-lg font-bold text-yellow-500">
                                  {user.nombres ? user.nombres.charAt(0) : user.usuario.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            }
                          />
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
                      {canModifyUser(user) && (
                        <>
                          <button
                            //onClick={() => openModal('edit', user)}
                            //className="text-indigo-600 hover:text-indigo-900 mr-3"
                            className="text-gray mr-3"
                            disabled={true}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => openModal('delete', user)}
                            className="text-red-600 hover:text-red-900"
                            
                          >
                            {user.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Paginación */}
      {!isLoading && pagination.totalPaginas > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Mostrando {(pagination.pagina - 1) * pagination.limite + 1} - {Math.min(pagination.pagina * pagination.limite, pagination.total)} de {pagination.total} resultados
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.pagina - 1)}
              disabled={pagination.pagina === 1}
              className={`px-3 py-1 rounded ${
                pagination.pagina === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
              }`}
            >
              Anterior
            </button>
            
            {Array.from({ length: Math.min(5, pagination.totalPaginas) }, (_, i) => {
              // Lógica para mostrar 5 páginas alrededor de la página actual
              const totalPages = pagination.totalPaginas;
              const currentPage = pagination.pagina;
              
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded ${
                    pageNum === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(pagination.pagina + 1)}
              disabled={pagination.pagina === pagination.totalPaginas}
              className={`px-3 py-1 rounded ${
                pagination.pagina === pagination.totalPaginas
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
      
      {/* Modal */}
      {isModalOpen && <UserModal />}
    </div>
  );
};

export default ManageUsers;