import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";
import CreateAdminPage from "./CreateAdminPage"
import RegistrationPage from './RegistrationPage'; // Import the registration component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Bienvenido a la App</div>} />
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/CreateAdmin" element={<CreateAdminPage />} />
        <Route path="/Register" element={<RegistrationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
