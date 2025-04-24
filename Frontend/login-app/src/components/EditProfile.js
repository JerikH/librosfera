import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EditProfile = ({ userData, userType = 'user', onGoBack }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    usuario: '',
    email: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigo_postal: '',
    password: '',
    confirmPassword: '',
  });
  const [previewImage, setPreviewImage] = useState(null);

  // Cargar datos del usuario cuando el componente se monta
  useEffect(() => {
    if (userData) {
      setFormData({
        usuario: userData.usuario || '',
        email: userData.email || '',
        nombres: userData.nombres || '',
        apellidos: userData.apellidos || '',
        telefono: userData.telefono || '',
        direccion: userData.direccion || '',
        ciudad: userData.ciudad || '',
        provincia: userData.provincia || '',
        codigo_postal: userData.codigo_postal || '',
        password: '',
        confirmPassword: '',
      });

      if (userData.profileImage) {
        setPreviewImage(userData.profileImage);
      }
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Crear una URL para previsualizar la imagen
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Simulamos una llamada a la API para actualizar el perfil
      console.log('Datos enviados:', formData);
      
      // Simular una espera para la actualización
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Perfil actualizado con éxito');
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        if (onGoBack) {
          onGoBack();
        } else {
          navigate(userType === 'admin' ? '/AdminProfile' : '/Profile');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setErrorMessage('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          Editar Perfil
        </h1>
        
        {/* Mensajes de éxito o error */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <p>{successMessage}</p>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Columna izquierda - Foto e info */}
        <div className="w-full md:w-1/3 p-6">
          <div className="flex flex-col items-center">
            {/* Imagen de perfil */}
            <div className="relative w-40 h-40 rounded-full overflow-hidden bg-gray-200 mb-4 border-4 border-blue-500">
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                  <span className="text-6xl font-light">
                    {formData.usuario?.charAt(0)?.toUpperCase() || 'J'}
                  </span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => document.getElementById('profile-image-input').click()}
              className="bg-blue-500 text-white px-4 py-2 rounded-md mb-8"
            >
              Cambiar foto
            </button>
            <input 
              id="profile-image-input"
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
            />
            
            <div className="w-full bg-gray-100 p-4 rounded-lg">
              <div className="mb-2">
                <span className="text-gray-600 font-semibold">Tipo de usuario:</span>
                <span className="ml-2">{userType === 'admin' ? 'Administrador' : 'Cliente'}</span>
              </div>
              
              <div className="mb-2">
                <span className="text-gray-600 font-semibold">Miembro desde:</span>
                <span className="ml-2">{userData?.fecha_registro || '2025-04-23T15:19:01.890Z'}</span>
              </div>
              
              <div>
                <span className="text-gray-600 font-semibold">Última actualización:</span>
                <span className="ml-2">{userData?.ultima_actualizacion || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Columna derecha - Formulario */}
        <div className="w-full md:w-2/3 p-6">
          <form onSubmit={handleSubmit}>
            {/* Información personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-1">Nombre de usuario</label>
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Nombres</label>
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Provincia/Estado</label>
                <input
                  type="text"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 mb-1">Código Postal</label>
                <input
                  type="text"
                  name="codigo_postal"
                  value={formData.codigo_postal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            {/* Cambiar contraseña */}
            <h2 className="text-xl font-semibold mb-4">Cambiar contraseña</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-gray-700 mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Dejar en blanco para mantener la actual"
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={onGoBack}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                disabled={isLoading}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;