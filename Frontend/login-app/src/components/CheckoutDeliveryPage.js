import { useState, useEffect } from 'react';

const CheckoutDeliveryPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [redirectTo, setRedirectTo] = useState(null);
  
  // Resumen de compra
  const [subtotal, setSubtotal] = useState(35000);
  const [shippingCost, setShippingCost] = useState(7000);
  const [total, setTotal] = useState(42000);

  // Ubicación del usuario
  const [userLocation, setUserLocation] = useState({
    ciudad: 'Pereira',
    departamento: 'Risaralda'
  });

  // Manejar cambio en método de entrega
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
    
    if (method === 'domicilio') {
      setShippingCost(7000);
      setTotal(subtotal + 7000);
    } else if (method === 'tienda') {
      setShippingCost(0);
      setTotal(subtotal);
    }
  };

  // Continuar al siguiente paso
  const handleContinue = () => {
    if (!deliveryMethod) {
      alert('Por favor selecciona un método de entrega para continuar');
      return;
    }
    
    // Guardar preferencias de envío en localStorage
    const shippingPreferences = {
      method: deliveryMethod,
      shippingCost,
      locationCity: userLocation.ciudad,
      locationState: userLocation.departamento
    };
    
    localStorage.setItem('shippingPreferences', JSON.stringify(shippingPreferences));
    
    // Navegar a la página correcta según el método seleccionado
    if (deliveryMethod === 'tienda') {
      // Si es retiro en tienda, navegar a la selección de tienda
      window.location.href = '/checkout/store-selection';
    } else {
      // Si es envío a domicilio, ir directamente a pago
      window.location.href = '/checkout/payment';
    }
  };

  useEffect(() => {
    // Simular carga inicial y selección predeterminada
    setTimeout(() => {
      setIsLoading(false);
      handleDeliveryMethodChange('domicilio');
    }, 500);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Solo la barra azul oscura superior */}
      <header className="bg-gray-900 text-white py-4 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold mr-3">Librosfera</a>
            <span className="text-sm text-gray-300">Tu librería de confianza</span>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => window.location.href = "/mi-cuenta"} 
              className="text-sm hover:underline"
            >
              Mi Cuenta
            </button>
            <button 
              onClick={() => window.location.href = "/mis-pedidos"} 
              className="text-sm hover:underline"
            >
              Mis Pedidos
            </button>
            <button 
              onClick={() => window.location.href = "/logout"} 
              className="text-sm hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>
      
      {/* Contenido principal */}
      <div className="flex-grow bg-gray-100">
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
                        className="h-5 w-5 text-blue-600 cursor-pointer"
                      />
                      <label 
                        htmlFor="delivery-home" 
                        className="ml-3 text-lg cursor-pointer"
                        onClick={() => handleDeliveryMethodChange('domicilio')}
                      >
                        Enviar a domicilio
                      </label>
                    </div>
                    <span className="font-bold">$ 7.000</span>
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
                        className="h-5 w-5 text-blue-600 cursor-pointer"
                      />
                      <label 
                        htmlFor="delivery-pickup" 
                        className="ml-3 text-lg cursor-pointer"
                        onClick={() => handleDeliveryMethodChange('tienda')}
                      >
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
                    <span>$ 35.000</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    {deliveryMethod === 'tienda' ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      <span>$ 7.000</span>
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
    </div>
  );
};

export default CheckoutDeliveryPage;