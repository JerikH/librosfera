import React, { useState, useEffect } from 'react';

const BookEditor = ({ book, onSave, onCancel, mode = 'add' }) => {
  const isEditMode = mode === 'edit';
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    año: '',
    genero: '',
    paginas: '',
    issn: '',
    idioma: '',
    fecha: '',
    estado: 'Nuevo',
    precio: '',
    imagen: ''
  });
  const [currentImage, setCurrentImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  // Carga los datos del libro cuando estamos en modo edición
  useEffect(() => {
    if (isEditMode && book) {
      setFormData({
        titulo: book.title || '',
        autor: book.author || '',
        año: book.year || '',
        genero: book.genre || '',
        paginas: book.pages || '',
        issn: book.issn || '',
        idioma: book.language || '',
        fecha: book.publicationDate || '',
        estado: book.condition || 'Nuevo',
        precio: book.price ? book.price.toString() : '',
        imagen: book.image || ''
      });

      if (book.image) {
        setCurrentImage(book.image);
      }
    }
  }, [isEditMode, book]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Transformar datos si es necesario (como convertir precio a número)
    const processedData = {
      ...formData,
      precio: parseFloat(formData.precio),
      // Agregar otros campos procesados si es necesario
    };
    onSave(processedData);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentImage(e.target.result);
        // En una implementación real, aquí se manejaría la subida al servidor
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToGallery = () => {
    if (currentImage && !selectedImages.includes(currentImage)) {
      setSelectedImages([...selectedImages, currentImage]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        {isEditMode ? 'Editar Libro' : 'Agregar Libro'}
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Columna izquierda - Imagen del libro */}
        <div className="md:w-1/3">
          <div className="flex flex-col items-center">
            <div className="w-full h-80 bg-gray-200 border rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt="Portada del libro" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="w-24 h-24 mx-auto border-2 border-gray-400 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="mt-2 text-gray-500">Haga clic para agregar imagen</p>
                </div>
              )}
              
              {/* Botones de navegación */}
              <button className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Miniaturas */}
            <div className="flex space-x-2 mb-4">
              {[1, 2, 3].map((index) => (
                <div 
                  key={index}
                  className="w-16 h-16 border rounded bg-gray-200 flex items-center justify-center cursor-pointer"
                  onClick={() => {
                    if (selectedImages[index - 1]) {
                      setCurrentImage(selectedImages[index - 1]);
                    }
                  }}
                >
                  {selectedImages[index - 1] ? (
                    <img 
                      src={selectedImages[index - 1]} 
                      alt={`Miniatura ${index}`} 
                      className="max-w-full max-h-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            
            {/* Botones para gestionar imágenes */}
            <div className="flex justify-center space-x-2 w-full">
              <label className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">
                <span>Subir Imagen</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </label>
              <button 
                type="button"
                onClick={handleAddToGallery}
                className="bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300"
                disabled={!currentImage}
              >
                Añadir a Galería
              </button>
            </div>
          </div>
        </div>
        
        {/* Columna derecha - Formulario */}
        <div className="md:w-2/3">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
            Datos del Libro
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  name="titulo"
                  placeholder="Escriba el título del libro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                <input
                  type="text"
                  name="autor"
                  placeholder="Escriba el autor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.autor}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <input
                  type="text"
                  name="año"
                  placeholder="Escriba el año de publicación"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.año}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                <input
                  type="text"
                  name="genero"
                  placeholder="Escriba el género del libro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.genero}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Páginas</label>
                <input
                  type="number"
                  name="paginas"
                  placeholder="Escriba el número de páginas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.paginas}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">ISSN</label>
                <input
                  type="text"
                  name="issn"
                  placeholder="Escriba el código ISSN del libro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.issn}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                <input
                  type="text"
                  name="idioma"
                  placeholder="Escriba el idioma del libro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.idioma}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="text"
                  name="fecha"
                  placeholder="Escriba la fecha de publicación"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.fecha}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <input
                  type="text"
                  name="estado"
                  placeholder="Usado o Nuevo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.estado}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <input
                  type="number"
                  name="precio"
                  placeholder="Escriba el precio del libro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              >
                Regresar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isEditMode ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookEditor;