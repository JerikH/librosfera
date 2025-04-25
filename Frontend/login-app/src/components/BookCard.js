import React from 'react';
import { useNavigate } from 'react-router-dom';

const BookCard = ({ book }) => {
  const navigate = useNavigate();
  
  // Función para navegar a la página de detalles del libro
  const goToBookDetails = () => {
    navigate(`/book/${book.id}`);
  };
  
  // Función para renderizar estrellas de calificación
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div 
      className="book-card flex flex-col h-full border bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={goToBookDetails}
    >
      {/* Imagen del libro */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {book.imageUrl ? (
          <img 
            src={book.imageUrl} 
            alt={book.title} 
            className="w-full h-full object-contain" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-book.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
            <span className="material-icons-outlined text-6xl">book</span>
          </div>
        )}
        
        {/* Etiqueta de preventa si aplica */}
        {book.isPreorder && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            PREVENTA
          </div>
        )}
        
        {/* Etiqueta de descuento si aplica */}
        {book.discount > 0 && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
            {book.discount}% DCTO
          </div>
        )}
      </div>
      
      {/* Información del libro */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-sm line-clamp-2 mb-1">{book.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{book.author}</p>
        
        {/* Estrellas de calificación si están disponibles */}
        {book.rating && (
          <div className="flex mb-1">
            {renderStars(book.rating)}
            {book.reviews && (
              <span className="text-xs text-gray-500 ml-1">({book.reviews})</span>
            )}
          </div>
        )}
        
        {/* Editorial e información de edición */}
        {book.publisher && (
          <p className="text-xs text-gray-500 mb-3">{book.publisher}, {book.edition}</p>
        )}
        
        {/* Disponibilidad */}
        <p className="text-xs text-green-600 mb-2">
          {book.stock > 0 
            ? `Quedan ${book.stock} ${book.stock === 1 ? 'unidad' : 'unidades'}`
            : 'Agotado'}
        </p>
        
        {/* Precio */}
        <div className="mt-auto">
          {book.discount > 0 ? (
            <div>
              <span className="text-xs line-through text-gray-500">
                ${book.originalPrice.toLocaleString('es-CO')}
              </span>
              <div className="text-lg font-bold text-red-600">
                ${book.price.toLocaleString('es-CO')}
              </div>
            </div>
          ) : (
            <div className="text-lg font-bold">
              ${book.price.toLocaleString('es-CO')}
            </div>
          )}
        </div>
        
        {/* Botón Rápido para compra */}
        {book.isPromotion && (
          <div className="mt-2 flex">
            <button 
              className="flex items-center justify-center bg-red-600 text-white px-3 py-1 rounded-full text-sm hover:bg-red-700 transition-colors w-full"
              onClick={(e) => {
                e.stopPropagation();
                // Aquí iría la lógica para compra rápida
                alert(`Compra rápida: ${book.title}`);
              }}
            >
              <span className="material-icons-outlined text-sm mr-1">flash_on</span>
              Rápido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;