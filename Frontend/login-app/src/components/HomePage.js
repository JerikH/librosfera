import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';

const HomePage = () => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Función para cargar datos iniciales
    const fetchInitialData = async () => {
      try {
        // Simulación de carga de datos
        setTimeout(() => {
          // Categorías simuladas
          const dummyCategories = [
            'Ciencias De La Tierra, Geografía, Medioambiente, Planificación',
            'Computación Y Tecnología De La Información',
            'Consulta, Información Y Materias Interdisciplinares',
            'Deportes Y Actividades De Ocio Al Aire Libre',
            'Derecho',
            'Economía, Finanzas, Empresa Y Gestión',
            'Estilos De Vida, Aficiones Y Ocio',
            'Ficción Y Temas Afines',
            'Filosofía Y Religión',
            'Historia Y Arqueología',
            'Infantiles, Juveniles Y Didácticos',
            'Lenguaje Y Lingüística',
            'Matemáticas Y Ciencias',
            'Medicina, Enfermería, Veterinaria',
            'Novela Gráfica, Libros De Cómics, Dibujos Animados',
            'Salud, Relaciones Y Desarrollo Personal',
            'Sociedad Y Ciencias Sociales',
            'Tecnología, Ingeniería, Agricultura, Procesos Industriales'
          ];

          // Libros destacados simulados
          const dummyFeaturedBooks = [
            {
              id: 1,
              title: 'Los Dioses También Pecan',
              author: 'Eduardo Lozano Torres',
              price: 50900,
              originalPrice: 50900,
              discount: 60,
              imageUrl: '/book-covers/dioses.jpg',
              rating: 4,
              publisher: 'Círculo De Lectores',
              edition: '1 Edición, Tapa Blanda',
              stock: 17,
              isPromotion: true
            },
            {
              id: 2,
              title: 'La psicología del dinero',
              author: 'Morgan Housel',
              price: 49000,
              originalPrice: 49000,
              discount: 30,
              imageUrl: '/book-covers/psicologia-dinero.jpg',
              rating: 5,
              reviews: 15,
              publisher: 'Booket',
              edition: '2024, 2 Edición, Tapa Blanda, Nuevo',
              stock: 100,
              isPromotion: true
            },
            {
              id: 3,
              title: 'HAZ QUE EL DINERO TRABAJE PARA TI',
              author: 'Claudia Uribe',
              price: 54900,
              originalPrice: 54900,
              discount: 35,
              imageUrl: '/book-covers/dinero-trabaje.jpg',
              rating: 5,
              reviews: 1,
              publisher: 'CÍRCULO DE LECTORES',
              edition: '2024, Tapa Blanda, Nuevo',
              stock: 100,
              isPromotion: true
            },
            {
              id: 4,
              title: 'A DIARIO CON DIOS',
              author: 'Damiano Lucio',
              price: 34900,
              originalPrice: 34900,
              discount: 30,
              imageUrl: '/book-covers/diario-dios.jpg',
              rating: 5,
              reviews: 1,
              publisher: 'GSF',
              edition: '2024, Tapa Blanda, Nuevo',
              stock: 44,
              isPromotion: true
            },
            {
              id: 5,
              title: 'MIGRANTES',
              author: 'PLANETA',
              price: 59900,
              originalPrice: 59900,
              discount: 0,
              imageUrl: '/book-covers/migrantes.jpg',
              isPreorder: true,
              stock: 10
            },
            {
              id: 6,
              title: 'META ALIMENTACIÓN',
              author: 'Oscar Rosero',
              price: 46665,
              originalPrice: 55900,
              discount: 15,
              imageUrl: '/book-covers/meta-alimentacion.jpg',
              isPreorder: true,
              stock: 10
            }
          ];

          setCategories(dummyCategories);
          setFeaturedBooks(dummyFeaturedBooks);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

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

  // Componente para mostrar un libro
  const BookCard = ({ book }) => {
    return (
      <div className="book-card flex flex-col h-full border bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        {/* Imagen del libro */}
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {book.imageUrl ? (
            <img 
              src={book.imageUrl} 
              alt={book.title} 
              className="w-full h-full object-contain" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-book.png';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
              <span className="material-icons-outlined text-6xl">book</span>
            </div>
          )}
          
          {/* Etiqueta de preventa si aplica */}
          {book.isPreorder && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
              PREVENTA
            </div>
          )}
          
          {/* Etiqueta de descuento si aplica */}
          {book.discount > 0 && (
            <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
              {book.discount}% DCTO
            </div>
          )}
        </div>
        
        {/* Información del libro */}
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-bold text-sm line-clamp-2 mb-1">{book.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{book.author}</p>
          
          {/* Estrellas de calificación si están disponibles */}
          {book.rating && (
            <div className="flex mb-1">
              {renderStars(book.rating)}
              {book.reviews && (
                <span className="text-xs text-gray-500 ml-1">({book.reviews})</span>
              )}
            </div>
          )}
          
          {/* Editorial e información de edición */}
          {book.publisher && (
            <p className="text-xs text-gray-500 mb-3">{book.publisher}, {book.edition}</p>
          )}
          
          {/* Disponibilidad */}
          <p className="text-xs text-green-600 mb-2">
            {book.stock > 0 
              ? `Quedan ${book.stock} ${book.stock === 1 ? 'unidad' : 'unidades'}`
              : 'Agotado'}
          </p>
          
          {/* Precio */}
          <div className="mt-auto">
            {book.discount > 0 ? (
              <div>
                <span className="text-xs line-through text-gray-500">
                  ${book.originalPrice.toLocaleString('es-CO')}
                </span>
                <div className="text-lg font-bold text-red-600">
                  ${book.price.toLocaleString('es-CO')}
                </div>
              </div>
            ) : (
              <div className="text-lg font-bold">
                ${book.price.toLocaleString('es-CO')}
              </div>
            )}
          </div>
          
          {/* Botón Rápido para compra */}
          {book.isPromotion && (
            <div className="mt-2 flex">
              <button className="flex items-center justify-center bg-red-600 text-white px-3 py-1 rounded-full text-sm hover:bg-red-700 transition-colors w-full">
                <span className="material-icons-outlined text-sm mr-1">flash_on</span>
                Rápido
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Banner promocional
  const PromoBanner = () => (
    <div className="relative overflow-hidden rounded-lg mb-8">
      <img 
        src="/promo-banner.jpg" 
        alt="Promoción" 
        className="w-full h-64 object-cover bg-blue-900"
        onError={(e) => {
          e.target.onerror = null;
          // Mostrar un banner de respaldo si la imagen no carga
          e.target.style.display = 'none';
          e.target.parentNode.style.backgroundColor = '#1e3a8a';
          e.target.parentNode.innerHTML = `
            <div class="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
              <h2 class="text-4xl md:text-5xl font-bold mb-4">BOOKS 60% DCTO</h2>
              <p class="text-xl mb-6">¡Celebremos juntos el mes del libro!</p>
              <button class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full flex items-center">
                VER MÁS <span class="material-icons-outlined ml-1">arrow_forward</span>
              </button>
            </div>
          `;
        }}
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">BOOKS 60% DCTO</h2>
        <p className="text-xl mb-6">¡Celebremos juntos el mes del libro!</p>
        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full flex items-center">
          VER MÁS <span className="material-icons-outlined ml-1">arrow_forward</span>
        </button>
      </div>
    </div>
  );

  // Sección de categorías - ahora con posición fija al hacer scroll
  const CategoriesList = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
      <h2 className="text-lg font-bold mb-4">Categorías</h2>
      <div className="max-h-[calc(100vh-150px)] overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {categories.map((category, index) => (
            <li key={index}>
              <a 
                href={`/category/${encodeURIComponent(category.toLowerCase().replace(/ /g, '-'))}`}
                className="block py-2 text-sm hover:text-blue-600 transition-colors"
              >
                {category}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  // Sección de preventas destacadas
  const PreorderSection = () => {
    const preorderBooks = featuredBooks.filter(book => book.isPreorder);
    
    if (preorderBooks.length === 0) return null;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Preventas Top en Librosfera</h2>
          <a href="/preventas" className="text-blue-600 text-sm hover:underline">Ver todas</a>
        </div>
        
        <div className="border-t-4 border-red-600 mb-4"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {preorderBooks.map(book => (
            <div key={book.id} className="flex bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="w-1/3 p-4 flex items-center justify-center bg-white">
                {book.imageUrl ? (
                  <img 
                    src={book.imageUrl} 
                    alt={book.title} 
                    className="h-32 max-w-full object-contain" 
                  />
                ) : (
                  <div className="h-32 w-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <span className="material-icons-outlined text-4xl">book</span>
                  </div>
                )}
              </div>
              
              <div className="w-2/3 p-4 flex flex-col">
                <div className="mb-2">
                  <div className="bg-red-600 text-white text-xs inline-block px-2 py-1 rounded mb-2">
                    PREVENTA
                  </div>
                  <h3 className="font-bold">{book.title}</h3>
                  <p className="text-sm text-gray-600">{book.author}</p>
                </div>
                
                <div className="mt-auto">
                  <p className="text-xl font-bold">
                    ${book.price.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Sección principal de libros con descuento
  const DiscountedBooksSection = () => {
    const discountedBooks = featuredBooks.filter(book => book.discount > 0 && book.isPromotion);
    
    if (discountedBooks.length === 0) return null;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">CyberBooks - Hasta 60% dcto</h2>
          <a href="/ofertas" className="text-blue-600 text-sm hover:underline">Ver todas</a>
        </div>
        
        <div className="border-t-4 border-red-600 mb-4"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {discountedBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    );
  };

  // Contenido principal que se mostrará dentro del layout
  const HomeContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Cargando catálogo de libros...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Columna de categorías (izquierda) - ahora con posición sticky */}
          <div className="md:w-1/4 lg:w-1/5">
            <CategoriesList />
          </div>
          
          {/* Contenido principal (derecha) */}
          <div className="md:w-3/4 lg:w-4/5">
            <PromoBanner />
            <PreorderSection />
            <DiscountedBooksSection />
          </div>
        </div>
      </div>
    );
  };

  return (
    <UserLayout>
      <HomeContent />
    </UserLayout>
  );
};

export default HomePage;