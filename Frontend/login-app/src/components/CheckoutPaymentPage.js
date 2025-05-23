import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserLayout from './UserLayout';
import axios from 'axios';
import { getAuthToken } from './UserProfilePageComponents/authUtils';

const API_BASE_URL = 'http://localhost:5000/api/v1';

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
  const [cardid, setCardId] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  
  // Estado para el total
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [cartPrices, setCartPrices] = useState([]);
  const [Taxes, setTaxes] = useState(0);
  const [total, setTotal] = useState(0);

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState('');

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  const fetchCards = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await axios.get(`${API_BASE_URL}/tarjetas`, axiosConfig);
    
    if (response.data.status === 'success') {
      // Transformar los datos de la API al formato que espera el componente
      const transformedCards = response.data.data.map(card => ({
        id: card.id_tarjeta,
        type: card.marca === 'visa' ? 'Visa' : 'Mastercard',
        bank: `${card.tipo.charAt(0).toUpperCase() + card.tipo.slice(1)} ${card.marca.toUpperCase()}`,
        lastFour: card.ultimos_digitos,
        cardholderName: card.nombre_titular,
        expiryMonth: card.fecha_expiracion.mes.toString().padStart(2, '0'),
        expiryYear: card.fecha_expiracion.anio.toString().slice(-2),
        isDefault: card.predeterminada,
        isActive: card.activa,
        cardType: card.tipo,
        balance: card.saldo || 0 // Show 0 instead of null for all cards
      }));
      
      setCards(transformedCards);
    }
  } catch (err) {
    console.error('Error fetching cards:', err);
    setError('Error al cargar las tarjetas. Por favor, intenta de nuevo.');
  } finally {
    setLoading(false);
  }
};

  // Cargar datos al iniciar
  useEffect(() => {
  const fetchCartData = async () => {
    setIsLoading(true);
    
    try {
      // Debug: Log all localStorage contents
      console.log("=== DEBUGGING LOCALSTORAGE ===");
      console.log("All localStorage keys:", Object.keys(localStorage));
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}:`, localStorage.getItem(key));
      }
      console.log("==============================");
      
      // Get cart data from localStorage with correct key names
      const storedCart = localStorage.getItem('shoppingCart');
      const storedPrices = localStorage.getItem('CartPrices'); // Use the correct key name with capital C
      
      console.log("Stored Cart:", storedCart);
      console.log("Stored Prices:", storedPrices);
      
      // Since cart is loaded from API, check if prices exist and wait for cart sync
      if (storedPrices && storedPrices !== null && storedPrices !== undefined) {
        try {
          const parsedPrices = JSON.parse(storedPrices);
          console.log("Parsed Prices:", parsedPrices);
          
          if (parsedPrices && typeof parsedPrices === 'object') {
            setCartPrices(parsedPrices);
            
            // Use the pricing data that's available
            if (parsedPrices.subtotal_con_descuentos !== undefined) {
              setSubtotal(parsedPrices.subtotal_con_descuentos);
              setTaxes(parsedPrices.total_impuestos);
              setTotal((parsedPrices.subtotal_con_descuentos + parsedPrices.total_impuestos) || parsedPrices.total_final);
            }
          }
        } catch (priceParseError) {
          console.error('Error parsing cart prices:', priceParseError);
        }
      }
      
      // Check for cart items (may come later from API)
      if (storedCart && storedCart !== null && storedCart !== undefined) {
        try {
          const parsedCart = JSON.parse(storedCart);
          console.log("Parsed Cart:", parsedCart);
          
          // Validate that parsedCart is an array
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            setCartItems(parsedCart);
            
            // Handle prices separately with validation
            if (storedPrices && storedPrices !== null && storedPrices !== undefined) {
              try {
                const parsedPrices = JSON.parse(storedPrices);
                console.log("Parsed Prices:", parsedPrices);
                
                if (parsedPrices && typeof parsedPrices === 'object') {
                  setCartPrices(parsedPrices);
                  
                  // Use the parsed data directly instead of state
                  if (parsedPrices.subtotal_con_descuentos !== undefined) {
                    setSubtotal(parsedPrices.subtotal_con_descuentos);
                    setTotal((parsedPrices.subtotal_con_descuentos + parsedPrices.total_impuestos) || parsedPrices.total_final);
                  }
                }
              } catch (priceParseError) {
                console.error('Error parsing cart prices:', priceParseError);
                // Fallback: calculate subtotal manually
                const calculatedSubtotal = parsedCart.reduce((total, item) => {
                  return total + ((item.price || 35000) * item.quantity);
                }, 0);
                setSubtotal(calculatedSubtotal);
                // Fix: Use the current tax state value or 0
                setTotal(calculatedSubtotal + (Taxes));
              }
            } else {
              // No stored prices, calculate manually
              console.log("No stored prices found, calculating manually");
              const calculatedSubtotal = parsedCart.reduce((total, item) => {
                return total + ((item.price || 35000) * item.quantity);
              }, 0);
              setSubtotal(calculatedSubtotal);
              setTotal(calculatedSubtotal + Taxes);
            }
          } else {
            console.error('Cart data is not an array or is empty:', parsedCart);
          }
        } catch (cartParseError) {
          console.error('Error parsing cart data:', cartParseError);
        }
      } else {
        console.log("No cart data found in localStorage");
      }
      
      // Cargar información de envío
      const storedShippingInfo = localStorage.getItem('shippingPreferences');
      if (storedShippingInfo) {
        const parsedShippingInfo = JSON.parse(storedShippingInfo);
        setShippingInfo(parsedShippingInfo);
        
        // Establecer costo de envío
        const cost = parsedShippingInfo.shippingCost || 0;
        setShippingCost(cost);
      }
      
    } catch (error) {
      console.error('Error al cargar datos del carrito:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchCartData();
  fetchCards(); // Load cards when component mounts
}, [navigate]);

useEffect(() => {
  const checkForCartUpdates = () => {
    const storedCart = localStorage.getItem('shoppingCart');
    const storedPrices = localStorage.getItem('CartPrices');
    
    if (storedCart && storedCart !== null) {
      try {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCartItems(parsedCart);
          
          // If no prices were loaded before, calculate from cart
          if (cartPrices.length === 0 || Object.keys(cartPrices).length === 0) {
            const calculatedSubtotal = parsedCart.reduce((total, item) => {
              return total + ((item.price || 35000) * item.quantity);
            }, 0);
            setSubtotal(calculatedSubtotal);
            setTotal(calculatedSubtotal + Taxes);
          }
        }
      } catch (error) {
        console.error('Error parsing updated cart:', error);
      }
    }
  };
  
  // Check immediately
  checkForCartUpdates();
  
  // Set up an interval to check for updates (since cart loads from API)
  const interval = setInterval(checkForCartUpdates, 1000);
  
  // Clean up
  return () => clearInterval(interval);
}, [cartPrices]);

const handleCardSelection = (cardId) => {
  setSelectedCard(cardId);
  
  if (cardId === '') {
    // Clear form if no card selected
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setCardholderName('');
  } else {
    // Find selected card and populate form
    const card = cards.find(c => c.id === cardId);
    if (card) {
      setCardId(cardId);
      setCardNumber(`**** **** **** ${card.lastFour}`);
      setExpiry(`${card.expiryMonth}/${card.expiryYear}`);
      setCvc('***');
      setCardholderName(card.cardholderName);
    }
  }
};

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
        Id: cardid,
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
                        value={selectedCard}
                        onChange={(e) => handleCardSelection(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        disabled={loading}
                      >
                        <option value="">Seleccionar tarjeta</option>
                        {cards.filter(card => card.isActive).map(card => (
                          <option key={card.id} value={card.id}>
                            {card.bank} **** {card.lastFour}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm mt-1">{error}</p>
                    )}
                    {loading && (
                      <p className="text-gray-500 text-sm mt-1">Cargando tarjetas...</p>
                    )}
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
                          disabled={selectedCard !== ''}
                          className={`block w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCard !== '' ? 'bg-gray-100' : ''}`}
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
                          disabled={selectedCard !== ''}
                          className={`block w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCard !== '' ? 'bg-gray-100' : ''}`}
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
                            disabled={selectedCard !== ''}
                            className={`block w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCard !== '' ? 'bg-gray-100' : ''}`}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2 2v6a2 2 0 002 2z" />
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
                        disabled={selectedCard !== ''}
                        className={`block w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCard !== '' ? 'bg-gray-100' : ''}`}
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
                            <span className="font-medium">{shippingInfo.method === 'tienda' ? 'Recoger en tienda' : 'Envío a domicilio '}</span>
                            <div className="">
                              {shippingInfo.method === 'tienda' ? (
                                <p className="text-green-600 font-bold">Gratis</p>
                              ) : (
                                <span><p className="font-bold"> ${shippingCost.toLocaleString('es-CO')}</p></span>
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
                      <span className="text-gray-600">Impuestos</span>
                      <span>$ {Taxes.toLocaleString('es-CO')}</span>
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