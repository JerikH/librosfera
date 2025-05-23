import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import axios from 'axios';
import { getAuthToken } from './UserProfilePageComponents/authUtils';

// Componente de confirmación previa al pago
function CheckoutPaymentConfirmation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'credit_card',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cardholderName: ''
  });
  const [shippingInfo, setShippingInfo] = useState({
    method: '',
    storeName: '',
    storeAddress: '',
    shippingCost: 0
  });
  
  // Estado para el total
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0); // Add this line
  const [total, setTotal] = useState(0);
  
  // Cargar datos al iniciar
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Obtener información de pago de localStorage
        const storedPaymentInfo = localStorage.getItem('tempPaymentInfo');
        if (storedPaymentInfo) {
          const parsedPaymentInfo = JSON.parse(storedPaymentInfo);
          setPaymentInfo(parsedPaymentInfo);
        } else {
          navigate('/checkout/payment');
          return;
        }
        
        // Obtener carrito del localStorage - Fixed to match checkoutdeliverypage approach
        const storedCart = localStorage.getItem('shoppingCart');
        const storedPrices = localStorage.getItem('CartPrices'); // Use correct key with capital C
        
        if (storedCart) {
          try {
            const parsedCart = JSON.parse(storedCart);
            if (Array.isArray(parsedCart) && parsedCart.length > 0) {
              setCartItems(parsedCart);
            }
          } catch (error) {
            console.error('Error parsing cart data:', error);
          }
        }

        // Handle cart prices properly
        if (storedPrices) {
          try {
            const parsedPrices = JSON.parse(storedPrices);
            if (parsedPrices && typeof parsedPrices === 'object') {
              // Use the pricing data from CartPrices
              const calculatedSubtotal = parsedPrices.subtotal_con_descuentos || 0;
              const taxAmount = parsedPrices.total_impuestos || 0;
              const finalTotal = (calculatedSubtotal + taxAmount) || parsedPrices.total_final  ;
              
              setSubtotal(calculatedSubtotal);
              setTaxAmount(taxAmount); // Add this line
              setTotal(finalTotal);
            }
          } catch (error) {
            console.error('Error parsing cart prices:', error);
            // Fallback calculation if CartPrices fails
            if (cartItems.length > 0) {
              const calculatedSubtotal = cartItems.reduce((total, item) => {
                return total + ((item.price || 35000) * item.quantity);
              }, 0);
              setSubtotal(calculatedSubtotal);
            }
          }
        } else if (cartItems.length > 0) {
          // No stored prices, calculate manually
          const calculatedSubtotal = cartItems.reduce((total, item) => {
            return total + ((item.price || 35000) * item.quantity);
          }, 0);
          setSubtotal(calculatedSubtotal);
        }
        
        // Cargar información de envío - Fixed to match checkoutdeliverypage structure
        const storedShippingInfo = localStorage.getItem('shippingPreferences');
        if (storedShippingInfo) {
          try {
            const parsedShippingInfo = JSON.parse(storedShippingInfo);
            setShippingInfo({
              method: parsedShippingInfo.method,
              storeName: parsedShippingInfo.storeName || '',
              storeAddress: parsedShippingInfo.storeAddress || '',
              shippingCost: parsedShippingInfo.shippingCost || 0,
              locationCity: parsedShippingInfo.locationCity,
              locationState: parsedShippingInfo.locationState
            });
            
            const cost = parsedShippingInfo.shippingCost || 0;
            setShippingCost(cost);
            
            // Use total from CartPrices if available, otherwise calculate
            const storedPricesData = localStorage.getItem('CartPrices');
            if (storedPricesData) {
              const parsedPricesData = JSON.parse(storedPricesData);
              setTotal(parsedPricesData.total_final + parsedPricesData.total_impuestos || (subtotal + cost));
            } else {
              setTotal(subtotal + cost);
            }
          } catch (error) {
            console.error('Error parsing shipping info:', error);
          }
        } else {
          // Use total from CartPrices if no shipping info
          const storedPricesData = localStorage.getItem('CartPrices');
          if (storedPricesData) {
            const parsedPricesData = JSON.parse(storedPricesData);
            setTotal(parsedPricesData.total_final + parsedPricesData.total_impuestos|| subtotal);
          } else {
            setTotal(subtotal);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);
  
  // Efecto para actualizar el total cuando cambia el subtotal o el costo de envío
  useEffect(() => {
    setTotal(subtotal + shippingCost + taxAmount);
  }, [subtotal, shippingCost, taxAmount]);
  
  // Confirmar y procesar pago
  const handleConfirmPayment = async () => {
    try {
      setIsLoading(true);
      
      // Get user data for shipping address
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      // Get card data from tempPaymentInfo
      const storedPaymentInfo = localStorage.getItem('tempPaymentInfo');
      if (!storedPaymentInfo) {
        alert('No se encontró información de pago. Por favor, vuelve a ingresar los datos de tu tarjeta.');
        navigate('/checkout/payment');
        return;
      }
      
      const paymentData = JSON.parse(storedPaymentInfo);
      console.log("payment:", paymentData);
      
      // Prepare the request payload based on the example
      const requestPayload = {
        id_tarjeta: paymentData.Id, // You might need to store this when saving payment info
        tipo_envio: shippingInfo.method === 'tienda' ? 'tienda' : 'domicilio',
        direccion_envio: {
          calle: userData.direccion || "Dirección no especificada",
          ciudad: shippingInfo.locationCity || userData.ciudad || "Pereira",
          codigo_postal: userData.codigoPostal || "660001",
          pais: "Colombia",
          estado_provincia: shippingInfo.locationState || userData.departamento || "Risaralda",
          referencias: userData.referencias || ""
        },
        notas_envio: shippingInfo.method === 'tienda' ? 
          `Recoger en tienda: ${shippingInfo.storeName}` : 
          "Entrega a domicilio"
      };
      
      console.log('Enviando solicitud de pago:', requestPayload);
      
      // Get auth token (you might need to adjust this based on how you store it)
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      // Make the API request
      const response = await axios.post('http://localhost:5000/api/v1/ventas', requestPayload, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'Cache-Control': 'no-cache'
        },
        timeout: 30000
      });
      
      if (response.status === 200 || response.status === 201) {
        // Pago exitoso
        console.log('Pago procesado exitosamente:', response.data);
        
        // Guardar los datos del pago para confirmar éxito
        const paymentConfirmation = {
          method: paymentInfo.method,
          cardNumber: paymentInfo.cardNumber ? paymentInfo.cardNumber.replace(/\d(?=\d{4})/g, "*") : '',
          cardholderName: paymentInfo.cardholderName,
          total,
          subtotal,
          shippingCost,
          shippingMethod: shippingInfo.method,
          timestamp: new Date().toISOString(),
          transactionId: response.data.id || response.data.transactionId
        };
        
        localStorage.setItem('paymentData', JSON.stringify(paymentConfirmation));
        
        // Limpiar datos temporales
        localStorage.removeItem('tempPaymentInfo');
        localStorage.removeItem('shoppingCart');
        localStorage.removeItem('CartPrices');
        localStorage.removeItem('shippingPreferences');
        
        alert('¡Pago procesado correctamente!');
        navigate('/Home');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      
      let errorMessage = 'Ha ocurrido un error al procesar el pago. Por favor intente nuevamente.';
      
      if (error.response) {
        // Server responded with error status
        console.error('Error response:', error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Volver a la página de pago para modificar datos
  const handleEditPayment = () => {
    navigate('/checkout/payment');
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
  
  return (
    <UserLayout>
      <div className="bg-gray-100 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-center">Confirmar pago</h1>
            
            {/* Panel principal */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Sección superior - Datos de pago */}
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold mb-4">Información de pago</h2>
                
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Columna izquierda - Resumen */}
                  <div className="md:w-1/2 space-y-6">
                    {/* Resumen de compra */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3">Resumen de la compra</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Producto</span>
                          <span>$ {subtotal.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Impuestos</span>
                          <span>$ {taxAmount.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Envío</span>
                          {shippingCost === 0 ? (
                            <span className="text-green-600">Gratis</span>
                          ) : (
                            <span>$ {shippingCost.toLocaleString('es-CO')}</span>
                          )}
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>$ {total.toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Método de envío - SOLO MUESTRA EL SELECCIONADO */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3">Método de envío</h3>
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center">
                          <input 
                            type="radio"
                            checked={true}
                            readOnly
                            className="h-4 w-4 text-blue-600"
                          />
                          <label className="ml-2">
                            {shippingInfo.method === 'tienda' ? (
                              <div>
                                <span className="font-medium">Recoger en tienda</span>
                                {shippingInfo.storeName && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {shippingInfo.storeName}, {shippingInfo.storeAddress || 'dirección disponible en tu email'}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="font-medium">Envío a domicilio</span>
                                <p className="text-sm text-gray-600 mt-1">
                                  {shippingInfo.locationCity}, {shippingInfo.locationState}
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Columna derecha - Detalles de tarjeta */}
                  <div className="md:w-1/2">
                    <h3 className="font-medium text-gray-700 mb-3">Método de pago</h3>
                    <div className="border border-gray-200 rounded p-4">
                      <div className="flex items-center mb-4">
                        <input 
                          type="radio"
                          checked={true}
                          readOnly
                          className="h-4 w-4 text-blue-600"
                        />
                        <label className="ml-2 font-medium">
                          Tarjeta de crédito
                        </label>
                      </div>
                      
                      <div className="pl-6 space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Número de tarjeta</p>
                          <div className="flex items-center">
                            <p className="font-medium">
                              {paymentInfo.cardNumber ? 
                                paymentInfo.cardNumber.replace(/\d(?=\d{4})/g, "*") : 
                                '•••• •••• •••• ••••'}
                            </p>
                            <div className="ml-2 flex space-x-1">
                              <img src="/visa-icon.png" alt="Visa" className="h-5" 
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.style.display = 'none';
                                }} 
                              />
                              <img src="/mastercard-icon.png" alt="Mastercard" className="h-5" 
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.style.display = 'none';
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-4">
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Vencimiento</p>
                            <p className="font-medium">{paymentInfo.cardExpiry || 'MM/AA'}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Código de seguridad</p>
                            <p className="font-medium">•••</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Titular de la tarjeta</p>
                          <p className="font-medium">{paymentInfo.cardholderName || 'Nombre del titular'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sección inferior - Botones de acción */}
              <div className="p-6 bg-gray-50 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={handleConfirmPayment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-medium transition-colors"
                >
                  Pagar
                </button>
                <button
                  onClick={handleEditPayment}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-md font-medium transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Al confirmar, aceptas los términos y condiciones de compra
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default CheckoutPaymentConfirmation;