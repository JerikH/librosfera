import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import CreateAdminPage from "./components/CreateAdminPage";
import RegistrationPage from './components/RegistrationPage';
import PasswordResetRequest from './components/PasswordRequestRecuperation';
import PasswordResetPage from './components/ResetPassword';
import WelcomePage from './components/Welcome';
import UserProfile from './components/UserProfile';
import AdminProfile from './components/AdminProfile';
import HomePage from './components/HomePage'; // Importar el nuevo componente HomePage

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect from / to /Login */}
        <Route path="/" element={<Navigate to="/Login" replace />} />
        
        {/* Rutas públicas/autenticación */}
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/CreateAdmin" element={<CreateAdminPage />} />
        <Route path="/Register" element={<RegistrationPage />} />
        <Route path="/RequestChangePassword" element={<PasswordResetRequest />} />
        <Route path="/reset-password/:token" element={<PasswordResetPage />} />
        
        {/* Ruta para la página de bienvenida (legacy) */}
        <Route path="/Welcome" element={<WelcomePage />} />
        
        {/* Nueva ruta para la página principal (después de iniciar sesión) */}
        <Route path="/Home" element={<HomePage />} />
        
        {/* Rutas de perfil de usuario y administrador */}
        <Route path="/Profile" element={<UserProfile />} />
        <Route path="/AdminProfile" element={<AdminProfile />} />
      </Routes>
    </Router>
  );
};

export default App;