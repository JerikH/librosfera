import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserLayout from './UserLayout';
import CachedImage from './CachedImage'; // Import the CachedImage component

const BookDetails = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedImageIndex, setDisplayedImageIndex] = useState(0);
  const [validImageUrls, setValidImageUrls] = useState([]);
  const [imagesVerified, setImagesVerified] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => { 
      try {
        // Realizar la llamada a la API con axios
        const response = await axios.get(`http://localhost:5000/api/v1/libros/${bookId}`);
        
        // Con axios, los datos ya vienen en formato JSON
        const result = response.data;
        
        if (result.status === 'success' && result.data) {
          // Mapear los datos de la API al formato esperado por el componente
          const apiBook = result.data;
          
          // Calcular el precio con descuento si hay descuentos
          let discountPercentage = 0;
          let originalPrice = apiBook.precio_info.precio_base;
          
          if (apiBook.precio_info.descuentos && apiBook.precio_info.descuentos.length > 0) {
            // Tomar el primer descuento disponible como ejemplo
            discountPercentage = apiBook.precio_info.descuentos[0].porcentaje || 0;
          }
          
          // Formatear la información del autor
          const authorName = apiBook.autor_nombre_completo || 
            (apiBook.autor && apiBook.autor.length > 0 ? 
              `${apiBook.autor[0].nombre} ${apiBook.autor[0].apellidos}` : 
              'Autor desconocido');

          const ratingAvg = apiBook.calificaciones ? apiBook.calificaciones.promedio || 0 : 0;
          const reviewCount = apiBook.calificaciones ? apiBook.calificaciones.cantidad || 0 : 0;
              
          
          // Determinar la URL de la imagen
          let imageUrl = null;
          
          // Verificar si hay imágenes en el formato nuevo
          if (apiBook.imagenes && apiBook.imagenes.length > 0) {
            // Buscar la imagen de tipo "portada"
            const portada = apiBook.imagenes.find(img => img.orden === 0);
            if (portada) {
              imageUrl = portada.url;
            } else {
              // Si no hay tipo "portada", usar la primera imagen
              imageUrl = apiBook.imagenes[0].url;
            }
          } 
          // Si no hay imágenes en el formato nuevo, verificar el formato legacy
          else if (apiBook.imagenes_legacy && apiBook.imagenes_legacy.portada) {
            imageUrl = apiBook.imagenes_legacy.portada;
          }
          
          // Mapear los datos al formato esperado por el componente
          const bookData = {
            id: apiBook._id,
            title: apiBook.titulo,
            subtitle: "", // No hay campo equivalente en la API
            author: authorName,
            description: apiBook.descripcion || "Sin descripción disponible",
            publisher: apiBook.editorial || "Editorial no especificada",
            publishedDate: apiBook.fecha_publicacion ? new Date(apiBook.fecha_publicacion).toLocaleDateString('es-CO') : "Fecha no disponible",
            isbn: "", // No hay campo equivalente en la API
            pages: apiBook.numero_paginas || 0,
            language: apiBook.idioma || "No especificado",
            categories: apiBook.palabras_clave || [],
            price: apiBook.precio || apiBook.precio_info.precio_base,
            originalPrice: originalPrice,
            discount: discountPercentage,
            rating: ratingAvg, // Use the rating from calificaciones
            reviews: reviewCount, // No hay campo equivalente en la API
            stock: apiBook.stock || 0,
            format: apiBook.estado || "No especificado",
            edition: "", // No hay campo equivalente en la API
            image: imageUrl, // Única imagen principal
            images: apiBook.imagenes ? apiBook.imagenes.map(img => img.url) : [],
            relatedBooks: [] // No hay campo equivalente en la API
          };
          
          setBook(bookData);
        } else {
          throw new Error('Formato de respuesta incorrecto');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching book details:', error);
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchBookDetails();
  }, [bookId]);

  useEffect(() => {
    if (book && book.images && book.images.length > 0 && !imagesVerified) {
      const verifyImages = async () => {
        const validImages = [];
        
        for (const imageUrl of book.images) {
          try {
            // Check if image exists by making a HEAD request with axios
            const response = await axios.head(imageUrl);
            if (response.status === 200) {
              validImages.push(imageUrl);
            }
          } catch (error) {
            console.log(`Failed to verify image: ${imageUrl}`);
          }
        }
        
        setValidImageUrls(validImages.length > 0 ? validImages : ["http://localhost:5000/uploads/libros/680bae3000046269b93458d0_1745726348391.jpg"]);
        setImagesVerified(true);
      };
      
      verifyImages();
    } else if (book && !book.images && book.image && !imagesVerified) {
      // If there's only a single image, verify it
      const verifySingleImage = async () => {
        try {
          const response = await axios.head(book.image);
          if (response.status === 200) {
            setValidImageUrls([book.image]);
          } else {
            setValidImageUrls(["http://localhost:5000/uploads/libros/680bae3000046269b93458d0_1745726348391.jpg"]);
          }
        } catch (error) {
          console.log(`Failed to verify image: ${book.image}`);
          setValidImageUrls(["http://localhost:5000/uploads/libros/680bae3000046269b93458d0_1745726348391.jpg"]);
        }
        setImagesVerified(true);
      };
      
      verifySingleImage();
    } else if (book && !imagesVerified) {
      // No images at all - set default image
      setValidImageUrls(["http://localhost:5000/uploads/libros/680bae3000046269b93458d0_1745726348391.jpg"]);
      setImagesVerified(true);
    }
  }, [book, imagesVerified]);

  useEffect(() => {
    if (book && book.images && book.images.length > 0) {
      setDisplayedImageIndex(currentImageIndex);
    }
  }, [book, currentImageIndex]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (book.images && book.images.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      const newIndex = currentImageIndex === 0 ? book.images.length - 1 : currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      
      // After a short delay, update the displayed image
      setTimeout(() => {
        setDisplayedImageIndex(newIndex);
        setIsTransitioning(false);
      }, 300); // Match this with the CSS transition duration
    }
  };
  
  const handleNextImage = (e) => {
    e.stopPropagation();
    if (book.images && book.images.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      const newIndex = currentImageIndex === book.images.length - 1 ? 0 : currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      
      // After a short delay, update the displayed image
      setTimeout(() => {
        setDisplayedImageIndex(newIndex);
        setIsTransitioning(false);
      }, 300); // Match this with the CSS transition duration
    }
  };



  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (book?.stock || 1)) {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    if (quantity < (book?.stock || 1)) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = () => {
    // Aquí implementarías la lógica para añadir el libro al carrito
    alert(`Añadido al carrito: ${book.title} (${quantity} unidades)`);
  };

  const buyNow = () => {
    // Aquí implementarías la lógica para compra directa
    navigate('/checkout', { state: { items: [{ book, quantity }] } });
  };

  // Función para renderizar estrellas de calificación
  const renderRating = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${
              i < Math.floor(rating) 
                ? 'text-yellow-400' 
                : i < rating 
                  ? 'text-yellow-400' 
                  : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {i < rating && i + 1 > rating ? (
              // Estrella media llena
              <path
                fillRule="evenodd"
                d="M10 15.094l-5.664 2.978.967-6.105L.547 7.07l5.75-.872L10 1l3.703 5.198 5.75.872-4.756 4.897.967 6.105z"
                clipRule="evenodd"
                fill="url(#half-star)"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M10 15.094l-5.664 2.978.967-6.105L.547 7.07l5.75-.872L10 1l3.703 5.198 5.75.872-4.756 4.897.967 6.105z"
                clipRule="evenodd"
              />
            )}
          </svg>
        ))}
        <span className="ml-2 text-gray-600 text-sm">
          ({book.reviews} reseñas)
        </span>
      </div>
    );
  };

  // Función para mostrar el ícono de libro predeterminado
  const getBookIcon = (id) => {
    const icons = [
      <div key={1} className="text-indigo-500">
        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5zM16 12h-7m0-4h7m-7 8h7"></path>
        </svg>
      </div>,
      <div key={2} className="text-gray-500">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      </div>,
      <div key={3} className="text-gray-700">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      </div>,
      <div key={4} className="text-cyan-500">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      </div>
    ];
    
    // Calculamos un hash a partir del ID para obtener un ícono consistente
    const idString = id.toString();
    let hash = 0;
    for (let i = 0; i < idString.length; i++) {
      hash += idString.charCodeAt(i);
    }
    
    return icons[hash % icons.length];
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="container mx-auto py-12 px-4 flex justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando detalles del libro...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!book) {
    return (
      <UserLayout>
        <div className="container mx-auto py-12 px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Libro no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              Lo sentimos, no pudimos encontrar el libro que estás buscando.
            </p>
            <button
              onClick={() => navigate('/Home')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="/Home" className="text-blue-600 hover:underline">
                Inicio
              </a>
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-gray-400 mx-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {/* {book.categories && book.categories.length > 0 && (
                <a href={`/category/${book.categories[0]}`} className="text-blue-600 hover:underline">
                  {book.categories[0]}
                </a>
              )} */}
              {book.categories[0]}
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-gray-400 mx-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-600">{book.title}</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="flex flex-col md:flex-row">
            {/* Columna izquierda - Imágenes */}
            <div className="md:w-2/5 mb-6 md:mb-0 md:pr-8">
              <div className="sticky top-6">
              <div className="aspect-w-3 aspect-h-4 bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center relative">
  {/* Showing the image */
  
  
  }
  <div className="aspect-w-3 aspect-h-4 bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center relative"></div>
  {validImageUrls && validImageUrls.length > 0 ? (
    <CachedImage 
      src={validImageUrls[currentImageIndex]} 
      alt={`${book.title} - Vista ${currentImageIndex + 1}`}
      className="max-w-full max-h-full object-contain"
      fallbackSrc="/placeholder-book.jpg"
    />
  ) : (
    getBookIcon(book.id)
  )}
  
  {/* Navigation buttons - only if there are multiple images */}
  {validImageUrls && validImageUrls.length > 1 && (
    <>
      <button 
        type="button"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-white z-10"
        onClick={handlePrevImage}
      >
        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button 
        type="button"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-white z-10"
        onClick={handleNextImage}
      >
        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </>
  )}
</div>

                {/* Miniaturas */}
                {book.images && book.images.length > 1 && (
  <div className="grid grid-cols-4 gap-2">
    {validImageUrls.map((img, idx) => (
      <div
        key={idx}
        className={`aspect-w-1 aspect-h-1 bg-gray-100 rounded overflow-hidden cursor-pointer flex items-center justify-center ${idx === currentImageIndex ? 'border-2 border-blue-500' : 'border'}`}
        onClick={() => setCurrentImageIndex(idx)}
      >
        <CachedImage 
          src={img} 
          alt={`${book.title} - Vista ${idx + 1}`}
          className="max-w-full max-h-full object-contain"
          fallbackSrc="/placeholder-book.png"
        />
      </div>
    ))}
  </div>
)}
              </div>
            </div>

            {/* Columna derecha - Información */}
            <div className="md:w-3/5">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              
              {book.subtitle && (
                <p className="text-xl text-gray-600 mb-3">{book.subtitle}</p>
              )}
              
              <p className="text-lg mb-4">
                por {book.author}
                {/* <a
                  href={`/author/${encodeURIComponent(book.author)}`}
                  className="font-medium text-blue-600 hover:underline"
                  disabled={true}
                >
                  {book.author}
                </a> */}
              </p>

              {/* Calificación */}
              <div className="mb-4">
                {renderRating(book.rating)}
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Editorial</p>
                  <p className="font-medium">{book.publisher || 'No disponible'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Publicación</p>
                  <p className="font-medium">{book.publishedDate || 'No disponible'}</p>
                </div>
                {book.isbn && (
                  <div>
                    <p className="text-sm text-gray-500">ISBN</p>
                    <p className="font-medium">{book.isbn}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Idioma</p>
                  <p className="font-medium">{book.language || 'No disponible'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Formato</p>
                  <p className="font-medium">{book.format || 'Tapa blanda'}</p>
                </div>
                {book.edition && (
                  <div>
                    <p className="text-sm text-gray-500">Edición</p>
                    <p className="font-medium">{book.edition}</p>
                  </div>
                )}
              </div>

              {/* Precio y disponibilidad */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-2">
                  {book.discount > 0 ? (
                    <>
                      <p className="text-3xl font-bold text-red-600">
                        ${book.price.toLocaleString('es-CO')}
                      </p>
                      <p className="text-lg line-through text-gray-500">
                        ${book.originalPrice.toLocaleString('es-CO')}
                      </p>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {book.discount}% DCTO
                      </span>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      ${book.price.toLocaleString('es-CO')}
                    </p>
                  )}
                </div>

                <p className={`${book.stock > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                  {book.stock > 0
                    ? `${book.stock} unidades disponibles`
                    : 'Agotado'}
                </p>
              </div>

              {/* Cantidad y botones de acción - SIEMPRE DESHABILITADOS */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <span className="mr-4 font-medium">Cantidad</span>
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={decrementQuantity}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                      disabled={true}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={book.stock}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-12 text-center border-x border-gray-300 py-1"
                      disabled={true}
                    />
                    <button
                      onClick={incrementQuantity}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                      disabled={true}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={addToCart}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg flex items-center justify-center font-medium opacity-50 cursor-not-allowed"
                    disabled={true}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Agregar al carrito
                  </button>
                  <button
                    onClick={buyNow}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg flex items-center justify-center font-medium opacity-50 cursor-not-allowed"
                    disabled={true}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Comprar ahora
                  </button>
                </div>
              </div>

              {/* Características del libro */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex border-b border-gray-200">
                  <button
                    className={`pb-3 px-4 focus:outline-none ${
                      activeTab === 'description'
                        ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('description')}
                  >
                    Descripción
                  </button>
                  <button
                    className={`pb-3 px-4 focus:outline-none ${
                      activeTab === 'details'
                        ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('details')}
                  >
                    Detalles
                  </button>
                </div>

                <div className="py-4">
                  {activeTab === 'description' && (
                    <div className="prose max-w-none">
                      {book.description.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}

                  {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border-b pb-3">
                        <p className="font-medium">Título completo</p>
                        <p className="text-gray-600">{book.title}</p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Autor</p>
                        <p className="text-gray-600">{book.author}</p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Editorial</p>
                        <p className="text-gray-600">{book.publisher}</p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Fecha de publicación</p>
                        <p className="text-gray-600">{book.publishedDate}</p>
                      </div>
                      {book.isbn && (
                        <div className="border-b pb-3">
                          <p className="font-medium">ISBN</p>
                          <p className="text-gray-600">{book.isbn}</p>
                        </div>
                      )}
                      {book.pages > 0 && (
                        <div className="border-b pb-3">
                          <p className="font-medium">Páginas</p>
                          <p className="text-gray-600">{book.pages}</p>
                        </div>
                      )}
                      <div className="border-b pb-3">
                        <p className="font-medium">Idioma</p>
                        <p className="text-gray-600">{book.language}</p>
                      </div>
                      {book.categories && book.categories.length > 0 && (
                        <div className="border-b pb-3">
                          <p className="font-medium">Categorías</p>
                          <p className="text-gray-600">
                            {book.categories.join(', ')}
                          </p>
                        </div>
                      )}
                      <div className="border-b pb-3">
                        <p className="font-medium">Formato</p>
                        <p className="text-gray-600">{book.format}</p>
                      </div>
                      {book.edition && (
                        <div className="border-b pb-3">
                          <p className="font-medium">Edición</p>
                          <p className="text-gray-600">{book.edition}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Libros relacionados */}
        {book.relatedBooks && book.relatedBooks.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {book.relatedBooks.map((relatedBook) => (
                <div 
                  key={relatedBook.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                  onClick={() => navigate(`/book/${relatedBook.id}`)}
                >
                  <div className="aspect-w-3 aspect-h-4 bg-gray-100">
                    <img
                      src={relatedBook.image || '/placeholder-book.jpg'}
                      alt={relatedBook.title}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-book.jpg';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {relatedBook.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {relatedBook.author}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        {relatedBook.discount > 0 ? (
                          <div>
                            <span className="text-xs line-through text-gray-500">
                              ${(relatedBook.price / (1 - relatedBook.discount / 100)).toLocaleString('es-CO')}
                            </span>
                            <p className="text-lg font-bold text-red-600">
                              ${relatedBook.price.toLocaleString('es-CO')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-gray-900">
                            ${relatedBook.price.toLocaleString('es-CO')}
                          </p>
                        )}
                      </div>
                      {relatedBook.discount > 0 && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {relatedBook.discount}% DCTO
                        </span>
                      )}
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

export default BookDetails;