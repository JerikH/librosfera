import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';

const CheckoutDeliveryPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [redirectTo, setRedirectTo] = useState(null);
  
  // Resumen de compra
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [total, setTotal] = useState(0);

  // Ubicación del usuario
  const [userLocation, setUserLocation] = useState({
    ciudad: 'Pereira',
    departamento: 'Risaralda'
  });

  // Efecto para manejar la redirección
  useEffect(() => {
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [redirectTo, navigate]);

  // Cargar datos del carrito
  useEffect(() => {
    const fetchCartData = async () => {
      setIsLoading(true);
      try {
        // Obtener carrito del localStorage
        const storedCart = localStorage.getItem('shoppingCart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItems(parsedCart);
          
          // Calcular subtotal (simulado, en realidad vendría de la API con detalles completos)
          const calculatedSubtotal = parsedCart.reduce((total, item) => {
            // En un entorno real, obtendríamos el precio desde el detalle del libro
            return total + ((item.price || 35000) * item.quantity);
          }, 0);
          
          setSubtotal(calculatedSubtotal);
          setTotal(calculatedSubtotal);
        }
        
        // Obtener datos de usuario desde localStorage o API
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          setUserLocation({
            ciudad: parsedUserData.ciudad || 'Pereira',
            departamento: parsedUserData.departamento || 'Risaralda'
          });
        }
      } catch (error) {
        console.error('Error al cargar datos del carrito:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartData();
  }, []);

  // Actualizar costos de envío y total cuando cambia el método
  useEffect(() => {
    if (deliveryMethod === 'domicilio') {
      const cost = userLocation.ciudad === 'Pereira' ? 7000 : 12000;
      setShippingCost(cost);
      setTotal(subtotal + cost);
    } else if (deliveryMethod === 'tienda') {
      setShippingCost(0);
      setTotal(subtotal);
    }
  }, [deliveryMethod, subtotal, userLocation]);

  // Manejar cambio en método de entrega
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
  };

  // Continuar al siguiente paso
  const handleContinue = () => {
    // Verificar que se haya seleccionado un método de entrega
    if (!deliveryMethod) {
      alert('Por favor selecciona un método de entrega para continuar');
      return;
    }
    
    try {
      // Guardar preferencias de envío
      const shippingPreferences = {
        method: deliveryMethod,
        storeId: null, // Ya no seleccionamos tienda en esta página
        shippingCost,
        locationCity: userLocation.ciudad,
        locationState: userLocation.departamento
      };
      
      localStorage.setItem('shippingPreferences', JSON.stringify(shippingPreferences));
      console.log("Preferencias de envío guardadas:", shippingPreferences);
      
      // Con el enfoque de rutas anidadas
      if (deliveryMethod === 'tienda') {
        // Si el método es tienda, ir a la página de selección de tiendas
        navigate('/checkout/store-selection');
      } else if (deliveryMethod === 'domicilio') {
        // Si el método es domicilio, ir directamente a la página de pago
        navigate('/checkout/payment');
      }
    } catch (error) {
      console.error("Error en el proceso de navegación:", error);
      alert("Ha ocurrido un error al procesar su solicitud. Por favor intente nuevamente.");
    }
  };

  return (
    <UserLayout>
      <div className="bg-gray-100 min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Columna principal - Opciones de envío */}
            <div className="lg:w-3/5">
              <h1 className="text-2xl font-bold mb-6">Elige la forma de entrega</h1>
              
              {/* Opciones de envío */}
              <div className="bg-white rounded-lg shadow-sm">
                {/* Opción: Envío a domicilio */}
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input 
                        type="radio"
                        id="delivery-home"
                        name="delivery-method"
                        value="domicilio"
                        checked={deliveryMethod === 'domicilio'}
                        onChange={() => handleDeliveryMethodChange('domicilio')}
                        className="h-5 w-5 text-blue-600"
                      />
                      <label htmlFor="delivery-home" className="ml-3 text-lg">
                        Enviar a domicilio
                      </label>
                    </div>
                    <span className="font-bold">$ {deliveryMethod === 'domicilio' ? shippingCost.toLocaleString('es-CO') : '7.000'}</span>
                  </div>
                  
                  {deliveryMethod === 'domicilio' && (
                    <div className="mt-3 ml-8 text-gray-600">
                      {userLocation.ciudad}, {userLocation.departamento}
                    </div>
                  )}
                </div>
                
                {/* Opción: Retiro en tienda */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input 
                        type="radio"
                        id="delivery-pickup"
                        name="delivery-method"
                        value="tienda"
                        checked={deliveryMethod === 'tienda'}
                        onChange={() => handleDeliveryMethodChange('tienda')}
                        className="h-5 w-5 text-blue-600"
                      />
                      <label htmlFor="delivery-pickup" className="ml-3 text-lg">
                        Retiro en un punto de entrega
                      </label>
                    </div>
                    <span className="font-bold text-green-600">Gratis</span>
                  </div>
                  
                  {deliveryMethod === 'tienda' && (
                    <div className="mt-3 ml-8 text-gray-600">
                      Selecciona esta opción para recoger tu pedido en una de nuestras tiendas físicas. 
                      Podrás elegir la ubicación en el siguiente paso.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botón continuar */}
              <div className="mt-6 flex justify-center md:justify-end">
                <button 
                  onClick={handleContinue}
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
                  disabled={!deliveryMethod}
                >
                  Continuar
                </button>
              </div>
            </div>
            
            {/* Columna lateral - Resumen de compra */}
            <div className="lg:w-2/5">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Resumen de compra</h2>
                <div className="border-b pb-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Producto{cartItems.length !== 1 ? 's' : ''}</span>
                    <span>$ {subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    {deliveryMethod === 'tienda' ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      <span>$ {shippingCost.toLocaleString('es-CO')}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center font-bold">
                  <span>Total</span>
                  <span>$ {total.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default CheckoutDeliveryPage;