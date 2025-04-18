import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const onBackToLogin = () => {
    navigate('/Login');
  };

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const PrintCookies = () => {
    // console.log(getCookie("authToken")); // Output: your_jwt_token
    const rawData = getCookie("data");
    if (rawData) {
      try {
        const parsedData = JSON.parse(rawData);
        console.log(parsedData); // Correct JSON object
        console.log(parsedData.Data.usuario);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    } else {
      console.log("Cookie not found!");
    }
  };

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    DNI: '',
    genero: '',
    usuario: '',
    password: '',
    fecha_nacimiento: '',
    lugar_nacimiento: '',
    // Address fields
    calle: '',
    ciudad: '',
    codigo_postal: '',
    pais: '',
    estado_provincia: '',
    referencias: ''
  });

  // State to track selected preferences
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [showPreferencesList, setShowPreferencesList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Countries autocomplete states
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [showCountriesList, setShowCountriesList] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const countryInputRef = useRef(null);

  // Sample preferences list
  const availablePreferences = ['Ficción', 'No Ficción', 'Ciencia Ficción', 'Fantasía', 'Romance', 'Biografía', 'Historia', 'Ciencia', 'Filosofía', 'Arte', 'Tecnología'];

  const genderOptions = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];

  // Fetch countries from API
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        // Using REST Countries API to get the list of countries with Spanish translations
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,translations');
        
        // Extract Spanish translations or fall back to common name
        const countryData = response.data.map(country => {
          // Use Spanish translation if available, otherwise use common name
          return (country.translations.spa && country.translations.spa.common) || country.name.common;
        }).sort();
        
        setCountries(countryData);
      } catch (err) {
        console.error('Error fetching countries:', err);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Click outside handler to close country list when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryInputRef.current && !countryInputRef.current.contains(event.target)) {
        setShowCountriesList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Filter countries when typing in the pais field
    if (name === 'pais') {
      // Case insensitive search with Spanish accents support
      const normalizedValue = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const filtered = countries.filter(country => {
        const normalizedCountry = country.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalizedCountry.startsWith(normalizedValue);
      });
      
      setFilteredCountries(filtered);
      setShowCountriesList(value.length > 0);
    }
  };

  // Select a country from the dropdown
  const selectCountry = (country) => {
    setFormData({
      ...formData,
      pais: country
    });
    setShowCountriesList(false);
  };

  // Toggle selection of a preference
  const togglePreference = (preference) => {
    if (selectedPreferences.includes(preference)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== preference));
    } else {
      setSelectedPreferences([...selectedPreferences, preference]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setSuccess('');
    
    // Basic validation
    if (!formData.nombres || !formData.apellidos || !formData.email || 
        !formData.usuario || !formData.password || !formData.DNI ||
        !formData.calle || !formData.ciudad || !formData.codigo_postal || !formData.pais) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    
    // Format the data for the API
    const userData = {
      usuario: formData.usuario,
      email: formData.email,
      password: formData.password,
      tipo_usuario: 'cliente', // Default for registration
      DNI: formData.DNI,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      fecha_nacimiento: formData.fecha_nacimiento,
      lugar_nacimiento: formData.lugar_nacimiento,
      genero: formData.genero,
      direcciones: [{
        calle: formData.calle,
        ciudad: formData.ciudad,
        codigo_postal: formData.codigo_postal,
        pais: formData.pais,
        estado_provincia: formData.estado_provincia || '',
        referencias: formData.referencias || ''
      }],
      preferencias: {
        temas: selectedPreferences
      }
    };

    if (userData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    
    try {
      setIsLoading(true);
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      // Make POST request to register API
      const response = await axios.post('http://localhost:5000/api/v1/users/register', userData, config);
      console.log("response");
      console.log(response);
      
      // Handle successful registration
      console.log('Registration successful:', response.data);
      setSuccess('¡Registro exitoso! Redirigiendo...');
      
      // Store user data in localStorage
      localStorage.setItem('userToken', response.data.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.data));
      
      // Redirect to login after a short delay
      setTimeout(() => {
        onBackToLogin();
      }, 2500);
      
    } catch (err) {
      console.error('Registration error:', err);
      console.log(err);
      
      // Handle specific error messages based on API response
      if (err.response) {
        if (err.response.data) {
          // Check for specific error types and display appropriate messages
          if (err.response.data.message && err.response.data.message.includes('')) {
            setError(err.response.data.message);
          } else if (err.response.data.message && err.response.data.message.includes('usuario')) {
            setError('Este nombre de usuario ya está en uso. Por favor elija otro.');
          } else if (err.response.data.message && err.response.data.message.includes('DNI')) {
            setError('Este número de documento ya está registrado. Por favor verifique sus datos.');
          } else if (err.response.data.message && err.response.data.message.includes('email')) {
            setError('Este correo electrónico ya está registrado. Por favor use otro.');
          } else {
            // Use the server's error message if available
            setError(err.response.data.message || 'Error al registrarse. Por favor intente nuevamente.');
          }
        } else {
          setError('Error al registrarse. Por favor intente nuevamente.');
        }
      } else {
        setError('Error al conectar con el servidor. Por favor verifique su conexión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Registrarse</h1>
      
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Nombre */}
        <div>
          <label className="block font-medium mb-1">Nombre</label>
          <input 
            type="text" 
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
            placeholder="Escribe tu nombre" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Apellido */}
        <div>
          <label className="block font-medium mb-1">Apellido</label>
          <input 
            type="text" 
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            placeholder="Escribe tu apellido" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Correo */}
        <div>
          <label className="block font-medium mb-1">Correo</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Escribe tu correo" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* ID */}
        <div>
          <label className="block font-medium mb-1">ID</label>
          <input 
            type="text" 
            name="DNI" 
            value={formData.DNI}
            onChange={handleChange}
            placeholder="Número de documento" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Dirección */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Dirección</h3>
          
          {/* Calle */}
          <div>
            <label className="block font-medium mb-1">Calle *</label>
            <input 
              type="text"
              name="calle"
              value={formData.calle}
              onChange={handleChange} 
              placeholder="Calle y número" 
              className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
              required
            />
          </div>
          
          {/* Ciudad */}
          <div>
            <label className="block font-medium mb-1">Ciudad *</label>
            <input 
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange} 
              placeholder="Ciudad" 
              className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
              required
            />
          </div>
          
          {/* Código Postal */}
          <div>
            <label className="block font-medium mb-1">Código Postal *</label>
            <input 
              type="text"
              name="codigo_postal"
              value={formData.codigo_postal}
              onChange={handleChange} 
              placeholder="Código postal" 
              className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
              required
            />
          </div>
          
          {/* País with Autocomplete in Spanish */}
          <div ref={countryInputRef} className="relative">
            <label className="block font-medium mb-1">País *</label>
            <div className="relative">
              <input 
                type="text"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                onFocus={() => formData.pais.length > 0 && setShowCountriesList(true)}
                placeholder="País" 
                className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
                required
              />
              {isLoadingCountries && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            
            {/* Countries Dropdown in Spanish */}
            {showCountriesList && filteredCountries.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredCountries.map(country => (
                  <div 
                    key={country}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => selectCountry(country)}
                  >
                    {country}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Estado/Provincia (opcional) */}
          <div>
            <label className="block font-medium mb-1">Estado/Provincia</label>
            <input 
              type="text"
              name="estado_provincia"
              value={formData.estado_provincia}
              onChange={handleChange} 
              placeholder="Estado o provincia (opcional)" 
              className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
            />
          </div>
          
          {/* Referencias (opcional) */}
          <div>
            <label className="block font-medium mb-1">Referencias</label>
            <input 
              type="text"
              name="referencias"
              value={formData.referencias}
              onChange={handleChange} 
              placeholder="Referencias adicionales (opcional)" 
              className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
            />
          </div>
        </div>
        
        {/* Género */}
        <div className="relative">
        <label className="block font-medium mb-1">Género</label>
          <select
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0 bg-white"
          >
            <option value="">Selecciona tu género</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
            <option value="Prefiero no decir">Prefiero no decir</option>
          </select>
        </div>
        
        {/* Usuario */}
        <div>
          <label className="block font-medium mb-1">Usuario</label>
          <input 
            type="text" 
            name="usuario"
            value={formData.usuario}
            onChange={handleChange} 
            placeholder="Escribe su usuario" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Contraseña */}
        <div>
          <label className="block font-medium mb-1">Contraseña</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange} 
            placeholder="Escribe su contraseña" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Preferencias - Multi-Select */}
        <div className="relative">
          <label className="block font-medium mb-1">Preferencias</label>
          <div 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 flex justify-between items-center cursor-pointer"
            onClick={() => setShowPreferencesList(!showPreferencesList)}
          >
            <div className="truncate">
              {selectedPreferences.length > 0 
                ? selectedPreferences.join(', ') 
                : "Selecciona preferencias"}
            </div>
            <div className="text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
          
          {/* Dropdown Selection */}
          {showPreferencesList && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {availablePreferences.map((preference) => (
                <div 
                  key={preference}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => togglePreference(preference)}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedPreferences.includes(preference)}
                    onChange={() => {}}
                    className="mr-2"
                  />
                  {preference}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Fecha de Nacimiento */}
        <div>
          <label className="block font-medium mb-1">Fecha de Nacimiento</label>
          <div className="relative">
            <input 
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
              className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
            />
            <button 
              type="button"
              onClick={() => {
                // This creates a click on the date input to open the native date picker
                document.querySelector('input[name="fecha_nacimiento"]').showPicker();
              }}
              className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Lugar de Nacimiento */}
        <div>
          <label className="block font-medium mb-1">Lugar de Nacimiento</label>
          <input 
            type="text" 
            name="lugar_nacimiento"
            value={formData.lugar_nacimiento}
            onChange={handleChange} 
            placeholder="Lugar de nacimiento" 
            className="w-full p-2 border-t-0 border-l-0 border-r-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-0"
          />
        </div>
        
        {/* Show error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Show success message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        
        {/* Submit Buttons */}
        <div className="mt-4 flex flex-col gap-2">
          <button 
            type="submit" 
            className={`w-full bg-blue-500 text-white py-3 rounded font-medium hover:bg-blue-600 transition-colors ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : 'Registrarse'}
          </button>
          
          <button 
            type="button" 
            className="w-full text-blue-500 py-2 rounded font-medium hover:underline"
            onClick={onBackToLogin}
          >
            Iniciar sesión
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationPage;