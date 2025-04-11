import axios from 'axios';

// Helper function to get cookies
export const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

// Function to verify token
export const verifyToken = async (token) => {
  try {
    const response = await axios.get('http://localhost:5000/api/v1/auth/verify-token', {
      headers: {
        'Authorization': `Bearer ${String(token)}`,
      },
    });
    return true;
  } catch (err) {
    console.error('Error verifying token:', err);
    return false;
  }
};

// Function to fetch user data from cookies
export const fetchUserData = async () => {
  try {
    // Get data from cookies
    const token = getCookie("data");
    if (!token) {
      return { success: false, error: 'No se encontró información de usuario' };
    }

    const userDataFromCookie = JSON.parse(token);
    console.log("Raw cookie data:", userDataFromCookie); // Debug cookie data
    
    // Verify token validity
    const isVerified = await verifyToken(userDataFromCookie.Data.token);
    if (!isVerified) {
      return { success: false, error: 'Su sesión ha expirado' };
    }

    // Return user data from cookie
    return { success: true, data: userDataFromCookie.Data };
  } catch (err) {
    console.error('Error fetching user data:', err);
    return { success: false, error: 'Error al cargar datos de usuario' };
  }
};

// Function to logout user
export const logoutUser = () => {
  // Clear the auth cookie
  document.cookie = "data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  
  // Redirect to login page
  window.location.href = '/Login';
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};