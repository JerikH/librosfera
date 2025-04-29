import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './UserProfilePageComponents/Sidebar';
import Dashboard from './UserProfilePageComponents/Dashboard';
import ProfilePage from './UserProfilePageComponents/ProfilePage';
import PurchasesPage from './UserProfilePageComponents/PurchasesPage';
import CartPage from './UserProfilePageComponents/CartPage';
import CardPage from './UserProfilePageComponents/CardPage';
import EditProfile from './EditProfile';
import { fetchUserData, logoutUser } from './UserProfilePageComponents/authUtils';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  
  // Helper function to get cookie data
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // Check authentication and user type immediately on mount
  useEffect(() => {
    const checkUserTypeAndRedirect = async () => {
      // Check if the token exists in cookies
      const dataCookie = getCookie("data");
      
      // Redirect immediately if no token found
      if (!dataCookie) {
        console.log("No data cookie found, redirecting to login");
        window.location.replace('/Login');
        return;
      }
      
      try {
        // First try to parse data directly from cookie to avoid unnecessary API calls
        const parsedData = JSON.parse(dataCookie);
        console.log("Parsed cookie data in UserProfile:", parsedData);
        
        if (!parsedData || !parsedData.Data) {
          console.log("Invalid data structure in cookie, redirecting to login");
          navigate('/Login');
          return;
        }
        
        // Check user type and redirect immediately if needed
        if (parsedData.Data && parsedData.Data.tipo_usuario) {
          const userType = parsedData.Data.tipo_usuario.toLowerCase();
          
          if (userType === 'administrador') {
            console.log("Admin user detected, redirecting to AdminProfile");
            window.location.replace('/AdminProfile');
            return;
          } else if (userType === 'root') {
            console.log("Root user detected, redirecting to RootProfile");
            window.location.replace('/RootProfile');
            return;
          } else if (userType !== 'usuario' && userType !== 'cliente') {
            console.log("Unknown user type, redirecting to login");
            window.location.replace('/Login');
            return;
          }
        }
        
        // We have valid data for a regular user, set it and stop loading
        console.log("Regular user confirmed, loading profile");
        setUserData(parsedData.Data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking user type:", error);
        window.location.replace('/Login');
      }
    };
    
    checkUserTypeAndRedirect();
  }, [navigate]);
  
  // Fetch user data when active tab changes
  useEffect(() => {
    if (!isLoading && !isEditingProfile) { // Only refresh data if initial load is complete
      const refreshData = async () => {
        const result = await fetchUserData();
        
        if (result.success) {
          setUserData(result.data);
        } else {
          // Token is no longer valid, redirect
          window.location.replace('/Login');
        }
      };
      
      refreshData();
    }
  }, [activeTab, isLoading, isEditingProfile]);
  
  // Handler para editar perfil
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };
  
  // Handler para regresar de la edición de perfil
  const handleGoBack = () => {
    setIsEditingProfile(false);
    // Refrescar datos del usuario
    const refreshData = async () => {
      const result = await fetchUserData();
      if (result.success) {
        setUserData(result.data);
      }
    };
    refreshData();
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    // Limpiar las cookies
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/");
    });
    
    // Redireccionar a la página de login
    navigate('/login');
  };

  // Función para ir al perfil de usuario
  const goToProfile = () => {
    navigate('/Profile');
  };
  
  // Render nothing until we confirm this is a regular user
  if (isLoading || !userData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Verificando información de usuario...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header from UserLayout */}
      <header className="bg-white shadow-sm w-full">
        {/* Top navigation bar */}
        <div className="bg-gray-800 text-white">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/home" className="font-bold text-xl">Librosfera</Link>
              <span className="text-sm">Tu librería de confianza</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={goToProfile}
                className="text-sm hover:underline cursor-pointer"
              >
                Mi Cuenta
              </button>
              <Link to="/mis-pedidos" className="text-sm hover:underline">Mis Pedidos</Link>
              <button 
                onClick={handleLogout}
                className="text-sm hover:underline cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
    
      </header>

      {/* Rest of the UserProfile component */}
      <div className="flex flex-1 bg-[#f9fafb]">
        {/* Left sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          userData={userData}
          isLoading={isLoading}
          onEditProfile={handleEditProfile}
        />
        
        {/* Main content area */}
        <div className="flex-1">
          {isEditingProfile ? (
            <div className="h-full overflow-y-auto p-6">
              <EditProfile 
                userData={userData}
                userType="user"
                onGoBack={handleGoBack}
              />
            </div>
          ) : (
            <div className="h-full">
              {activeTab === 'home' && <Dashboard userData={userData} onEditProfile={handleEditProfile} />}
              {activeTab === 'profile' && <ProfilePage userData={userData} onEditProfile={handleEditProfile} />}
              {activeTab === 'compras' && <PurchasesPage />}
              {activeTab === 'carrito' && <CartPage />}
              {activeTab === 'tarjeta' && <CardPage />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;