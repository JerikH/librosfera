import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';

const BookDetails = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const navigate = useNavigate();

  useEffect(() => {
    // Simular la carga de datos del libro desde una API
    const fetchBookDetails = async () => {
      try {
        // En un escenario real, aquí harías una llamada a la API
        // para obtener los detalles del libro con el ID proporcionado
        setTimeout(() => {
          // Datos simulados
          const bookData = {
            id: parseInt(bookId),
            title: "Cien años de soledad",
            subtitle: "Obra maestra del realismo mágico",
            author: "Gabriel García Márquez",
            description: `Una de las obras más importantes y de mayor reconocimiento de la literatura hispanoamericana y universal. La historia narra la vida de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.
            
            Con su inigualable estilo y su inagotable riqueza imaginativa, Gabriel García Márquez ha creado un lugar y unos personajes que se quedarán para siempre en la mente de los lectores. Esta novela, considerada una de las más representativas del llamado realismo mágico, narra la historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.
            
            A través de un mundo donde conviven lo cotidiano con lo fantástico, García Márquez hace un retrato de la idiosincrasia latinoamericana con todas sus grandezas y miserias; con sus personajes entrañables y extravagantes; con su prosa deslumbrante y su sabiduría sobrecogedora.`,
            publisher: "Editorial Planeta",
            publishedDate: "2007-05-30",
            isbn: "9788497592208",
            pages: 496,
            language: "Español",
            categories: ["Ficción", "Novela", "Literatura latinoamericana", "Realismo mágico"],
            price: 45000,
            originalPrice: 50000,
            discount: 10,
            rating: 4.8,
            reviews: 1256,
            stock: 42,
            format: "Tapa blanda",
            edition: "Edición conmemorativa",
            images: [
              "/books/cien-anos-1.jpg",
              "/books/cien-anos-2.jpg",
              "/books/cien-anos-3.jpg"
            ],
            relatedBooks: [
              {
                id: 2,
                title: "El amor en los tiempos del cólera",
                author: "Gabriel García Márquez",
                price: 42000,
                discount: 5,
                image: "/books/amor-colera.jpg"
              },
              {
                id: 3,
                title: "Crónica de una muerte anunciada",
                author: "Gabriel García Márquez",
                price: 35000,
                discount: 0,
                image: "/books/cronica.jpg"
              },
              {
                id: 4,
                title: "El laberinto de la soledad",
                author: "Octavio Paz",
                price: 38000,
                discount: 15,
                image: "/books/laberinto.jpg"
              }
            ]
          };
          
          setBook(bookData);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching book details:', error);
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchBookDetails();
  }, [bookId]);

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
        {book?.reviews && (
          <span className="ml-2 text-gray-600 text-sm">
            ({book.reviews} reseñas)
          </span>
        )}
      </div>
    );
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
              {book.categories && (
                <a href={`/category/${book.categories[0]}`} className="text-blue-600 hover:underline">
                  {book.categories[0]}
                </a>
              )}
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
                <div className="aspect-w-3 aspect-h-4 bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <img
                    src={book.images?.[0] || '/placeholder-book.jpg'}
                    alt={book.title}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-book.jpg';
                    }}
                  />
                </div>

                {/* Miniaturas */}
                {book.images && book.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {book.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-w-1 aspect-h-1 bg-gray-100 rounded border overflow-hidden cursor-pointer"
                      >
                        <img
                          src={img}
                          alt={`${book.title} - Vista ${idx + 1}`}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-book.jpg';
                          }}
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
                por{' '}
                <a
                  href={`/author/${encodeURIComponent(book.author)}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {book.author}
                </a>
              </p>

              {/* Calificación */}
              <div className="mb-4">
                {book.rating && renderRating(book.rating)}
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
                <div>
                  <p className="text-sm text-gray-500">ISBN</p>
                  <p className="font-medium">{book.isbn || 'No disponible'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Idioma</p>
                  <p className="font-medium">{book.language || 'No disponible'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Formato</p>
                  <p className="font-medium">{book.format || 'Tapa blanda'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Edición</p>
                  <p className="font-medium">{book.edition || 'Estándar'}</p>
                </div>
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

              {/* Cantidad y botones de acción */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <span className="mr-4 font-medium">Cantidad</span>
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={decrementQuantity}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                      disabled={quantity <= 1}
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
                    />
                    <button
                      onClick={incrementQuantity}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                      disabled={quantity >= book.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={addToCart}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg flex items-center justify-center font-medium"
                    disabled={book.stock <= 0}
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg flex items-center justify-center font-medium"
                    disabled={book.stock <= 0}
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
                      <div className="border-b pb-3">
                        <p className="font-medium">ISBN</p>
                        <p className="text-gray-600">{book.isbn}</p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Páginas</p>
                        <p className="text-gray-600">{book.pages}</p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Idioma</p>
                        <p className="text-gray-600">{book.language}</p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Categorías</p>
                        <p className="text-gray-600">
                          {book.categories?.join(', ')}
                        </p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Formato</p>
                        <p className="text-gray-600">{book.format}</p>
                      </div>
                      <div className="border-b pb-3">
                        <p className="font-medium">Edición</p>
                        <p className="text-gray-600">{book.edition}</p>
                      </div>
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