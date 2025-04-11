import React from 'react';

const PurchasesPage = () => {
  return (
    <div className="w-full p-6">
      <h2 className="text-2xl font-bold mb-6">Mis Compras</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 mb-4">Historial de tus compras recientes</p>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Libro 5</p>
                <p className="text-sm text-gray-500">Comprado el 15 de marzo, 2025</p>
              </div>
              <p className="font-bold">$ 14,200.00</p>
            </div>
          </div>
          <div className="border-b pb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Libro 4</p>
                <p className="text-sm text-gray-500">Comprado el 2 de marzo, 2025</p>
              </div>
              <p className="font-bold">$ 12,999.00</p>
            </div>
          </div>
          <div className="border-b pb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Libro 3</p>
                <p className="text-sm text-gray-500">Comprado el 15 de febrero, 2025</p>
              </div>
              <p className="font-bold">$ 9,500.00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasesPage;