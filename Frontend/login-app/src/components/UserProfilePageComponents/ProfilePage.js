import React, { useState } from 'react';
import { formatDate } from './authUtils';
import { useNavigate } from 'react-router-dom';
import CachedImage from '../CachedImage';
import EditProfile from '../EditProfile';

const ProfilePage = ({ userData }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  // Get primary address if available
  const primaryAddress = userData?.direcciones && userData.direcciones.length > 0 
    ? userData.direcciones[0]
    : null;
    
  // Handle logout click
  const handleLogout = () => {
    localStorage.removeItem('shoppingCart');
    document.cookie = "data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/Login';
  };

  // Define profile image base URL - same as in EditProfile
  const PROFILE_PIC_BASE_URL = '';
  const DEFAULT_PROFILE_PIC = 'http://localhost:5000/uploads/profiles/default.jpg';

  // Get profile image URL
  const profileImage = userData?.foto_perfil 
    ? `${PROFILE_PIC_BASE_URL}${userData.foto_perfil}`
    : `${PROFILE_PIC_BASE_URL}${DEFAULT_PROFILE_PIC}`;

  // Handle edit profile button click
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  // Handle go back from edit profile
  const handleGoBack = () => {
    setIsEditing(false);
  };

  // If in editing mode, show the EditProfile component
  if (isEditing) {
    return <EditProfile userData={userData} userType={userData?.tipo_usuario} onGoBack={handleGoBack} />;
  }

  return (
    <div className="w-full flex flex-col h-full bg-gray-50 overflow-y-auto p-6">
      <div className="flex flex-col min-h-full">
        <h2 className="text-3xl font-bold mb-8">Mi Perfil</h2>
        
        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Image - updated to use CachedImage like in EditProfile */}
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-blue-500">
              <CachedImage 
                src={profileImage} 
                alt="Perfil" 
                className="w-full h-full object-cover"
                fallbackSrc={`${PROFILE_PIC_BASE_URL}${DEFAULT_PROFILE_PIC}`}
              />
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{userData?.nombres} {userData?.apellidos}</h3>
              <p className="text-gray-600 mb-1">{userData?.email}</p>
              <p className="text-gray-500 text-sm mb-4">@{userData?.usuario}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-500 text-sm">ID Cliente</p>
                  <p className="font-medium">{userData?.id_cliente || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Miembro desde</p>
                  <p className="font-medium">{formatDate(userData?.fecha_registro)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Tipo de cuenta</p>
                  <p className="font-medium capitalize">{userData?.tipo_usuario || 'Usuario'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">DNI</p>
                  <p className="font-medium">{userData?.DNI || 'No especificado'}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  className="bg-blue-500 text-white py-2 px-6 rounded font-medium hover:bg-blue-600 transition-colors"
                  onClick={handleEditProfile}
                >
                  Editar Perfil
                </button>
                
                {userData?.tipo_usuario === "root" && (
                  <button 
                    onClick={() => window.location.href = '/CreateAdmin'}
                    className="bg-purple-600 text-white py-2 px-6 rounded font-medium hover:bg-purple-700 transition-colors"
                  >
                    Crear Administrador
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* User Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-xl font-semibold mb-4">Información Personal</h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Nombre Completo</p>
                <p className="font-medium">{userData?.nombres || 'N/A'} {userData?.apellidos || ''}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Correo Electrónico</p>
                <p className="font-medium">{userData?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Fecha de Nacimiento</p>
                <p className="font-medium">{formatDate(userData?.fecha_nacimiento)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Lugar de Nacimiento</p>
                <p className="font-medium">{userData?.lugar_nacimiento || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Género</p>
                <p className="font-medium">{userData?.genero || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Dirección</p>
                <p className="font-medium">
                  {primaryAddress ? (
                    <>
                      {primaryAddress.calle}, {primaryAddress.ciudad}, {primaryAddress.pais}
                    </>
                  ) : 'No especificada'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Account Settings and Preferences */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-xl font-semibold mb-4">Preferencias</h4>
            
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-2">Temas de Interés</p>
              <div className="flex flex-wrap gap-2">
                {userData?.preferencias?.temas && userData.preferencias.temas.length > 0 ? (
                  userData.preferencias.temas.map((tema, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {tema}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No hay temas seleccionados</p>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-2">Autores Favoritos</p>
              {userData?.preferencias?.autores && userData.preferencias.autores.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userData.preferencias.autores.map((autor, index) => (
                    <span 
                      key={index} 
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                    >
                      {autor}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay autores favoritos seleccionados</p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recibir Noticias</p>
                  <p className="text-gray-500 text-sm">Suscripción al boletín</p>
                </div>
                <div className="relative">
                  <div className={`w-11 h-6 rounded-full transition-colors duration-300 ease-in-out ${userData?.suscrito_noticias ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 ease-in-out ${userData?.suscrito_noticias ? 'transform translate-x-5' : ''}`}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cambiar Contraseña</p>
                  <p className="text-gray-500 text-sm">Actualiza tu contraseña de acceso</p>
                </div>
                <button 
                  className="text-blue-500 hover:underline"
                  onClick={handleEditProfile}
                >
                  Cambiar
                </button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-600">Cerrar Sesión</p>
                  <p className="text-gray-500 text-sm">Salir de tu cuenta</p>
                </div>
                <button 
                  className="text-red-600 hover:underline"
                  onClick={handleLogout}
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;