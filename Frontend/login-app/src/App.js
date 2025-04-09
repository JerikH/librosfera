import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import CreateAdminPage from "./components/CreateAdminPage";
import RegistrationPage from './components/RegistrationPage'; // Import the registration component
import PasswordResetRequest from './components/PasswordRequestRecuperation';
import PasswordResetPage from './components/ResetPassword';
import WelcomePage from './components/Welcome';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect from / to /Login */}
        <Route path="/" element={<Navigate to="/Login" replace />} />
        
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/CreateAdmin" element={<CreateAdminPage />} />
        <Route path="/Register" element={<RegistrationPage />} />
        <Route path="/RequestChangePassword" element={<PasswordResetRequest />} />
        <Route path="/reset-password/:token" element={<PasswordResetPage />} />
        <Route path="/Welcome" element={<WelcomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
