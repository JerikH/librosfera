import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';

const SearchResults = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extraer el término de búsqueda de los parámetros de la URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('q') || '';
    setSearchTerm(query);
    
    // Simular una búsqueda con el término extraído
    searchBooks(query);
  }, [location.search]);
  
  // Función para buscar libros (simulada)
  const searchBooks = (query) => {
    setIsLoading(true);
    
    // Simular tiempo de carga
    setTimeout(() => {
      // Esta sería la llamada a tu API real
      if (!query || query.trim() === '') {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }
      
      // Datos de ejemplo para simulación
      const allBooks = [
        {
          id: 1,
          title: "Los Dioses También Pecan",
          author: "Eduardo Lozano Torres",
          price: 50900,
          originalPrice: 50900,
          discount: 60,
          imageUrl: '/book-covers/dioses.jpg',
          rating: 4,
          publisher: 'Círculo De Lectores',
          edition: '1 Edición, Tapa Blanda',
          stock: 17,
          description: 'Una novela apasionante que explora los límites de la moralidad y la divinidad.'
        },
        {
          id: 2,
          title: "La psicología del dinero",
          author: "Morgan Housel",
          price: 49000,
          originalPrice: 49000,
          discount: 30,
          imageUrl: '/book-covers/psicologia-dinero.jpg',
          rating: 5,
          reviews: 15,
          publisher: 'Booket',
          edition: '2024, 2 Edición, Tapa Blanda, Nuevo',
          stock: 100,
          description: 'Lecciones atemporales sobre riqueza, avaricia y felicidad.'
        },
        {
          id: 3,
          title: "Haz que el dinero trabaje para ti",
          author: "Claudia Uribe",
          price: 54900,
          originalPrice: 54900,
          discount: 35,
          imageUrl: '/book-covers/dinero-trabaje.jpg',
          rating: 5,
          reviews: 1,
          publisher: 'CÍRCULO DE LECTORES',
          edition: '2024, Tapa Blanda, Nuevo',
          stock: 100,
          description: 'Guía práctica para invertir y multiplicar tu patrimonio.'
        },
        {
          id: 4,
          title: "A diario con Dios",
          author: "Damiano Lucio",
          price: 34900,
          originalPrice: 34900,
          discount: 30,
          imageUrl: '/book-covers/diario-dios.jpg',
          rating: 5,
          reviews: 1,
          publisher: 'GSF',
          edition: '2024, Tapa Blanda, Nuevo',
          stock: 44,
          description: 'Meditaciones diarias para fortalecer tu fe y conexión espiritual.'
        },
        {
          id: 5,
          title: "Migrantes",
          author: "PLANETA",
          price: 59900,
          originalPrice: 59900,
          discount: 0,
          imageUrl: '/book-covers/migrantes.jpg',
          stock: 10,
          description: 'Una conmovedora historia sobre el viaje de los migrantes en busca de una vida mejor.'
        },
        {
          id: 6,
          title: "Meta Alimentación",
          author: "Oscar Rosero",
          price: 46665,
          originalPrice: 55900,
          discount: 15,
          imageUrl: '/book-covers/meta-alimentacion.jpg',
          stock: 10,
          description: 'Revoluciona tu forma de entender la nutrición y mejora tu salud.'
        },
        {
          id: 7,
          title: "Cien años de soledad",
          author: "Gabriel García Márquez",
          price: 45000,
          originalPrice: 45000,
          discount: 0,
          imageUrl: '/book-covers/cien-anos.jpg',
          rating: 5,
          stock: 25,
          description: 'La obra maestra del realismo mágico que narra la historia de la familia Buendía.'
        },
        {
          id: 8,
          title: "El principito",
          author: "Antoine de Saint-Exupéry",
          price: 28000,
          originalPrice: 35000,
          discount: 20,
          imageUrl: '/book-covers/principito.jpg',
          rating: 5,
          stock: 30,
          description: 'Un clásico atemporal sobre la amistad, el amor y el sentido de la vida.'
        }
      ];
      
      // Filtrar libros basados en la consulta (título, autor o descripción)
      const lowercaseQuery = query.toLowerCase();
      const filtered = allBooks.filter(book => 
        book.title.toLowerCase().includes(lowercaseQuery) ||
        book.author.toLowerCase().includes(lowercaseQuery) ||
        (book.description && book.description.toLowerCase().includes(lowercaseQuery))
      );
      
      setSearchResults(filtered);
      setIsLoading(false);
    }, 1000);
  };
  
  // Función para renderizar estrellas de calificación
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // Función para manejar la adición al carrito
  const handleAddToCart = (e, book) => {
    e.stopPropagation(); // Evitar navegación a detalles
    alert(`Añadido al carrito: ${book.title}`);
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
              onClick={() => navigate('/Home')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Lista vertical de resultados */}
            <div className="divide-y divide-gray-200">
              {searchResults.map(book => (
                <div 
                  key={book.id} 
                  className="p-4 hover:bg-gray-50 flex flex-col md:flex-row cursor-pointer"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  {/* Imagen del libro */}
                  <div className="md:w-1/6 flex items-center justify-center mb-4 md:mb-0">
                    {book.imageUrl ? (
                      <img 
                        src={book.imageUrl} 
                        alt={book.title}
                        className="h-40 object-contain" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-book.png';
                        }}
                      />
                    ) : (
                      <div className="w-32 h-40 bg-gray-200 flex items-center justify-center">
                        <span className="material-icons-outlined text-5xl text-gray-400">menu_book</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Información del libro */}
                  <div className="md:w-4/6 md:px-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">{book.title}</h2>
                    <p className="text-gray-600 mb-2">por {book.author}</p>
                    
                    {/* Estrellas de calificación */}
                    {book.rating && (
                      <div className="flex items-center mb-2">
                        {renderStars(book.rating)}
                        {book.reviews && (
                          <span className="text-sm text-gray-500 ml-2">({book.reviews})</span>
                        )}
                      </div>
                    )}
                    
                    {/* Editorial e información de edición */}
                    {book.publisher && (
                      <p className="text-sm text-gray-500 mb-2">{book.publisher}, {book.edition}</p>
                    )}
                    
                    {/* Descripción */}
                    {book.description && (
                      <p className="text-gray-700 mb-2 line-clamp-2">{book.description}</p>
                    )}
                    
                    {/* Disponibilidad */}
                    <p className={`text-sm ${book.stock > 0 ? 'text-green-600' : 'text-red-600'} mt-2`}>
                      {book.stock > 0 
                        ? `${book.stock} ${book.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}`
                        : 'Agotado'}
                    </p>
                  </div>
                  
                  {/* Precio y botones de acción */}
                  <div className="md:w-1/6 flex flex-col items-center justify-center mt-4 md:mt-0">
                    {/* Precio */}
                    <div className="mb-3 text-center">
                      {book.discount > 0 ? (
                        <>
                          <div className="text-sm line-through text-gray-500">
                            ${book.originalPrice.toLocaleString('es-CO')}
                          </div>
                          <div className="text-xl font-bold text-red-600">
                            ${book.price.toLocaleString('es-CO')}
                          </div>
                          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded mt-1">
                            {book.discount}% DCTO
                          </div>
                        </>
                      ) : (
                        <div className="text-xl font-bold">
                          ${book.price.toLocaleString('es-CO')}
                        </div>
                      )}
                    </div>
                    
                    {/* Botones */}
                    <div className="space-y-2 w-full">
                      <button 
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                        onClick={(e) => handleAddToCart(e, book)}
                      >
                        Agregar al carrito
                      </button>
                      <button 
                        className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/book/${book.id}`);
                        }}
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default SearchResults;