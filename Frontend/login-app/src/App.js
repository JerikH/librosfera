import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import CreateAdminPage from "./components/CreateAdminPage"
import RegistrationPage from './components/RegistrationPage'; // Import the registration component
import PasswordResetRequest from './components/PasswordRequestRecuperation';
import PasswordResetPage from './components/ResetPassword';
import WelcomePage from './components/Welcome'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Bienvenido a la App</div>} />
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
