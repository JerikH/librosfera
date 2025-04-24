import React, { useState, useEffect } from 'react';
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
  
  // Check authentication on mount and redirect immediately if needed
  useEffect(() => {
    // Check if the token exists in cookies
    const token = document.cookie.match(new RegExp('(^| )data=([^;]+)'));
    
    // Redirect immediately if no token found
    if (!token) {
      window.location.replace('/Login');
      return;
    }
    
    // We have a token, now fetch the user data
    const getUserData = async () => {
      try {
        const result = await fetchUserData();
        
        // If user data fetch fails, redirect to login
        if (!result.success) {
          window.location.replace('/Login');
          return;
        }
        
        // We have valid data, set it and stop loading
        setUserData(result.data);
        console.log("User data loaded:", result.data); // Debug user data
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading user data:", error);
        window.location.replace('/Login');
      }
    };
    
    getUserData();
  }, []);
  
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
  
  // Render content only if we have userData
  // If not, nothing is rendered while the redirect happens
  if (!userData) {
    return null;
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
            userType="user"
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
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700">Cargando información...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'home' && <Dashboard userData={userData} onEditProfile={handleEditProfile} />}
            {activeTab === 'profile' && <ProfilePage userData={userData} onEditProfile={handleEditProfile} />}
            {activeTab === 'compras' && <PurchasesPage />}
            {activeTab === 'carrito' && <CartPage />}
            {activeTab === 'tarjeta' && <CardPage />}
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;