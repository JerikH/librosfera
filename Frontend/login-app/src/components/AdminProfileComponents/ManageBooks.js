import React, { useState, useEffect } from 'react';
import BookEditor from './BookEditor';

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState('add'); // 'add', 'edit'

  useEffect(() => {
    // Simular carga de libros
    const fetchBooks = async () => {
      try {
        // Aquí iría una llamada API real para obtener libros
        // Simulamos una respuesta después de un segundo
        setTimeout(() => {
          const dummyBooks = [
            { 
              id: 1, 
              title: "Alice's Adventures in Wonderland", 
              author: "Lewis Carroll", 
              genre: "Drama, Terror", 
              price: 14200.00, 
              stock: 2, 
              discount: 60,
              image: '/book-alice.jpg' 
            },
            { 
              id: 2, 
              title: "Pride and Prejudice", 
              author: "Jane Austen", 
              genre: "Suspenso", 
              price: 14200.00, 
              stock: 1, 
              discount: 50,
              image: '/book-pride.jpg' 
            },
            { 
              id: 3, 
              title: "To Kill a Mockingbird", 
              author: "Harper Lee", 
              genre: "Comedia", 
              price: 14200.00, 
              stock: 10, 
              discount: 10,
              image: '/book-mockingbird.jpg' 
            },
            { 
              id: 4, 
              title: "The Adventures of Huckleberry Finn", 
              author: "Mark Twain", 
              genre: "Aventura, Suspenso", 
              price: 14200.00, 
              stock: 3, 
              discount: 0,
              image: '/book-huck.jpg' 
            },
          ];
          setBooks(dummyBooks);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error al cargar libros:', error);
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Filtrar libros por búsqueda
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar apertura del modal
  const openModal = (mode, book = null) => {
    setModalMode(mode);
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  // Manejar apertura del editor
  const openEditor = (mode, book = null) => {
    setEditorMode(mode);
    setSelectedBook(book);
    setShowEditor(true);
  };

  // Manejar cierre del editor
  const closeEditor = () => {
    setShowEditor(false);
    setSelectedBook(null);
  };

  // Guardar cambios del libro
  const saveBook = (bookData) => {
    // Aquí se implementaría la lógica para guardar en el backend
    if (editorMode === 'edit' && selectedBook) {
      // Actualizar libro existente
      const updatedBooks = books.map(book => 
        book.id === selectedBook.id ? { 
          ...book, 
          title: bookData.titulo,
          author: bookData.autor,
          genre: bookData.genero,
          price: bookData.precio,
          // Actualizar otros campos según sea necesario
        } : book
      );
      setBooks(updatedBooks);
    } else {
      // Agregar nuevo libro
      const newBook = {
        id: books.length + 1,
        title: bookData.titulo,
        author: bookData.autor,
        genre: bookData.genero,
        price: bookData.precio,
        stock: 0,
        discount: 0,
        image: '/placeholder-book.jpg'
      };
      setBooks([...books, newBook]);
    }
    closeEditor();
  };

  // Eliminar libro
  const deleteBook = (bookId) => {
    // Aquí iría la lógica para eliminar el libro (API call)
    console.log('Deleting book:', bookId);
    const updatedBooks = books.filter(book => book.id !== bookId);
    setBooks(updatedBooks);
    setIsModalOpen(false);
  };

  // Componente Modal para confirmar eliminación
  const DeleteConfirmationModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <span className="material-icons-outlined">close</span>
          </button>
          
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Eliminar Libro
          </h2>
          
          <p className="mb-6 text-gray-600">
            ¿Está seguro que desea eliminar el libro "{selectedBook?.title}"? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button 
              onClick={() => deleteBook(selectedBook?.id)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Función para obtener el color de la barra de descuento
  const getDiscountColor = (discount) => {
    if (discount >= 50) return 'bg-green-400';
    if (discount > 0) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  // Función para mostrar el ícono de libro
  const getBookIcon = (id) => {
    const icons = [
      <div key={1} className="text-indigo-500">
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5zM16 12h-7m0-4h7m-7 8h7"></path>
        </svg>
      </div>,
      <div key={2} className="text-gray-500">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      </div>,
      <div key={3} className="text-gray-700">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      </div>,
      <div key={4} className="text-cyan-500">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      </div>
    ];
    
    // Devolver un ícono basado en el ID (para que sea consistente)
    return icons[(id - 1) % icons.length];
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
      {/* Si el editor está abierto, mostrar el editor de libros */}
      {showEditor ? (
        <BookEditor 
          book={selectedBook}
          mode={editorMode}
          onSave={saveBook}
          onCancel={closeEditor}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Administrar Libros</h1>
            
            <div className="flex space-x-4">
              {/* Botón para añadir nuevo libro */}
              <button
                onClick={() => openEditor('add')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
              >
                <span className="material-icons-outlined mr-1">add</span>
                Añadir Libro
              </button>
              
              {/* Caja de búsqueda */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar Libro"
                  className="px-4 py-2 pr-10 border border-gray-300 rounded"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Table header */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="grid grid-cols-6 bg-gray-100 p-4 font-medium text-gray-700 border-b">
              <div className="col-span-1 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                </svg>
                Nombre
              </div>
              <div className="text-center">Unidades Disponibles</div>
              <div className="text-center">Precio</div>
              <div className="text-center">Genero</div>
              <div className="text-center">Descuento</div>
              <div className="text-center">Acciones</div> {/* Ahora centrado */}
            </div>

            {isLoading ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-700">Cargando libros...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">No se encontraron libros que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <div>
                {filteredBooks.map((book) => (
                  <div key={book.id} className="grid grid-cols-6 p-4 items-center border-b hover:bg-gray-50">
                    <div className="col-span-1 flex items-center">
                      {getBookIcon(book.id)}
                      <div className="ml-3">
                        <p className="font-medium">{book.title}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      {book.stock}
                    </div>
                    <div className="text-center">
                      $ {book.price.toLocaleString('es-AR')}
                    </div>
                    <div className="text-center">
                      {book.genre}
                    </div>
                    <div className="flex justify-center items-center">
                      <div className="w-24 h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getDiscountColor(book.discount)} text-xs flex items-center justify-center text-white`}
                          style={{ width: `${book.discount}%` }}
                        >
                          {book.discount}%
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center"> {/* Centrado horizontalmente */}
                      <button 
                        onClick={() => openEditor('edit', book)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <span className="material-icons-outlined">edit</span>
                      </button>
                      <button 
                        onClick={() => openModal('delete', book)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <span className="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Modal de confirmación de eliminación */}
          {isModalOpen && modalMode === 'delete' && <DeleteConfirmationModal />}
        </>
      )}
    </div>
  );
};

export default ManageBooks;