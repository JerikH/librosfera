import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import axios from 'axios';
import CachedImage from './CachedImage';
import { getCartCount } from './cartUtils'; // Importar utilidad para obtener el contador del carrito

// URL base para las llamadas a la API
const API_BASE_URL = 'http://localhost:5000/api/v1';

const HomePage = () => {
  const [allBooks, setAllBooks] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [discountedBooks, setDiscountedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 0
  });
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [validImageUrls, setValidImageUrls] = useState([]);
  
  // Estado para el contador del carrito
  const [cartCount, setCartCount] = useState(0);

  // Función para actualizar el contador del carrito
  const updateCartCount = (count) => {
    setCartCount(count);
  };

  useEffect(() => {
    // Cargar el contador inicial del carrito
    setCartCount(getCartCount());
    
    // Función para cargar todos los datos necesarios
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchAllBooks(),
          fetchFeaturedBooks(),
          fetchDiscountedBooks(),
          fetchCategories()
        ]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  

  // Función para obtener todos los libros
  const fetchAllBooks = async (page = 1, limit = 50) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/libros`, {
        params: {
          page,
          limit,
          solo_disponibles: true,
          sort: 'fecha_registro',
          order: 'desc'
        }
      });

      if (response.data.status === 'success') {
        setAllBooks(response.data.data);
        setPagination(response.data.paginacion);
        console.log(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error al obtener libros:', error);
      return [];
    }
  };

  // Función para cargar libros destacados
  const fetchFeaturedBooks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/libros/destacados`, {
        params: {
          limit: 4,
          min_calificacion: 4
        }
      });

      if (response.data.status === 'success') {
        setFeaturedBooks(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error al obtener libros destacados:', error);
      return [];
    }
  };

  // Función para cargar libros con descuento
  const fetchDiscountedBooks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/libros/descuentos`, {
        params: {
          limit: 4,
          min_descuento: 10
        }
      });

      if (response.data.status === 'success') {
        setDiscountedBooks(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error al obtener libros con descuento:', error);
      return [];
    }
  };

  // Función para establecer las categorías originales
  const fetchCategories = async () => {
    // Usamos las categorías originales del código anterior
    const originalCategories = [
      'Ficción', 'No Ficción', 'Ciencia Ficción', 'Fantasía', 'Romance', 'Biografía', 'Historia', 'Ciencia', 'Filosofía', 'Arte', 'Tecnología'
    ];
    
    setCategories(originalCategories);
    return originalCategories;
  };

  // Función para cargar página siguiente/anterior
  const loadPage = async (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setIsLoading(true);
    await fetchAllBooks(newPage, pagination.limit);
    setIsLoading(false);
    // Scroll hacia arriba para mejor UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBookIcon = (id) => {
    // Always use the placeholder image instead of SVG icons
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src="/placeholder-book.png" 
          alt="Imagen no disponible" 
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
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


 
// Componente para mostrar un libro
const BookCard = ({ book }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [validImageUrls, setValidImageUrls] = useState([]);
  const [imagesVerified, setImagesVerified] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false); // Estado para animación al agregar al carrito
  
  useEffect(() => {
    // Only run image verification once
    if (!imagesVerified && book.imagenes && book.imagenes.length > 0) {
      const verifyImages = async () => {
        const validImages = [];
        
        for (const image of book.imagenes) {
          try {
            // Check if image exists by making a HEAD request with axios
            const response = await axios.head(image.url);
            if (response.status === 200) {
              validImages.push(image);
            }
          } catch (error) {
            console.log(`Failed to verify image: ${image.url}`);
          }
        }
        
        setValidImageUrls(validImages.length > 0 ? validImages : [{ 
          url: "http://localhost:5000/uploads/libros/Default.png",
          alt_text: "Default book image"
        }]);
        
        // Mark images as verified to prevent re-verification
        setImagesVerified(true);
      };
      
      verifyImages();
    } else if (!imagesVerified) {
      // No images or empty array - set default and mark as verified
      setValidImageUrls([{ 
        url: "http://localhost:5000/uploads/libros/Default.png",
        alt_text: "Default book image"
      }]);
      setImagesVerified(true);
    }
  }, [book.imagenes, imagesVerified]);

  const navigateToDetail = () => {
    navigate(`/libro/${book._id}`);
  };

  // Función para agregar al carrito
  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevenir navegación a detalles
      
    // Comprobamos si hay stock disponible
    if (!book.stock || book.stock <= 0) {
      // Puedes mostrar un mensaje de error aquí
      alert('Lo sentimos, este libro no está disponible en inventario.');
      return;
    }
    
    // Mostrar animación de carga
    setAddingToCart(true);
    
    try {
      // Obtener el carrito actual del localStorage
      const currentCart = localStorage.getItem('shoppingCart') 
        ? JSON.parse(localStorage.getItem('shoppingCart')) 
        : [];
      
      // Comprobar si el libro ya está en el carrito
      const existingItemIndex = currentCart.findIndex(item => item.bookId === book._id);
      
      if (existingItemIndex >= 0) {
        // Incrementar la cantidad si el libro ya está en el carrito
        currentCart[existingItemIndex].quantity += 1;
      } else {
        // Agregar el libro al carrito con cantidad 1
        currentCart.push({
          bookId: book._id,
          quantity: 1
        });
      }
      
      // Guardar el carrito actualizado en localStorage
      localStorage.setItem('shoppingCart', JSON.stringify(currentCart));
      
      // Actualizar el contador del carrito
      const newCount = currentCart.reduce((total, item) => total + item.quantity, 0);
      updateCartCount(newCount);
      
      // Mostrar un mensaje de éxito
      alert(`${book.titulo} agregado al carrito`);
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      alert('Ocurrió un error al agregar el libro al carrito');
    } finally {
      // Desactivar la animación después de un breve periodo
      setTimeout(() => {
        setAddingToCart(false);
      }, 500);
    }
  };

  // Calcular precio con y sin descuento
  const precioBase = book.precio_info?.precio_base || book.precio;
  const tieneDescuento = book.precio_info?.descuentos?.some(d => d.activo);
  const porcentajeDescuento = tieneDescuento 
    ? book.precio_info.descuentos.find(d => d.activo && d.tipo === 'porcentaje')?.valor || 0 
    : 0;
  
  // Formatear el stock
  const stockDisponible = book.stock || 0;

  // Función para navegar entre imágenes
  const navigateImages = (e, direction) => {
    // Detener la propagación para evitar navegación a detalles
    e.stopPropagation();
    
    if (!validImageUrls || validImageUrls.length <= 1) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => 
        prev === validImageUrls.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === 0 ? validImageUrls.length - 1 : prev - 1
      );
    }
  };

  return (
    <div 
      className="book-card flex flex-col h-full border bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={navigateToDetail}
    >
      {/* Imagen del libro con flechas de navegación */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <div 
          className="flex transition-transform duration-300 ease-in-out w-full h-full"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {validImageUrls.length > 0 ? (
            validImageUrls.map((image, index) => (
              <div key={index} className="min-w-full h-full flex-shrink-0">
                <CachedImage 
                  src={image.url} 
                  alt={image.alt_text || "Imagen de libro"} 
                  className="w-full h-full object-contain"
                />
              </div>
            ))
          ) : (
            <div className="min-w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
              <span className="material-icons-outlined text-6xl">book</span>
            </div>
          )}
        </div>
        
        {/* Etiqueta de descuento si aplica */}
        {porcentajeDescuento > 0 && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
            {porcentajeDescuento}% DCTO
          </div>
        )}
        
        {/* Flechas de navegación de imágenes - solo si hay más de una imagen */}
        {validImageUrls && validImageUrls.length > 1 && (
          <>
            <button 
              className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 hover:bg-opacity-100 z-10"
              onClick={(e) => navigateImages(e, 'prev')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 hover:bg-opacity-100 z-10"
              onClick={(e) => navigateImages(e, 'next')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {/* Información del libro */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Título aún marcado como clickable para mantener el estilo hover */}
        <h3 className="font-bold text-sm line-clamp-2 mb-1 hover:text-blue-600">
          {book.titulo}
        </h3>
        <p className="text-gray-600 text-sm mb-2">{book.autor_nombre_completo}</p>
        
        {/* Estrellas de calificación si están disponibles */}
        {book.calificaciones && (
          <div className="flex mb-1">
            {renderStars(book.calificaciones.promedio)}
            {book.calificaciones.cantidad > 0 && (
              <span className="text-xs text-gray-500 ml-1">({book.calificaciones.cantidad})</span>
            )}
          </div>
        )}
        
        {/* Editorial e información de edición */}
        {book.editorial && (
          <p className="text-xs text-gray-500 mb-3">
            {book.editorial}, {book.estado === 'nuevo' ? 'Nuevo' : 'Usado'}
            {book.anio_publicacion ? `, ${book.anio_publicacion}` : ''}
          </p>
        )}
        
        {/* Disponibilidad */}
        <p className={`text-xs ${stockDisponible > 0 ? 'text-green-600' : 'text-red-600'} mb-2`}>
          {stockDisponible > 0 
            ? `Quedan ${stockDisponible} ${stockDisponible === 1 ? 'unidad' : 'unidades'}`
            : 'Agotado'}
        </p>
        
        {/* Precio */}
        <div className="mt-auto">
          {tieneDescuento ? (
            <div>
              <span className="text-xs line-through text-gray-500">
                ${precioBase.toLocaleString('es-CO')}
              </span>
              <div className="text-lg font-bold text-red-600">
                ${(book.precio - (book.precio * (porcentajeDescuento / 100))).toLocaleString('es-CO')}
              </div>
            </div>
          ) : (
            <div className="text-lg font-bold">
              ${book.precio.toLocaleString('es-CO')}
            </div>
          )}
        </div>
        
        {/* Botón Agregar al carrito */}
        <div className="mt-2 flex">
          <button 
            className={`flex items-center justify-center px-3 py-1 rounded-full text-sm w-full transition-colors
              ${stockDisponible > 0 
                ? addingToCart 
                  ? 'bg-gray-400 text-white cursor-wait' 
                  : 'bg-red-600 text-white hover:bg-red-700 cursor-pointer' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            onClick={handleAddToCart}
            disabled={stockDisponible <= 0 || addingToCart}
          >
            {addingToCart ? (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Agregando...
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Agregar al carrito
              </>
            )}
          </button>
        </div>

        {/* Botón Ver detalles */}
        <div className="mt-2">
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation(); // Este es redundante ya que igualmente va a la página de detalles
              navigateToDetail();
            }}
          >
            Ver detalles
          </button>
        </div>
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
        <button 
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full flex items-center"
          onClick={() => navigate('/ofertas')}
        >
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
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <li key={index}>
                <a 
                  href={`/libros/categoria/${encodeURIComponent(category)}`}
                  className="block py-2 text-sm hover:text-blue-600 transition-colors"
                >
                  {category}
                </a>
              </li>
            ))
          ) : (
            <li className="py-2 text-sm text-gray-500">Cargando categorías...</li>
          )}
        </ul>
      </div>
    </div>
  );

  // Sección de libros destacados
  const FeaturedBooksSection = () => {
    if (featuredBooks.length === 0) return null;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Libros Destacados</h2>
          <Link to="/libros/destacados" className="text-blue-600 text-sm hover:underline">Ver todos</Link>
        </div>
        
        <div className="border-t-4 border-blue-600 mb-4"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredBooks.map(book => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      </div>
    );
  };

  // Sección principal de libros con descuento
  const DiscountedBooksSection = () => {
    if (discountedBooks.length === 0) return null;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">CyberBooks - Hasta 60% dcto</h2>
          <Link to="/libros/descuentos" className="text-blue-600 text-sm hover:underline">Ver todos</Link>
        </div>
        
        <div className="border-t-4 border-red-600 mb-4"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {discountedBooks.map(book => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      </div>
    );
  };

  // Sección de todos los libros (Agregada)
  const AllBooksSection = () => {
    if (allBooks.length === 0 && !isLoading) return (
      <div className="mb-8 text-center p-8 bg-gray-50 rounded-lg">
        <span className="material-icons-outlined text-4xl text-gray-400 mb-2">auto_stories</span>
        <p className="text-gray-600">No se encontraron libros disponibles</p>
      </div>
    );
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Catálogo Completo</h2>
          <Link to="/libros" className="text-blue-600 text-sm hover:underline">Ver catálogo</Link>
        </div>
        
        <div className="border-t-4 border-gray-600 mb-4"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allBooks.map(book => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="inline-flex rounded-md shadow">
              <button
                onClick={() => loadPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium
                  ${pagination.page === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                <span className="material-icons-outlined text-sm">chevron_left</span>
                Anterior
              </button>
              
              <div className="relative inline-flex items-center px-4 py-2 border-t border-b text-sm font-medium bg-white text-gray-700">
                Página {pagination.page} de {pagination.totalPages}
              </div>
              
              <button
                onClick={() => loadPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium
                  ${pagination.page === pagination.totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Siguiente
                <span className="material-icons-outlined text-sm">chevron_right</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    );
  };

  // Contenido principal que se mostrará dentro del layout
  const HomeContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
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
            <DiscountedBooksSection />
            <FeaturedBooksSection />
            <AllBooksSection />
          </div>
        </div>
      </div>
    );
  };

  return (
    <UserLayout cartCount={cartCount} updateCartCount={updateCartCount}>
      <HomeContent />
    </UserLayout>
  );
};

export default HomePage;