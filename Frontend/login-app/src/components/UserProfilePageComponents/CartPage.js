import React from 'react';
import { BookOpen } from 'lucide-react';

const CartPage = () => {
  return (
    <div className="w-full p-6">
      <h2 className="text-2xl font-bold mb-6">Carrito de Compras</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 mb-4">Productos en tu carrito</p>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-12 h-16 bg-blue-100 border border-blue-200 flex justify-center items-center mr-3">
                  <BookOpen size={18} className="text-blue-800" />
                </div>
                <div>
                  <p className="font-medium">Libro 7</p>
                  <p className="text-sm text-gray-500">Autor: Carlos Ruiz Zafón</p>
                </div>
              </div>
              <p className="font-bold">$ 18,500.00</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-between border-t pt-4">
          <p className="text-lg font-medium">Total</p>
          <p className="text-lg font-bold">$ 18,500.00</p>
        </div>
        <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
          Proceder al pago
        </button>
      </div>
    </div>
  );
};

export default CartPage;