import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddCardPage from './AddCardPage';
import RechargeBalancePage from './RechargeBalancePage';

const CardPage = () => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [showRechargeBalance, setShowRechargeBalance] = useState(false);
  const [cards, setCards] = useState([]);
  const navigate = useNavigate();

  // Saldo predeterminado (en pesos)
  const accountBalance = 0;

  // Función para manejar el clic en agregar tarjeta
  const handleAddCardClick = () => {
    setShowAddCard(true);
    setShowRechargeBalance(false);
  };

  // Función para cancelar la adición de tarjeta
  const handleCancelAddCard = () => {
    setShowAddCard(false);
  };

  // Función para guardar una nueva tarjeta
  const handleSaveCard = (cardData) => {
    setCards([...cards, cardData]);
    setShowAddCard(false);
  };

  // Función para eliminar una tarjeta
  const handleDeleteCard = (index) => {
    const updatedCards = [...cards];
    updatedCards.splice(index, 1);
    setCards(updatedCards);
  };

  // Función para mostrar la página de recarga de saldo
  const handleRechargeBalanceClick = () => {
    setShowRechargeBalance(true);
    setShowAddCard(false);
  };

  // Función para cancelar la recarga de saldo
  const handleCancelRecharge = () => {
    setShowRechargeBalance(false);
  };

  // Función para procesar la recarga de saldo
  const handleRechargeBalance = (amount, paymentMethod) => {
    // Aquí iría la lógica para procesar la recarga
    console.log(`Recarga de ${amount} con método de pago:`, paymentMethod);
    
    // Cerrar la página de recarga de saldo
    setShowRechargeBalance(false);
    
    // En una implementación real, aquí actualizaríamos el saldo
    // después de una respuesta exitosa del servidor
  };

  if (showAddCard) {
    return <AddCardPage onSave={handleSaveCard} onCancel={handleCancelAddCard} />;
  }

  if (showRechargeBalance) {
    return <RechargeBalancePage 
      onCancel={handleCancelRecharge} 
      onRecharge={handleRechargeBalance}
      savedCards={cards}
    />;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 h-full">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Métodos de Pago</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Mis Tarjetas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tarjeta de Saldo (siempre visible) */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm opacity-80">Tarjeta de</p>
                <p className="font-bold text-lg">SALDO</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="mb-8">
              <p className="text-sm opacity-80">Saldo disponible</p>
              <div className="font-bold text-2xl flex items-baseline">
                ${accountBalance.toLocaleString('es-CO')}
                <span className="text-sm ml-1 opacity-90">COP</span>
              </div>
            </div>
            
            <div className="text-sm opacity-80 mb-4">
              <p>Válida indefinidamente</p>
            </div>
            
            {/* Botón para recargar saldo */}
            <button 
              onClick={handleRechargeBalanceClick}
              className="w-full bg-white text-blue-600 font-medium py-2 px-4 rounded-md hover:bg-blue-50 transition-colors"
            >
              Recargar saldo
            </button>
          </div>
          
          {/* Tarjetas guardadas */}
          {cards.map((card, index) => (
            <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md relative">
              {/* Botón para eliminar la tarjeta */}
              <button 
                onClick={() => handleDeleteCard(index)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Eliminar tarjeta"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm opacity-80">Tarjeta {card.type}</p>
                  <p className="font-bold text-lg">{card.bank}</p>
                </div>
                <div className="w-12 h-8">
                  {card.type === 'Visa' && (
                    <svg className="h-full w-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4C35.0457 4 44 12.9543 44 24Z" fill="white"/>
                      <path d="M21.6267 28.8999H18.2653L20.202 19.0999H23.5653L21.6267 28.8999ZM30.4653 19.3867C29.7053 19.0999 28.602 18.7999 27.262 18.7999C24.0267 18.7999 21.7253 20.5133 21.7033 22.9619C21.682 24.7467 23.342 25.7353 24.614 26.3467C25.9193 26.9733 26.342 27.3867 26.342 27.9476C26.3353 28.8133 25.2867 29.2133 24.3153 29.2133C22.9873 29.2133 22.2833 29.0133 21.1433 28.5619L20.722 28.3553L20.262 31.0133C21.1573 31.3867 22.8753 31.7133 24.6553 31.7267C28.082 31.7267 30.342 30.0399 30.3663 27.4076C30.3793 26.0133 29.482 24.9476 27.522 24.0133C26.3433 23.4399 25.6267 23.0399 25.6267 22.4533C25.6333 21.9219 26.2353 21.3619 27.5673 21.3619C28.6673 21.3476 29.4753 21.6133 30.0887 21.8867L30.3967 22.0133L30.8433 19.4533L30.4653 19.3867ZM36.602 19.0999H34.0553C33.2953 19.0999 32.7353 19.2999 32.3887 19.9619L27.8753 28.8999H31.2953C31.2953 28.8999 31.8353 27.4733 31.9353 27.2133H35.5653C35.642 27.5399 35.9353 28.8999 35.9353 28.8999H39.0007L36.602 19.0999ZM32.8953 24.9219C33.0953 24.3999 33.9153 22.3019 33.9153 22.3019C33.9073 22.3219 34.1153 21.7619 34.242 21.4219L34.4153 22.2019C34.4153 22.2019 34.9087 24.4133 35.0087 24.9219H32.8953Z" fill="#00579F"/>
                      <path d="M16.8667 19.0999L13.6667 25.7066L13.3333 24.1733C12.7733 22.4199 11.0667 20.5333 9.14667 19.5733L12.0533 28.8866H15.5L20.4333 19.0999H16.8667Z" fill="#00579F"/>
                      <path d="M11.5333 19.0999H6.71998L6.66665 19.3666C10.22 20.1666 12.6667 21.9666 13.3333 24.1733L12.1467 19.9733C11.9733 19.2733 11.82 19.1133 11.5333 19.0999Z" fill="#FAA61A"/>
                    </svg>
                  )}
                  {card.type === 'Mastercard' && (
                    <svg className="h-full w-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4C35.0457 4 44 12.9543 44 24Z" fill="white"/>
                      <path d="M24 32C28.4183 32 32 28.4183 32 24C32 19.5817 28.4183 16 24 16C19.5817 16 16 19.5817 16 24C16 28.4183 19.5817 32 24 32Z" fill="#F26122"/>
                      <path d="M24 16C21.25 16 18.75 17.2 17 19.15C17.7879 18.3669 18.7373 17.7461 19.7868 17.3297C20.8362 16.9133 21.9625 16.7099 23.1 16.7333C24.2224 16.7129 25.3375 16.9179 26.371 17.3345C27.4045 17.7511 28.3368 18.3703 29.1047 19.1491C29.8726 19.9279 30.4785 20.8686 30.8806 21.9076C31.2827 22.9467 31.4721 24.0645 31.4367 25.1867C31.41 26.3242 31.2066 27.4505 30.7902 28.5C30.3738 29.5494 29.7531 30.4988 28.97 31.2867C30.92 29.5333 32.12 27.0333 32.12 24.0333C32.12 21.0333 30.9433 18.5333 29 16.75C27.6162 16.2518 26.115 16.0027 24.6033 16.0267C24.4033 16.0267 24.2033 16.0267 24 16.0267V16Z" fill="#EA1D25"/>
                      <path d="M16 24C16 27.0333 17.1767 29.5333 19.1233 31.3167C20.5103 31.8213 22.0168 32.0654 23.5333 32.0333C23.7333 32.0333 23.9333 32.0333 24.1333 32.0333C26.9367 32.0333 29.45 30.85 31.2 28.95C30.4083 29.7333 29.455 30.3538 28.4015 30.7683C27.348 31.1828 26.2173 31.3827 25.0833 31.3533C23.9609 31.3737 22.8458 31.1687 21.8123 30.7521C20.7789 30.3356 19.8465 29.7164 19.0786 28.9376C18.3107 28.1588 17.7048 27.2181 17.3027 26.1791C16.9007 25.14 16.7112 24.0222 16.7467 22.9C16.7733 21.7625 16.9767 20.6362 17.3932 19.5868C17.8096 18.5373 18.4303 17.5879 19.2133 16.8C17.2733 18.5533 16 21.05 16 24Z" fill="#F69E1E"/>
                    </svg>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm opacity-80">Número de tarjeta</p>
                <p className="font-mono">•••• •••• •••• {card.lastFour}</p>
              </div>
              
              <div className="flex justify-between">
                <div>
                  <p className="text-xs opacity-80">TITULAR</p>
                  <p className="text-sm">{card.cardholderName}</p>
                </div>
                <div>
                  <p className="text-xs opacity-80">VENCE</p>
                  <p className="text-sm">{card.expiryMonth}/{card.expiryYear}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Tarjeta para añadir nueva */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={handleAddCardClick}
            style={{ minHeight: '180px' }}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Añadir tarjeta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPage;