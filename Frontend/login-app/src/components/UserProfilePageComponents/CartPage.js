import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CachedImage from '../CachedImage'; // Importar el componente CachedImage

// URL base para las llamadas a la API
const API_BASE_URL = 'http://localhost:5000/api/v1';

const CartPage = ({ updateCartCount }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Cargar los elementos del carrito al montar el componente
  useEffect(() => {
    const fetchCartItems = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener carrito del localStorage
        const storedCart = localStorage.getItem('shoppingCart');
        if (!storedCart) {
          setCartItems([]);
          setIsLoading(false);
          return;
        }
        
        const parsedCart = JSON.parse(storedCart);
        
        // Obtener detalles adicionales de los libros
        const cartWithDetails = await Promise.all(
          parsedCart.map(async (item) => {
            try {
              const response = await axios.get(`${API_BASE_URL}/libros/${item.bookId}`);
              if (response.data.status === 'success') {
                return {
                  ...item,
                  bookDetails: response.data.data
                };
              }
              return item;
            } catch (error) {
              console.error(`Error al obtener detalles del libro ${item.bookId}:`, error);
              return item;
            }
          })
        );
        
        setCartItems(cartWithDetails);
        
        // Actualizar el contador del carrito en el componente padre si existe la función
        if (updateCartCount) {
          updateCartCount(parsedCart.reduce((total, item) => total + item.quantity, 0));
        }
      } catch (error) {
        console.error('Error al cargar elementos del carrito:', error);
        setError('Ocurrió un error al cargar los elementos del carrito. Por favor, intenta de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartItems();
  }, [updateCartCount]);

  // Función para calcular el subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.bookDetails?.precio || 0;
      const discount = item.bookDetails?.precio_info?.descuentos?.find(d => d.activo && d.tipo === 'porcentaje')?.valor || 0;
      const finalPrice = itemPrice - (itemPrice * (discount / 100));
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  // Función para actualizar la cantidad de un item
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cartItems.map(item => 
      item.bookDetails?._id === itemId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    setCartItems(updatedCart);
    
    // Actualizar localStorage
    const simplifiedCart = updatedCart.map(item => ({
      bookId: item.bookDetails?._id,
      quantity: item.quantity
    }));
    
    localStorage.setItem('shoppingCart', JSON.stringify(simplifiedCart));
    
    // Actualizar el contador del carrito en el componente padre si existe la función
    if (updateCartCount) {
      updateCartCount(simplifiedCart.reduce((total, item) => total + item.quantity, 0));
    }
  };

  // Función para eliminar un item del carrito
  const removeItem = (itemId) => {
    const updatedCart = cartItems.filter(item => item.bookDetails?._id !== itemId);
    setCartItems(updatedCart);
    
    // Actualizar localStorage
    const simplifiedCart = updatedCart.map(item => ({
      bookId: item.bookDetails?._id,
      quantity: item.quantity
    }));
    
    localStorage.setItem('shoppingCart', JSON.stringify(simplifiedCart));
    
    // Actualizar el contador del carrito en el componente padre si existe la función
    if (updateCartCount) {
      updateCartCount(simplifiedCart.reduce((total, item) => total + item.quantity, 0));
    }
  };

  // Función para vaciar todo el carrito
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('shoppingCart');
    if (updateCartCount) {
      updateCartCount(0);
    }
  };

  // Función para ir al checkout
  const goToCheckout = () => {
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando elementos del carrito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-red-100 p-6 rounded-lg max-w-md">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700">{error}</p>
          <button 
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-8 rounded-lg shadow-sm">
        <svg className="w-24 h-24 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          No tienes productos en tu carrito de compras. Explora nuestro catálogo y agrega los libros que desees comprar.
        </p>
        <button 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          onClick={() => navigate('/home')}
        >
          Explorar catálogo
        </button>
      </div>
    );
  }

  // Estilo CSS personalizado para la barra de desplazamiento a la derecha
  const customScrollbarStyle = `
    /* Estilo para navegadores WebKit (Chrome, Safari, etc.) */
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
    
    /* Estilo para Firefox */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #c1c1c1 #f1f1f1;
    }
  `;

  return (
    <div className="h-full bg-gray-50">
      {/* Estilos personalizados para la barra de desplazamiento */}
      <style>{customScrollbarStyle}</style>
      
      {/* Contenedor principal con altura completa y flex */}
      <div className="max-w-6xl mx-auto p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Mi Carrito de Compras</h2>
          <button 
            className="text-red-600 flex items-center hover:text-red-700 text-sm"
            onClick={clearCart}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Vaciar carrito
          </button>
        </div>
        
        {/* Contenedor de dos columnas con flex, ocupa todo el alto disponible */}
        <div className="flex flex-col lg:flex-row gap-6 flex-grow">
          {/* Columna de libros - Área que se puede desplazar */}
          <div className="w-full lg:w-2/3 h-full">
            <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-700">Productos ({cartItems.length})</h3>
              </div>
              
              {/* Lista de productos con scroll - La barra de desplazamiento aparece aquí */}
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.bookDetails?._id} className="p-4 flex flex-col sm:flex-row gap-4">
                      {/* Imagen del libro - AHORA USANDO CACHEDIMAGE */}
                      <div className="w-24 h-32 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        {item.bookDetails?.imagenes && item.bookDetails.imagenes.length > 0 ? (
                          <CachedImage 
                            src={item.bookDetails.imagenes[0].url} 
                            alt={item.bookDetails.titulo || "Libro"} 
                            className="w-full h-full object-contain"
                            fallbackSrc="http://localhost:5000/uploads/libros/Default.png"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Información del libro */}
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">{item.bookDetails?.titulo}</h4>
                            <p className="text-sm text-gray-600 mb-1">{item.bookDetails?.autor_nombre_completo}</p>
                            
                            {/* Editorial e información de edición */}
                            {item.bookDetails?.editorial && (
                              <p className="text-xs text-gray-500 mb-2">
                                {item.bookDetails.editorial}, {item.bookDetails.estado === 'nuevo' ? 'Nuevo' : 'Usado'}
                                {item.bookDetails.anio_publicacion ? `, ${item.bookDetails.anio_publicacion}` : ''}
                              </p>
                            )}
                            
                            {/* Stock disponible */}
                            {item.bookDetails?.stock > 0 ? (
                              <p className="text-xs text-green-600 mb-2">
                                Disponible: {item.bookDetails.stock} unidades
                              </p>
                            ) : (
                              <p className="text-xs text-red-600 mb-2">
                                Agotado
                              </p>
                            )}
                          </div>
                          
                          <button 
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => removeItem(item.bookDetails?._id)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4">
                          {/* Precio */}
                          <div className="mb-3 sm:mb-0">
                            {item.bookDetails?.precio_info?.descuentos?.some(d => d.activo) ? (
                              <div>
                                <span className="text-xs line-through text-gray-500 mr-1">
                                  ${item.bookDetails?.precio?.toLocaleString('es-CO')}
                                </span>
                                <span className="text-lg font-bold text-red-600">
                                  ${(item.bookDetails?.precio - (item.bookDetails?.precio * (item.bookDetails?.precio_info?.descuentos?.find(d => d.activo && d.tipo === 'porcentaje')?.valor / 100))).toLocaleString('es-CO')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold">
                                ${item.bookDetails?.precio?.toLocaleString('es-CO')}
                              </span>
                            )}
                          </div>
                          
                          {/* Control de cantidad */}
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-3">Cantidad:</span>
                            <div className="flex border border-gray-300 rounded">
                              <button 
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                                onClick={() => updateQuantity(item.bookDetails?._id, item.quantity - 1)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <input 
                                type="number" 
                                min="1" 
                                value={item.quantity} 
                                onChange={(e) => updateQuantity(item.bookDetails?._id, parseInt(e.target.value) || 1)}
                                className="w-12 h-8 text-center border-x border-gray-300"
                              />
                              <button 
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                                onClick={() => updateQuantity(item.bookDetails?._id, item.quantity + 1)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Columna de resumen - Siempre visible */}
          <div className="w-full lg:w-1/3 lg:h-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-6">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-700">Resumen de la compra</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${calculateSubtotal().toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span className="text-green-600">Gratis</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold">${calculateSubtotal().toLocaleString('es-CO')}</span>
                  </div>
                </div>
                
                <button 
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  onClick={goToCheckout}
                >
                  Proceder al pago
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-4">
                  Los precios y disponibilidad están sujetos a cambios. La entrega está disponible únicamente en Colombia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;