import React, { useState } from 'react';
import { href, useNavigate } from 'react-router-dom';
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import axios from 'axios';

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

// const PrintCookies = () => {
//   // console.log(getCookie("authToken")); // Output: your_jwt_token
//   const rawData = getCookie("data");
//   if (rawData) {
//       try {
//           const parsedData = JSON.parse(rawData);
//           console.log(parsedData); // Correct JSON object
//           console.log(parsedData.Data.usuario);
//       } catch (error) {
//           console.error("Error parsing JSON:", error);
//       }
//   } else {
//       console.log("Cookie not found!");
//   }
// };


const verifyToken = async (token) => {
  try {
    const response = await axios.get('http://localhost:5000/api/v1/auth/verify-token', {
      headers: {
        'Authorization': `Bearer ${String(token)}`,
      },
    });

    // If request is successful, return true
    console.log(response);
    if(response.status === 200){
      console.log(response.data.user.tipo_usuario);
      console.log(response.data.user.tipo_usuario == "root");
      return response.data.user.tipo_usuario == "root";
    }
    return false;
  } catch (err) {
    // If there is an error, return false
    // setError(err.response ? err.response.data : 'Error verifying token');
    return false;
  }
};



const CreateAdminPage = () => {
  const navigate = useNavigate();
  const rawData = getCookie("data");


  const [tokenG, setTokenG] = useState(null);
  const [formData, setFormData] = useState({
      email: '',
      password: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Function executed before component renders!");
      
      if (!rawData) {
        console.log("Nope, redirecting...");
        navigate("/Login", { replace: true });
        return;
      }
      
      try {
        const parsedData = JSON.parse(rawData);
        console.log("verify response:");
        
        // Use await here to get the actual boolean result
        const isVerified = await verifyToken(parsedData.Data.token);
        
        if (!isVerified) {
          console.log("Nope, redirecting...");
          navigate("/Login", { replace: true });
          return;
        }
        
        setTokenG(parsedData.Data.token);
      } catch (error) {
        console.error("Error parsing data:", error);
        navigate("/Login", { replace: true });
      }
    };
    
    // Call the async function
    checkAuth();
  }, [rawData, navigate]);

  if (!rawData) {
      return null; // ✅ Prevent further execution
  }

  const { email, password } = formData;


  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    //console.log(tokenG);
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      //console.log(formData);
      // Make POST request to backend API
      const response = await axios.post(
        "http://localhost:5000/api/v1/users/admin",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${String(tokenG)}`,
          },
        }
      );


      // Print the response
      console.log('Response received:', response.data);
      
      // Clear form
      setFormData({
        email: '',
        password: ''
      });
      
      // Reload the page to show the new item
      // In a production app, you would use state management instead
      //window.location.reload();
    } catch (err) {
      console.error('Error adding item:', err.response.data);
    }
  }; 
  return (
    <div className="w-full min-h-screen p-6">
      <div className="max-w-md mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 mb-4">
            <img 
              src="/l2.png" 
              alt="Librosfera Logo" 
              className="w-full h-auto"
            />
          </div>
          <h1 className="text-2xl font-bold">Crear Administrador</h1>
        </div>
        
        <form className="space-y-6" onSubmit={onSubmit}>
          {/* Email Field with Label */}
          <div className="flex items-center">
            <label className="w-36 text-right pr-4">Correo electrónico</label>
            <input 
              type="email"
              defaultValue="jdavidt99@gmail.com"
              className="flex-1 p-2 border border-gray-300 rounded"
              name="email"
              id="email"
              value={email}
              onChange={onChange}
            />
          </div>
          
          {/* Password Field with Label */}
          <div className="flex items-center">
            <label className="w-36 text-right pr-4">Contraseña</label>
            <input 
              type="password"
              defaultValue="dxv896@"
              className="flex-1 p-2 border border-gray-300 rounded"
              name="password"
              id="password"
              value={password}
              onChange={onChange}
            />
          </div>
          
          {/* Buttons - Crear and Cancelar */}
          <div className="flex justify-center gap-4 mt-8">
          <button 
              type="submit" 
              className="bg-blue-500 text-white py-2 px-16 rounded font-medium hover:bg-blue-600 transition-colors"
            >
              Crear
            </button>
            <button 
              type="button" 
              //onClick={}
              className="bg-gray-200 text-gray-800 py-2 px-16 rounded font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
      
      {/* Footer Search Bar (decorative) 
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex w-full max-w-xl">
        <div className="w-full flex items-center">
          <div className="border border-gray-300 rounded-lg flex items-center w-full">
            <span className="text-gray-400 pl-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <div className="w-full opacity-0">Search bar placeholder</div>
          </div>
        </div>
      </div>*/}
    </div>
  );
};

export default CreateAdminPage;