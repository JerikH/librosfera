import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';

const CheckoutDeliveryPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartPrices, setCartPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [redirectTo, setRedirectTo] = useState(null);
  
  // Resumen de compra
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [Taxes, setTaxes] = useState(0);
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
              setTotal(parsedPrices.subtotal_con_descuentos + parsedPrices.total_impuestos);
              
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
                    setTotal(parsedPrices.subtotal_con_descuentos + parsedPrices.total_impuestos);
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
                setTotal(calculatedSubtotal + (Taxes || 0));
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
      
      // Handle user data
      const userData = localStorage.getItem('userData');
      if (userData && userData !== null && userData !== undefined) {
        try {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData && typeof parsedUserData === 'object') {
            setUserLocation({
              ciudad: parsedUserData.ciudad || 'Pereira',
              departamento: parsedUserData.departamento || 'Risaralda'
            });
          }
        } catch (userParseError) {
          console.error('Error parsing user data:', userParseError);
          // Set default values
          setUserLocation({
            ciudad: 'Pereira',
            departamento: 'Risaralda'
          });
        }
      }
      
    } catch (error) {
      console.error('Error al cargar datos del carrito:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchCartData();
}, []);
// Additional effect to listen for cart updates from API
useEffect(() => {
  const checkForCartUpdates = () => {
    const storedCart = localStorage.getItem('shoppingCart');
    const storedPrices = localStorage.getItem('CartPrices');
    
    if (storedCart && storedCart !== null) {
      try {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          //console.log("Cart items found after API sync:", parsedCart);
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
}, [cartPrices]); // Depend on cartPrices to avoid overwriting

  // Actualizar costos de envío y total cuando cambia el método
  useEffect(() => {
  if (deliveryMethod === 'domicilio') {
    const cost = userLocation.ciudad === 'Pereira' ? 7000 : 12000;
    setShippingCost(cost);
    setTotal(subtotal + cost + (Taxes || 0)); // Fix: Add fallback for Taxes
  } else if (deliveryMethod === 'tienda') {
    setShippingCost(0);
    setTotal(subtotal + (Taxes || 0)); // Fix: Add fallback for Taxes
  }
}, [deliveryMethod, subtotal, userLocation, Taxes]);

  // Manejar cambio en método de entrega
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
  };

  // Continuar al siguiente paso
  const handleContinue = () => {

    console.log("Total:", total);
    console.log(localStorage.getItem('CartPrices'));
    const cartPrices = JSON.parse(localStorage.getItem('CartPrices'));
    cartPrices.total_final = total;
    localStorage.setItem('CartPrices', JSON.stringify(cartPrices));
    
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
                    <span className="text-gray-600">Producto</span>
                    <span>$ {subtotal.toLocaleString('es-CO')}</span>
                  </div>

                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Impuestos</span>
                    <span>$ {Taxes.toLocaleString('es-CO')}</span>
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