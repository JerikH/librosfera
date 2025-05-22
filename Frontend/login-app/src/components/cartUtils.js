// cartUtils.js - Funciones de utilidad para el carrito de compras

/**
 * Agrega un libro al carrito de compras
 * @param {Object} book - Datos del libro a agregar
 * @param {Number} quantity - Cantidad a agregar (por defecto 1)
 * @returns {Object} - Estado de la operación y el número total de elementos en el carrito
 */
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
      return parsedCart.reduce((total, item) => total + item.quantity, 0);
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