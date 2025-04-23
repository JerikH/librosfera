import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Componente de layout para usuarios normales (no administradores)
const UserLayout = ({ children }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(0); // Esto debería venir de un estado global o contexto
  
  // Función para manejar la búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Redireccionar a la página de resultados de búsqueda con el término como parámetro
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    // Limpiar las cookies
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/");
    });
    
    // Redireccionar a la página de login
    navigate('/login');
  };

  // Función para ir al perfil de usuario
  const goToProfile = () => {
    navigate('/Profile');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        {/* Top navigation bar */}
        <div className="bg-gray-800 text-white">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/home" className="font-bold text-xl">Librosfera</Link>
              <span className="text-sm">Tu librería de confianza</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={goToProfile}
                className="text-sm hover:underline cursor-pointer"
              >
                Mi Cuenta
              </button>
              <Link to="/mis-pedidos" className="text-sm hover:underline">Mis Pedidos</Link>
              <button 
                onClick={handleLogout}
                className="text-sm hover:underline cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and cart bar */}
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6 w-full">
            <Link to="/home" className="hidden md:block">
              <img 
                src="/l2.png" 
                alt="Librosfera Logo" 
                className="h-12"
              />
            </Link>
            <form onSubmit={handleSearch} className="flex-1 flex">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Buscar por título, autor, ISBN..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button 
                  type="submit"
                  className="absolute right-2 top-1 bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>
          
          <div className="ml-6">
            <Link to="/carrito" className="relative inline-block p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        
        {/* Navigation links - modificados para estar distribuidos uniformemente */}
        <nav className="bg-gray-100">
          <div className="container mx-auto">
            <ul className="flex justify-between items-center px-4 py-3 text-sm">
              <li className="px-4">
                <Link to="/novedades" className="text-gray-700 hover:text-blue-600 whitespace-nowrap font-medium">
                  Novedades
                </Link>
              </li>
              <li className="px-4">
                <Link to="/mas-vendidos" className="text-gray-700 hover:text-blue-600 whitespace-nowrap font-medium">
                  Más Vendidos
                </Link>
              </li>
              <li className="px-4">
                <Link to="/recomendados" className="text-gray-700 hover:text-blue-600 whitespace-nowrap font-medium">
                  Recomendados
                </Link>
              </li>
              <li className="px-4">
                <Link to="/ofertas" className="text-gray-700 hover:text-blue-600 whitespace-nowrap font-medium">
                  Ofertas
                </Link>
              </li>
              <li className="px-4">
                <Link to="/preventas" className="text-gray-700 hover:text-blue-600 whitespace-nowrap font-medium">
                  Preventas
                </Link>
              </li>
              <li className="px-4">
                <Link to="/libros-digitales" className="text-gray-700 hover:text-blue-600 whitespace-nowrap font-medium">
                  Libros Digitales
                </Link>
              </li>
              <li className="px-4">
                <Link to="/audiolibros" className="text-gray-700 hover:text-blue-600 whitespace-nowrap font-medium">
                  Audiolibros
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      
      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Sobre Librosfera</h3>
              <ul className="space-y-2">
                <li><Link to="/quienes-somos" className="text-gray-300 hover:text-white">Quiénes Somos</Link></li>
                <li><Link to="/contacto" className="text-gray-300 hover:text-white">Contacto</Link></li>
                <li><Link to="/trabaja-con-nosotros" className="text-gray-300 hover:text-white">Trabaja con Nosotros</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Ayuda</h3>
              <ul className="space-y-2">
                <li><Link to="/preguntas-frecuentes" className="text-gray-300 hover:text-white">Preguntas Frecuentes</Link></li>
                <li><Link to="/como-comprar" className="text-gray-300 hover:text-white">Cómo Comprar</Link></li>
                <li><Link to="/metodos-de-pago" className="text-gray-300 hover:text-white">Métodos de Pago</Link></li>
                <li><Link to="/envios" className="text-gray-300 hover:text-white">Envíos</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Mi Cuenta</h3>
              <ul className="space-y-2">
                <li><Link to="/Profile" className="text-gray-300 hover:text-white">Iniciar Sesión</Link></li>
                <li><Link to="/mis-pedidos" className="text-gray-300 hover:text-white">Mis Pedidos</Link></li>
                <li><Link to="/lista-de-deseos" className="text-gray-300 hover:text-white">Lista de Deseos</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Síguenos</h3>
              <div className="flex space-x-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Suscríbete a nuestro boletín</h4>
                <form className="flex">
                  <input
                    type="email"
                    placeholder="Tu correo electrónico"
                    className="px-3 py-2 w-full text-gray-800 rounded-l focus:outline-none"
                  />
                  <button 
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
                  >
                    Enviar
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-600 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Librosfera. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserLayout;