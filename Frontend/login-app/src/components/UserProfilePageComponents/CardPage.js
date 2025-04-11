import React from 'react';

const CardPage = () => {
  return (
    <div className="w-full p-6">
      <h2 className="text-2xl font-bold mb-6">Agregar o Editar Tarjeta</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 mb-6">Información de pago</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nombre en la tarjeta</label>
            <input type="text" className="w-full border border-gray-300 rounded-md py-2 px-3" placeholder="Juan Esteban" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Número de tarjeta</label>
            <input type="text" className="w-full border border-gray-300 rounded-md py-2 px-3" placeholder="**** **** **** 1234" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Fecha de vencimiento</label>
              <input type="text" className="w-full border border-gray-300 rounded-md py-2 px-3" placeholder="MM/AA" />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">CVV</label>
              <input type="text" className="w-full border border-gray-300 rounded-md py-2 px-3" placeholder="123" />
            </div>
          </div>
        </div>
        
        <button className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
          Guardar información
        </button>
      </div>
    </div>
  );
};

export default CardPage;