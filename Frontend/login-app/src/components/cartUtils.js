// cartUtils.js - Funciones de utilidad para el carrito de compras

/**
 * Agrega un libro al carrito de compras
 * @param {Object} book - Datos del libro a agregar
 * @param {Number} quantity - Cantidad a agregar (por defecto 1)
 * @returns {Object} - Estado de la operación y el número total de elementos en el carrito
 */
import axios from "axios";
import { getAuthToken } from "./UserProfilePageComponents/authUtils";

export const addToCart = (book, quantity = 1) => {
  try {
    // Verificar si hay stock disponible
    if (!book.stock || book.stock <= 0) {
      return {
        success: false,
        message: 'Lo sentimos, este libro no está disponible en inventario.',
        totalItems: getCartCount()
      };
    }

    // Obtener el carrito actual del localStorage
    const currentCart = localStorage.getItem('shoppingCart') 
      ? JSON.parse(localStorage.getItem('shoppingCart')) 
      : [];
    
    // Comprobar si el libro ya está en el carrito
    const existingItemIndex = currentCart.findIndex(item => item.bookId === book._id);
    
    if (existingItemIndex >= 0) {
      // Incrementar la cantidad si el libro ya está en el carrito
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      // Agregar el libro al carrito con la cantidad especificada
      currentCart.push({
        bookId: book._id,
        quantity: quantity
      });
    }
    
    // Guardar el carrito actualizado en localStorage
    localStorage.setItem('shoppingCart', JSON.stringify(currentCart));
    
    // Calcular el total de items en el carrito
    const totalItems = currentCart.reduce((total, item) => total + item.quantity, 0);
    
    return {
      success: true,
      message: `${book.titulo || book.title} agregado al carrito`,
      totalItems: totalItems
    };
    
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    return {
      success: false,
      message: 'Ocurrió un error al agregar el libro al carrito',
      totalItems: getCartCount()
    };
  }
};

/**
 * Obtiene el número total de elementos en el carrito
 * @returns {Number} - Cantidad total de elementos
 */
export const getCartCount = () => {
  try {
    const storedCart = localStorage.getItem('shoppingCart');
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      console.log("cart:", parsedCart.length);
      // return parsedCart.reduce((total, item) => `${parsedCart.length()}`, 0);
      return parsedCart.length;
    }
    return 0;
  } catch (error) {
    console.error('Error al obtener el contador del carrito:', error);
    return 0;
  }
};

/**
 * Vacía el carrito de compras
 * @returns {Boolean} - True si se vació correctamente
 */
export const clearCart = () => {
  try {
    localStorage.removeItem('shoppingCart');
    return true;
  } catch (error) {
    console.error('Error al vaciar el carrito:', error);
    return false;
  }
};


export const UpdateQuantityBook = async (BookId, Quantity) => {
  
  try {
    const updateData = {
        "cantidad": Quantity
    };

    const response = await axios.put(`http://localhost:5000/api/v1/carrito/item/${BookId}`, updateData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Update-Reason': 'user_modification'
        },
        timeout: 30000, // 30 seconds max timeout
      }
    );

    console.log('Success quantity:', response.data);
    return response.data.status;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};


export const fetchCartUtils = async () => {
      localStorage.removeItem('shoppingCart');
      try {
        // Get cart data from API
        const API_BASE_URL = 'http://localhost:5000/api/v1';
        const response = await axios.get(`${API_BASE_URL}/carrito`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
       
        if (response.data.status === 'success' && response.data.data) {
          const { carrito, items } = response.data.data;
         
          // Transform API data to match component structure
          const cartWithDetails = items.map(item => ({
            bookId: item.id_libro,
            quantity: item.cantidad,
            bookDetails: {
              id: item.id_libro,
              titulo: item.metadatos.titulo_libro,
              autor_nombre_completo: item.metadatos.autor_libro,
              precio: item.precios.precio_base,
              precio_info: {
                descuentos: item.codigos_aplicados.map(codigo => ({
                  activo: true,
                  tipo: 'porcentaje',
                  valor: codigo.tipo_descuento === 'porcentaje' ? (codigo.descuento_aplicado / item.precios.precio_base) * 100 : 0
                }))
              },
              imagenes: item.metadatos.imagen_portada ? [{ url: item.metadatos.imagen_portada }] : [],
              stock: item.metadatos.disponible ? 10 : 0, // API doesn't provide stock, using placeholder
              editorial: '', // Not provided in API
              estado: 'nuevo', // Not provided in API
              anio_publicacion: '' // Not provided in API
            },
            itemId: item._id,
            subtotal: item.subtotal
          }));
         
          // setCartItems(cartWithDetails);
          
          // Store cart data in localStorage
          const localStorageCart = cartWithDetails.map(item => ({
            bookId: item.bookId,
            quantity: item.quantity
          }));
          
          localStorage.setItem('shoppingCart', JSON.stringify(localStorageCart));
          
          // Update timestamp to force other components to check
          localStorage.setItem('cartLastUpdated', new Date().getTime().toString());
          
          // Dispatch synchronization events
          const cartChangeEvent = new CustomEvent('cartUpdated', {
            bubbles: true,
            detail: {
              action: 'sync',
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(cartChangeEvent);
          
          // Generic cart update event
          window.dispatchEvent(new Event('globalCartUpdate'));
         
          // Update cart count
          // if (updateCartCount) {
          //   updateCartCount(carrito.n_item);
          // }
        } else {
          // setCartItems([]);
          // Clear localStorage if no cart data
          localStorage.removeItem('shoppingCart');
          localStorage.setItem('cartLastUpdated', new Date().getTime().toString());
        }
      } catch (error) {
        console.error('Error al cargar carrito desde API:', error);
        // if (error.response?.status === 401) {
        //   setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        // } else {
        //   setError('Ocurrió un error al cargar los elementos del carrito. Por favor, intenta de nuevo más tarde.');
        // }
      } 
      // finally {
      //   setIsLoading(false);
      // }
    };