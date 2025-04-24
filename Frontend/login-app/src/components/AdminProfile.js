import React, { useState, useEffect } from 'react';
import Sidebar from './AdminProfileComponents/Sidebar';
import Dashboard from './AdminProfileComponents/Dashboard';
import ManageBooks from './AdminProfileComponents/ManageBooks';
import ManageMessages from './AdminProfileComponents/ManageMessages';
import ManageUsers from './AdminProfileComponents/ManageUsers';
import ProfilePage from './UserProfilePageComponents/ProfilePage';
import EditProfile from './EditProfile';
import { useNavigate } from 'react-router-dom';

// Helper function to check if a user is admin
const isAdmin = (userData) => {
  return userData && userData.tipo_usuario === 'administrador';
};

// Helper function to get cookie data
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const AdminProfile = () => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const navigate = useNavigate();
  
  // Check authentication on mount and redirect immediately if needed
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get data directly from cookie
        const dataCookie = getCookie("data");
        
        if (!dataCookie) {
          console.log("No data cookie found, redirecting to login");
          navigate('/Login');
          return;
        }
        
        // Parse the cookie data
        const parsedData = JSON.parse(dataCookie);
        console.log("Parsed cookie data:", parsedData);
        
        if (!parsedData || !parsedData.Data) {
          console.log("Invalid data structure in cookie, redirecting to login");
          navigate('/Login');
          return;
        }
        
        // Check if user is specifically 'administrador' (not 'root')
        if (!isAdmin(parsedData.Data)) {
          console.log("User is not a standard administrator, redirecting to regular profile");
          navigate('/Profile');
          return;
        }
        
        // Set user data and stop loading
        setUserData(parsedData.Data);
        console.log("Admin data loaded from cookie:", parsedData.Data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in AdminProfile auth check:", error);
        navigate('/Login');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Handler para editar perfil
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };
  
  // Handler para regresar de la edición de perfil
  const handleGoBack = () => {
    setIsEditingProfile(false);
    // Refrescar datos del usuario (en un caso real, aquí harías una nueva solicitud)
    const refreshData = async () => {
      try {
        // Get data directly from cookie
        const dataCookie = getCookie("data");
        if (dataCookie) {
          const parsedData = JSON.parse(dataCookie);
          if (parsedData && parsedData.Data) {
            setUserData(parsedData.Data);
          }
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    };
    refreshData();
  };
  
  // Render loading state if no userData yet
  if (isLoading || !userData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f9fafb]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }
  
  // Si estamos editando el perfil, mostrar el editor
  if (isEditingProfile) {
    return (
      <div className="flex h-screen bg-[#f9fafb]">
        {/* Left sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          userData={userData}
          isLoading={isLoading}
          onEditProfile={handleEditProfile}
        />
        
        {/* Main content area */}
        <div className="flex-1 flex h-full overflow-y-auto p-6">
          <EditProfile 
            userData={userData}
            userType="admin"
            onGoBack={handleGoBack}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-[#f9fafb]">
      {/* Left sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userData={userData}
        isLoading={isLoading}
        onEditProfile={handleEditProfile}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex h-full">
        {activeTab === 'inicio' && <Dashboard userData={userData} />}
        {activeTab === 'administrar-libro' && <ManageBooks />}
        {activeTab === 'gestionar-usuarios' && <ManageUsers />}
        {activeTab === 'gestionar-mensajes' && <ManageMessages />}
        {activeTab === 'mi-perfil' && <ProfilePage userData={userData} onEditProfile={handleEditProfile} />}
      </div>
    </div>
  );
};

export default AdminProfile;