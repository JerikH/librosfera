import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserLayout from './UserLayout';

// Componente de página de pago
function CheckoutPaymentPage() {
  console.log("Renderizando CheckoutPaymentPage");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [bookDetails, setBookDetails] = useState([]);
  const [shippingInfo, setShippingInfo] = useState({
    method: '',
    storeName: '',
    storeAddress: '',
    shippingCost: 0
  });
  
  // Estados para el formulario de pago
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  
  // Estado para el total
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Cargar datos al iniciar
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log("Cargando datos de pago...");
        // Obtener carrito del localStorage
        const storedCart = localStorage.getItem('shoppingCart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItems(parsedCart);
          
          // Simular la obtención de detalles de los libros
          const mockBookDetails = parsedCart.map(item => ({
            id: item.bookId || Math.random().toString(36).substr(2, 9),
            title: `Libro de ejemplo ${item.bookId?.slice(-3) || '001'}`,
            author: 'Autor de ejemplo',
            image: '/placeholder-book.png',
            price: item.price || 35000,
            quantity: item.quantity || 1
          }));
          
          setBookDetails(mockBookDetails);
          
          // Calcular subtotal
          const calculatedSubtotal = mockBookDetails.reduce((total, book) => {
            return total + (book.price * book.quantity);
          }, 0);
          
          setSubtotal(calculatedSubtotal);
          
          // Cargar información de envío
          const storedShippingInfo = localStorage.getItem('shippingPreferences');
          if (storedShippingInfo) {
            const parsedShippingInfo = JSON.parse(storedShippingInfo);
            setShippingInfo(parsedShippingInfo);
            
            // Establecer costo de envío
            const cost = parsedShippingInfo.shippingCost || 0;
            setShippingCost(cost);
            
            // Calcular total con envío
            setTotal(calculatedSubtotal + cost);
          } else {
            setTotal(calculatedSubtotal);
          }
        } else {
          // Si no hay carrito, redireccionar a la página de inicio
          navigate('/Home');
          return;
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);
  
  // Validar el formulario
  const validateForm = () => {
    if (!cardNumber) {
      alert('Por favor, ingresa el número de tarjeta');
      return false;
    }
    if (!expiry) {
      alert('Por favor, ingresa la fecha de vencimiento');
      return false;
    }
    if (!cvc) {
      alert('Por favor, ingresa el código de seguridad');
      return false;
    }
    if (!cardholderName) {
      alert('Por favor, ingresa el nombre del titular');
      return false;
    }
    return true;
  };
  
  // Continuar a la confirmación de pago
  const handleContinuePayment = () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      // Guardar los datos del pago en localStorage temporalmente
      const paymentInfo = {
        method: paymentMethod,
        cardNumber,
        cardExpiry: expiry,
        cardCVC: cvc,
        cardholderName
      };
      
      localStorage.setItem('tempPaymentInfo', JSON.stringify(paymentInfo));
      
      // Redirigir a la página de confirmación de pago
      navigate('/checkout/confirm-payment');
    } catch (error) {
      console.error('Error al procesar los datos:', error);
      alert('Ha ocurrido un error al procesar los datos. Por favor intente nuevamente.');
    }
  };
  
  // Si está cargando, mostrar indicador
  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Cargando información de pago...</p>
          </div>
        </div>
      </UserLayout>
    );
  }
  
  // Si no hay información de envío, redireccionar
  if (!shippingInfo.method) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-700 mb-4">No hay información de envío disponible</p>
            <button 
              onClick={() => navigate('/checkout')} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Volver a método de envío
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }
  
  return (
    <UserLayout>
      <div className="bg-gray-100 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Contenido principal */}
            <div className="flex flex-col md:flex-row gap-8">
              {/* Columna izquierda - Información de envío y producto */}
              <div className="md:w-2/3">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h1 className="text-xl font-bold mb-6">Información de pago</h1>
                  
                  {/* Método de pago */}
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Método de pago</label>
                    <div className="relative">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        <option value="credit_card">Tarjeta de crédito</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Información de la tarjeta */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Número de tarjeta</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="1234 1234 1234 1234"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <div className="flex space-x-1">
                            <span className="text-gray-400">Visa</span>
                            <span className="text-gray-400">MC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <label className="block text-gray-700 mb-2">Fecha de vencimiento</label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="block text-gray-700 mb-2">Código de seguridad</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="CVC"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value)}
                            className="block w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">Nombre del titular</label>
                      <input
                        type="text"
                        placeholder="Nombre como aparece en la tarjeta"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Método de envío */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-bold mb-4">Método de envío</h2>
                  
                  <div className="border border-gray-200 rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          checked={true}
                          readOnly
                          className="h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <label className="ml-3">
                          <div className="flex justify-between w-full items-center">
                            <span className="font-medium">{shippingInfo.method === 'tienda' ? 'Recoger en tienda' : 'Envío a domicilio'}</span>
                            <div className="text-right">
                              {shippingInfo.method === 'tienda' ? (
                                <p className="text-green-600 font-bold">Gratis</p>
                              ) : (
                                <p className="font-bold">$ {shippingCost.toLocaleString('es-CO')}</p>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                      
                      <div className="mt-2 ml-7 text-sm text-gray-600">
                        {shippingInfo.method === 'tienda' && shippingInfo.storeName && (
                          <span>{shippingInfo.storeName}, {shippingInfo.storeAddress || 'dirección disponible en tu email'}</span>
                        )}
                        {shippingInfo.method === 'domicilio' && (
                          <span>{shippingInfo.locationCity}, {shippingInfo.locationState}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Columna derecha - Resumen y botón de pago */}
              <div className="md:w-1/3">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                  <h2 className="text-xl font-bold mb-6">Resumen de compra</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Producto</span>
                      <span>$ {subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío</span>
                      {shippingInfo.method === 'tienda' ? (
                        <span className="text-green-600">Gratis</span>
                      ) : (
                        <span>$ {shippingCost.toLocaleString('es-CO')}</span>
                      )}
                    </div>
                    <div className="border-t pt-4 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>$ {total.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleContinuePayment}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Continuar
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Al confirmar, aceptas los términos y condiciones de compra
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default CheckoutPaymentPage;