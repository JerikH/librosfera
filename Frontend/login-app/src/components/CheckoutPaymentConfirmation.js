import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';

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
          // Si no hay información de pago, redirigir a la página de pago
          navigate('/checkout/payment');
          return;
        }
        
        // Obtener carrito del localStorage
        const storedCart = localStorage.getItem('shoppingCart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItems(parsedCart);
          
          // Calcular subtotal (simulado, en realidad vendría de la API con detalles completos)
          const calculatedSubtotal = parsedCart.reduce((total, item) => {
            return total + ((item.price || 35000) * item.quantity);
          }, 0);
          
          setSubtotal(calculatedSubtotal);
        } else {
          // Si no hay carrito, redireccionar a la página de inicio
          navigate('/Home');
          return;
        }
        
        // Cargar información de envío
        const storedShippingInfo = localStorage.getItem('shippingPreferences');
        if (storedShippingInfo) {
          const parsedShippingInfo = JSON.parse(storedShippingInfo);
          setShippingInfo(parsedShippingInfo);
          
          // Establecer costo de envío
          const cost = parsedShippingInfo.shippingCost || 0;
          setShippingCost(cost);
          
          // Calcular total con envío
          setTotal(subtotal + cost);
        } else {
          setTotal(subtotal);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [navigate, subtotal]);
  
  // Efecto para actualizar el total cuando cambia el subtotal o el costo de envío
  useEffect(() => {
    setTotal(subtotal + shippingCost);
  }, [subtotal, shippingCost]);
  
  // Confirmar y procesar pago
  const handleConfirmPayment = () => {
    try {
      // Aquí iría la lógica para procesar el pago con un servicio de pagos
      // Por ahora, simularemos un pago exitoso
      
      // Guardar los datos del pago en localStorage para confirmar éxito
      const paymentData = {
        method: paymentInfo.method,
        cardNumber: paymentInfo.cardNumber ? paymentInfo.cardNumber.replace(/\d(?=\d{4})/g, "*") : '',
        cardholderName: paymentInfo.cardholderName,
        total,
        subtotal,
        shippingCost,
        shippingMethod: shippingInfo.method,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('paymentData', JSON.stringify(paymentData));
      
      // Limpiar datos temporales de pago
      localStorage.removeItem('tempPaymentInfo');
      
      // Simular procesamiento de pago
      alert('¡Pago procesado correctamente!');
      
      // Limpiar carrito
      localStorage.removeItem('shoppingCart');
      
      // Redirigir al home
      navigate('/Home');
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Ha ocurrido un error al procesar el pago. Por favor intente nuevamente.');
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