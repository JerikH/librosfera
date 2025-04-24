import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import axios from 'axios';
import CachedImage from './CachedImage';

// URL base para las llamadas a la API
const API_BASE_URL = 'http://localhost:5000/api/v1';

const SearchResults = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchId, setSearchId] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extraer el término de búsqueda de los parámetros de la URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('q') || '';
    setSearchTerm(query);
    
    // Realizar búsqueda con el término extraído
    searchBooks(query);
  }, [location.search]);
  
  // Función para buscar libros usando la API
  const searchBooks = async (query) => {
    setIsLoading(true);
    
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    
    try {
      // Usar el endpoint de búsqueda Atlas Search de la API
      const response = await axios.get(`${API_BASE_URL}/libros/buscar`, {
        params: {
          q: query,
          limit: 20,
          solo_disponibles: true
        }
      });
      
      if (response.data.status === 'success') {
        setSearchResults(response.data.data);
        // Guardar el ID de búsqueda para registrar interacciones
        if (response.data.id_busqueda) {
          setSearchId(response.data.id_busqueda);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error al buscar libros:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para registrar la interacción cuando un usuario hace clic en un libro
  const registerInteraction = async (bookId) => {
    // Solo registrar si tenemos un ID de búsqueda
    if (searchId && bookId) {
      try {
        await axios.post(`${API_BASE_URL}/libros/buscar/${searchId}/interaccion/${bookId}`);
      } catch (error) {
        console.error('Error al registrar interacción:', error);
      }
    }
  };
  
  // Función para ir a los detalles del libro
  const goToBookDetails = (bookId) => {
    // Registrar la interacción
    registerInteraction(bookId);
    // Navegar a la página de detalles
    navigate(`/libros/${bookId}`);
  };
  
  // Función para renderizar estrellas de calificación
  const renderStars = (rating) => {
    const calculatedRating = rating || 0;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`text-lg ${i < calculatedRating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <UserLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {searchTerm ? `Resultados de búsqueda para: "${searchTerm}"` : 'Resultados de búsqueda'}
          </h1>
          <p className="text-gray-600">
            {searchResults.length} {searchResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700">Buscando libros...</p>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No se encontraron libros</h2>
            <p className="text-gray-600 mb-4">
              No hay libros disponibles que coincidan con tu búsqueda.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Lista vertical de resultados */}
            <div className="divide-y divide-gray-200">
              {searchResults.map(book => {
                // Calcular si tiene descuento y el porcentaje
                const precioBase = book.precio_info?.precio_base || book.precio;
                const tieneDescuento = book.precio_info?.descuentos?.some(d => d.activo);
                const porcentajeDescuento = tieneDescuento 
                  ? book.precio_info.descuentos.find(d => d.activo && d.tipo === 'porcentaje')?.valor || 0 
                  : 0;
                
                // Formatear el stock
                const stockDisponible = book.stock || 0;
                
                return (
                  <div key={book._id} className="p-4 hover:bg-gray-50 flex flex-col md:flex-row">
                    {/* Imagen del libro - Ahora clicable */}
                    <div 
                      className="md:w-1/6 flex items-center justify-center mb-4 md:mb-0 cursor-pointer"
                      onClick={() => goToBookDetails(book._id)}
                    >
                      {book.imagenes && book.imagenes.length > 0 ? (
                        <CachedImage 
                          src={book.imagenes[0].url} 
                          alt={book.imagenes[0].alt_text || book.titulo}
                          className="h-40 object-contain hover:opacity-90 transition-opacity" 
                          fallbackSrc="/placeholder-book.png"
                          onClick={() => goToBookDetails(book._id)}
                        />
                      ) : (
                        <div className="w-32 h-40 bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <span className="material-icons-outlined text-5xl text-gray-400">menu_book</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Información del libro */}
                    <div className="md:w-4/6 md:px-6">
                      {/* Título clicable */}
                      <h2 
                        className="text-xl font-bold text-gray-800 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => goToBookDetails(book._id)}
                      >
                        {book.titulo}
                      </h2>
                      <p className="text-gray-600 mb-2">por {book.autor_nombre_completo}</p>
                      
                      {/* Estrellas de calificación */}
                      {book.calificaciones && (
                        <div className="flex items-center mb-2">
                          {renderStars(book.calificaciones.promedio)}
                          {book.calificaciones.cantidad > 0 && (
                            <span className="text-sm text-gray-500 ml-2">({book.calificaciones.cantidad})</span>
                          )}
                        </div>
                      )}
                      
                      {/* Editorial e información de edición */}
                      {book.editorial && (
                        <p className="text-sm text-gray-500 mb-2">
                          {book.editorial}, {book.estado === 'nuevo' ? 'Nuevo' : 'Usado'}
                          {book.anio_publicacion ? `, ${book.anio_publicacion}` : ''}
                        </p>
                      )}
                      
                      {/* Descripción */}
                      {book.descripcion && (
                        <p className="text-gray-700 mb-2 line-clamp-2">{book.descripcion}</p>
                      )}
                      
                      {/* Disponibilidad */}
                      <p className={`text-sm ${stockDisponible > 0 ? 'text-green-600' : 'text-red-600'} mt-2`}>
                        {stockDisponible > 0 
                          ? `${stockDisponible} ${stockDisponible === 1 ? 'unidad disponible' : 'unidades disponibles'}`
                          : 'Agotado'}
                      </p>
                    </div>
                    
                    {/* Precio y botones de acción */}
                    <div className="md:w-1/6 flex flex-col items-center justify-center mt-4 md:mt-0">
                      {/* Precio */}
                      <div className="mb-3 text-center">
                        {tieneDescuento ? (
                          <>
                            <div className="text-sm line-through text-gray-500">
                              ${precioBase.toLocaleString('es-CO')}
                            </div>
                            <div className="text-xl font-bold text-red-600">
                              ${book.precio.toLocaleString('es-CO')}
                            </div>
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded mt-1">
                              {porcentajeDescuento}% DCTO
                            </div>
                          </>
                        ) : (
                          <div className="text-xl font-bold">
                            ${book.precio.toLocaleString('es-CO')}
                          </div>
                        )}
                      </div>
                      
                      {/* Botones */}
                      <div className="space-y-2 w-full">
                        <button 
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                          onClick={() => {
                            console.log('Agregar al carrito:', book.titulo);
                            // Aquí iría la lógica para agregar al carrito
                          }}
                        >
                          Agregar al carrito
                        </button>
                        <button 
                          className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors text-sm"
                          onClick={() => goToBookDetails(book._id)}
                        >
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default SearchResults;