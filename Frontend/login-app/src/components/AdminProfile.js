import React, { useState, useEffect } from 'react';
import Sidebar from './AdminProfileComponents/Sidebar';
import Dashboard from './AdminProfileComponents/Dashboard';
import ManageBooks from './AdminProfileComponents/ManageBooks';
import ManageMessages from './AdminProfileComponents/ManageMessages';
// Importar el componente de perfil del usuario
import ProfilePage from './UserProfilePageComponents/ProfilePage';
import { useNavigate } from 'react-router-dom';

// Helper function to check if a user is admin (only administrador, not root)
const isAdmin = (userData) => {
  return userData && userData.tipo_usuario === 'administrador';
};

// Helper function to get cookie data
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const AdminProfile = () => {
  const [activeTab, setActiveTab] = useState('administrar-libro'); // Iniciar con la pestaña de Administrar Libros
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
  
  // Render loading state if no userData yet
  if (isLoading || !userData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userData={userData}
        isLoading={isLoading}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex h-full overflow-hidden">
        {activeTab === 'inicio' && <Dashboard userData={userData} />}
        {activeTab === 'administrar-libro' && <ManageBooks />}
        {activeTab === 'gestionar-mensajes' && <ManageMessages />}
        {activeTab === 'mi-perfil' && <ProfilePage userData={userData} />}
      </div>
    </div>
  );
};

export default AdminProfile;