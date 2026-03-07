const trackEvent = (eventName, params = {}) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
};

export const trackBookView = (book) => {
  trackEvent('view_item', {
    currency: 'COP',
    value: book.precio || 0,
    items: [
      {
        item_id: book._id,
        item_name: book.titulo,
        item_brand: book.autor_nombre_completo,
        item_category: book.genero,
        price: book.precio || 0,
      },
    ],
  });
};

export const trackAddToCart = (book, quantity = 1) => {
  trackEvent('add_to_cart', {
    currency: 'COP',
    value: (book.precio || 0) * quantity,
    items: [
      {
        item_id: book._id,
        item_name: book.titulo,
        item_brand: book.autor_nombre_completo,
        item_category: book.genero,
        price: book.precio || 0,
        quantity,
      },
    ],
  });
};

export const trackBeginCheckout = (cartItems = [], total = 0) => {
  trackEvent('begin_checkout', {
    currency: 'COP',
    value: total,
    items: cartItems.map((item) => ({
      item_id: item.bookId?._id || item.bookId,
      item_name: item.bookId?.titulo,
      price: item.bookId?.precio || 0,
      quantity: item.quantity || 1,
    })),
  });
};

export const trackPurchase = (orderId, total, items = []) => {
  trackEvent('purchase', {
    transaction_id: orderId,
    currency: 'COP',
    value: total,
    items,
  });
};

export const trackSearch = (searchTerm) => {
  trackEvent('search', { search_term: searchTerm });
};
