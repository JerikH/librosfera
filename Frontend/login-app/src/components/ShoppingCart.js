import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CachedImage from './CachedImage'; // Importamos el componente CachedImage

// URL base para las llamadas a la API
const API_BASE_URL = 'http://localhost:5000/api/v1';

const ShoppingCart = ({ isOpen, onClose, updateCartCount }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const cartRef = useRef(null);
  const navigate = useNavigate();

  // Efecto para cargar los elementos del carrito del localStorage
  useEffect(() => {
    const fetchCartItems = async () => {
      setIsLoading(true);
      try {
        // Obtener carrito del localStorage
        const storedCart = localStorage.getItem('shoppingCart');
        if (storedCart) {
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
          updateCartCount(parsedCart.reduce((total, item) => total + item.quantity, 0));
        } else {
          setCartItems([]);
          updateCartCount(0);
        }
      } catch (error) {
        console.error('Error al cargar elementos del carrito:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchCartItems();
    }
  }, [isOpen, updateCartCount]);

  // Efecto para cerrar el carrito al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

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
    updateCartCount(simplifiedCart.reduce((total, item) => total + item.quantity, 0));
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
    updateCartCount(simplifiedCart.reduce((total, item) => total + item.quantity, 0));
  };

  // Función para vaciar todo el carrito
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('shoppingCart');
    updateCartCount(0);
  };

  // Función para ir al checkout
  const goToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="bg-black bg-opacity-50 absolute inset-0" onClick={onClose}></div>
      
      <div 
        ref={cartRef}
        className="relative bg-white w-full max-w-md h-full flex flex-col shadow-xl overflow-hidden"
        style={{ maxHeight: '100vh' }}
      >
        {/* Cabecera del carrito */}
        <div className="px-4 py-1.5 bg-gray-800 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Mi Carrito de Compras
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors">
            <svg className="w-10 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Contenido del carrito */}
        <div className="flex-grow overflow-y-auto p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium mb-2">Tu carrito está vacío</p>
              <p className="text-sm text-center mb-4">Agrega libros a tu carrito para comprarlos.</p>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                onClick={() => {
                  onClose();
                  navigate('/home');
                }}
              >
                Explorar catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.bookDetails?._id} className="flex border-b pb-4">
                  {/* Imagen del libro - Ahora usando CachedImage */}
                  <div className="w-20 h-24 flex-shrink-0 bg-gray-100 overflow-hidden">
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
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-sm line-clamp-2">{item.bookDetails?.titulo}</h3>
                      <button 
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => removeItem(item.bookDetails?._id)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-1">{item.bookDetails?.autor_nombre_completo}</p>
                    
                    {/* Precio */}
                    <div className="flex items-center mb-2">
                      {item.bookDetails?.precio_info?.descuentos?.some(d => d.activo) ? (
                        <>
                          <span className="text-xs line-through text-gray-500 mr-1">
                            ${item.bookDetails?.precio?.toLocaleString('es-CO')}
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            ${(item.bookDetails?.precio - (item.bookDetails?.precio * (item.bookDetails?.precio_info?.descuentos?.find(d => d.activo && d.tipo === 'porcentaje')?.valor / 100))).toLocaleString('es-CO')}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold">
                          ${item.bookDetails?.precio?.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                    
                    {/* Control de cantidad */}
                    <div className="flex items-center">
                      <button 
                        className="w-8 h-8 flex items-center justify-center border rounded-l bg-gray-100 hover:bg-gray-200"
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
                        className="w-10 h-8 text-center border-t border-b"
                      />
                      <button 
                        className="w-8 h-8 flex items-center justify-center border rounded-r bg-gray-100 hover:bg-gray-200"
                        onClick={() => updateQuantity(item.bookDetails?._id, item.quantity + 1)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Resumen y botones de acción */}
        <div className="border-t p-4 bg-gray-50">
          {cartItems.length > 0 && (
            <>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold">${calculateSubtotal().toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Envío</span>
                <span className="text-green-600 font-medium">Gratis</span>
              </div>
              <div className="h-px bg-gray-300 mb-4"></div>
              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">${calculateSubtotal().toLocaleString('es-CO')}</span>
              </div>
            </>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {cartItems.length > 0 ? (
              <>
                <button 
                  className="bg-white border border-red-600 text-red-600 py-2 px-4 rounded hover:bg-red-50"
                  onClick={clearCart}
                >
                  Vaciar carrito
                </button>
                <button 
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  onClick={goToCheckout}
                >
                  Proceder al pago
                </button>
              </>
            ) : (
              <button 
                className="col-span-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                onClick={() => {
                  onClose();
                  navigate('/home');
                }}
              >
                Seguir comprando
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;