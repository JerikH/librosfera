import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookEditor = ({ book, onSave, onCancel, id, mode = 'add' }) => {
  const isEditMode = mode === 'edit';
  console.log(book);
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    editorial: '',
    año: '',
    genero: '',
    paginas: '',
    issn: '',
    idioma: '',
    fecha: '',
    estado: 'Nuevo',
    precio: '',
    imagen: '',
    descripcion: '',
    stock: 1
  });
  
  const [bookImages, setBookImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [languageQuery, setLanguageQuery] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Get authentication token from cookies
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // Get auth token from cookie
  const getAuthToken = () => {
    const authCookie = getCookie('authToken');
    if (authCookie) {
      try {
        const parsedCookie = JSON.parse(authCookie);
        return parsedCookie.authToken || parsedCookie.token || '';
      } catch (e) {
        return authCookie;
      }
    }
    return '';
  };

  // Fetch languages from API
  useEffect(() => {
    const loadLanguages = () => {
      setIsLoadingLanguages(true);
      
      // Lista completa de idiomas en español
      const allLanguages = [
        'Afrikáans', 'Albanés', 'Amhárico', 'Árabe', 'Armenio', 'Azerbaiyano',
        'Vasco', 'Bielorruso', 'Bengalí', 'Bosnio', 'Búlgaro', 'Birmano',
        'Catalán', 'Cebuano', 'Chichewa', 'Chino (Simplificado)', 'Chino (Tradicional)',
        'Corso', 'Croata', 'Checo', 'Danés', 'Neerlandés', 'Inglés', 'Esperanto',
        'Estonio', 'Filipino', 'Finlandés', 'Francés', 'Frisón', 'Gallego', 'Georgiano',
        'Alemán', 'Griego', 'Gujarati', 'Criollo Haitiano', 'Hausa', 'Hawaiano', 'Hebreo',
        'Hindi', 'Hmong', 'Húngaro', 'Islandés', 'Igbo', 'Indonesio', 'Irlandés',
        'Italiano', 'Japonés', 'Javanés', 'Canarés', 'Kazajo', 'Jemer', 'Coreano',
        'Kurdo', 'Kirguís', 'Lao', 'Latín', 'Letón', 'Lituano', 'Luxemburgués',
        'Macedonio', 'Malgache', 'Malayo', 'Malayalam', 'Maltés', 'Maorí', 'Marathi',
        'Mongol', 'Nepalí', 'Noruego', 'Pastún', 'Persa', 'Polaco', 'Portugués',
        'Punjabí', 'Rumano', 'Ruso', 'Samoano', 'Gaélico Escocés', 'Serbio', 'Sesotho',
        'Shona', 'Sindhi', 'Cingalés', 'Eslovaco', 'Esloveno', 'Somalí', 'Español',
        'Sundanés', 'Suajili', 'Sueco', 'Tayiko', 'Tamil', 'Telugu', 'Tailandés', 'Turco',
        'Ucraniano', 'Urdu', 'Uzbeko', 'Vietnamita', 'Galés', 'Xhosa', 'Yidis',
        'Yoruba', 'Zulú'
      ];
      
      setLanguages(allLanguages);
      setIsLoadingLanguages(false);
    };
    
    loadLanguages();
  }, []);
  
  // Filter languages based on user input
  const filteredLanguages = languages.filter(lang => 
    lang.toLowerCase().includes(languageQuery.toLowerCase())
  );

  // Carga los datos del libro cuando estamos en modo edición
  useEffect(() => {
    if (isEditMode && book) {
      setFormData({
        titulo: book.title || '',
        autor: book.author || '',
        editorial: book.editorial || '',
        año: book.year || '',
        genero: book.genre || '',
        paginas: book.pages || '',
        issn: book.issn || '',
        idioma: book.language || '',
        fecha: book.publicationDate ? formatDateForInput(book.publicationDate) : '',
        estado: book.condition || 'Nuevo',
        precio: book.price ? book.price.toString() : '',
        imagen: book.image || '',
        descripcion: book.description || '',
        stock: book.stock || 1
      });

      if (book.image) {
        setBookImages([{ url: book.image, file: null, type: 'portada', alt: book.title }]);
      }
      
      // Si hay imágenes adicionales, cargarlas también
      if (book.additionalImages && book.additionalImages.length > 0) {
        const additionalBookImages = book.additionalImages.map(img => ({
          url: img.url,
          file: null,
          type: 'galeria',
          alt: book.title
        }));
        
        setBookImages([...bookImages, ...additionalBookImages]);
      }
    }
  }, [isEditMode, book]);

  // Format date for the date input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLanguageInputChange = (e) => {
    setLanguageQuery(e.target.value);
    setFormData({
      ...formData,
      idioma: e.target.value
    });
    setShowLanguageDropdown(true);
  };

  const selectLanguage = (language) => {
    setFormData({
      ...formData,
      idioma: language
    });
    setLanguageQuery(language);
    setShowLanguageDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get the auth token from cookies
      const dataCookie = getCookie("data");
      const parsedData = JSON.parse(dataCookie);
      const token = parsedData.authToken;
      
      // Format the data for API submission
      const apiData = {
        titulo: formData.titulo,
        autor: [{
          nombre: formData.autor.split(' ')[0] || '',
          apellidos: formData.autor.split(' ').slice(1).join(' ') || 'a',
          nacionalidad: 'd',
          biografia: 'f',
          fechas: {
            nacimiento: null,
            fallecimiento: null
          },
          referencias: {
            wikipedia: ''
          }
        }],
        editorial: formData.editorial,
        genero: formData.genero,
        idioma: formData.idioma,
        fecha_publicacion: formData.fecha,
        anio_publicacion: parseInt(formData.año) || null,
        numero_paginas: parseInt(formData.paginas) || null,
        precio_info: {
          precio_base: parseFloat(formData.precio) || 0,
          moneda: 'COP',
          impuesto: {
            tipo: 'IVA',
            porcentaje: 19
          },
          envio_gratis: true
        },
        precio: parseFloat(formData.precio) || 0,
        estado: formData.estado.toLowerCase(),
        stock: parseInt(formData.stock) || 1,
        descripcion: formData.descripcion || '',
        tabla_contenido: '',
        palabras_clave: [formData.genero.toLowerCase()],
        edicion: {
          numero: 1,
          descripcion: 'Primera edición'
        }
      };

      const method = isEditMode ? 'put' : 'post';
      
      let response;
      if (isEditMode){
        response = await axios.put(`http://localhost:5000/api/v1/libros/${(book.id)}`, apiData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${String(token)}`
          }
        });
      }else{
        response = await axios.post('http://localhost:5000/api/v1/libros', apiData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${String(token)}`
          }
        });
      }

      
      

      // If successful, upload the images
      // if (response.data.data.id_libro) {
      //   const bookId = response.data.data._id;
        
      //   // Upload images, considering the first one as the main cover
      //   for (let i = 0; i < bookImages.length; i++) {
      //     const image = bookImages[i];
      //     if (image.file) {
      //       const formData = new FormData();
      //       formData.append('imagen', image.file);
      //       formData.append('tipo', i === 0 ? 'portada' : 'galeria'); // First image is always the cover
      //       formData.append('orden', i);
      //       formData.append('alt_text', `${formData.titulo} - ${i === 0 ? 'Portada' : `Imagen ${i+1}`}`);
            
      //       await axios.post(
      //         `http://localhost:5000/api/v1/libros/${bookId}/imagenes`,
      //         formData,
      //         {
      //           headers: {
      //             'Content-Type': 'multipart/form-data',
      //             'Authorization': `Bearer ${String(token)}`
      //           }
      //         }
      //       );
      //     }
      //   }
        
      //   // Call onSave callback after successful book creation and image uploads
      //   // if (onSave) {
      //   //   onSave(response.data.data);
      //   // }
      // }

      onCancel();
    } catch (error) {
      console.error('Error submitting book:', error);
      alert('Error al guardar el libro. Por favor intente nuevamente.');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // If there are no images, the first upload will be the cover
      const isFirstImage = bookImages.length === 0;
      
      const newImages = files.map((file, idx) => {
        return {
          url: URL.createObjectURL(file),
          file: file,
          // Only the first image uploaded when there are no images will be the cover
          type: isFirstImage && idx === 0 ? 'portada' : 'galeria',
          alt: formData.titulo || 'Libro'
        };
      });
      
      setBookImages([...bookImages, ...newImages]);
      setCurrentImageIndex(bookImages.length); // Set to view the first new image
    }
  };

  const handlePrevImage = () => {
    if (bookImages.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? bookImages.length - 1 : prevIndex - 1
      );
    }
  };

  const handleNextImage = () => {
    if (bookImages.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === bookImages.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // Drag and drop functions
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      // Check if we are moving the cover or trying to make another image the cover
      const isMovingCover = draggedIndex === 0;
      const isBecomingCover = index === 0;
      
      // Reorder the images
      const newImages = [...bookImages];
      const draggedImage = newImages[draggedIndex];
      
      // Remove the dragged item
      newImages.splice(draggedIndex, 1);
      
      // Insert at the new position
      newImages.splice(index, 0, draggedImage);
      
      // Update image types (first is always cover)
      newImages[0].type = 'portada';
      for (let i = 1; i < newImages.length; i++) {
        newImages[i].type = 'galeria';
      }
      
      // Update the state
      setBookImages(newImages);
      setDraggedIndex(index);
      
      // Update the current image index if needed
      if (currentImageIndex === draggedIndex) {
        setCurrentImageIndex(index);
      } else if (currentImageIndex === index) {
        setCurrentImageIndex(draggedIndex);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const removeImage = (index) => {
    const newImages = [...bookImages];
    newImages.splice(index, 1);
    
    // If we removed all images, just clear the array
    if (newImages.length === 0) {
      setBookImages([]);
      setCurrentImageIndex(0);
      return;
    }
    
    // If we removed the cover image, make the first remaining image the new cover
    if (index === 0) {
      newImages[0].type = 'portada';
    }
    
    setBookImages(newImages);
    
    // Update current image index if needed
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(newImages.length - 1);
    } else if (currentImageIndex === index) {
      setCurrentImageIndex(Math.max(0, currentImageIndex - 1));
    }
  };

  // Display max 3 thumbnails
  const displayThumbnails = () => {
    return Array(3).fill(0).map((_, index) => {
      const imageIndex = (index + 1) % bookImages.length;
      const image = bookImages[imageIndex] || null;
      
      return (
        <div 
          key={index}
          className={`w-16 h-16 border rounded ${image ? 'bg-white' : 'bg-gray-200'} flex items-center justify-center cursor-pointer ${draggedIndex === imageIndex ? 'opacity-50' : ''}`}
          onClick={() => {
            if (image) {
              setCurrentImageIndex(imageIndex);
            }
          }}
          draggable={image !== null}
          onDragStart={() => image && handleDragStart(imageIndex)}
          onDragOver={(e) => image && handleDragOver(e, imageIndex)}
          onDragEnd={handleDragEnd}
        >
          {image ? (
            <div className="relative w-full h-full">
              <img 
                src={image.url} 
                alt={`Miniatura ${index + 1}`} 
                className="max-w-full max-h-full object-cover"
              />
              <button 
                type="button"
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(imageIndex);
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </div>
      );
    });
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
            <div 
              className="w-full h-80 bg-gray-200 border rounded-lg flex items-center justify-center mb-4 relative overflow-hidden"
              draggable={bookImages.length > 0}
              onDragStart={() => handleDragStart(currentImageIndex)}
              onDragOver={(e) => handleDragOver(e, currentImageIndex)}
              onDragEnd={handleDragEnd}
            >
              {bookImages.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={bookImages[currentImageIndex].url} 
                    alt="Portada del libro" 
                    className="max-w-full max-h-full object-contain"
                  />
                  <button 
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(currentImageIndex);
                    }}
                  >
                    ×
                  </button>
                </div>
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
              {bookImages.length > 1 && (
                <>
                  <button 
                    type="button"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-100"
                    onClick={handlePrevImage}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-100"
                    onClick={handleNextImage}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            {/* Miniaturas */}
            <div className="flex space-x-2 mb-4">
              {bookImages.length > 1 ? displayThumbnails() : (
                Array(3).fill(0).map((_, index) => (
                  <div 
                    key={index}
                    className="w-16 h-16 border rounded bg-gray-200 flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                ))
              )}
            </div>
            
            {/* Botones para gestionar imágenes */}
            <div className="flex justify-center space-x-2 w-full">
              <label className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">
                <span>Subir Imágenes</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  multiple
                />
              </label>
              <button 
                type="button"
                onClick={() => setBookImages([])}
                className="bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300"
                disabled={bookImages.length === 0}
              >
                Eliminar Todo
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Arrastre y suelte para reordenar las imágenes. La primera imagen será la portada principal.
            </p>
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
              
              {/* Nueva campo Editorial */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Editorial</label>
                <input
                  type="text"
                  name="editorial"
                  placeholder="Escriba la editorial"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.editorial}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <input
                  type="number"
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
              
              {/* Campo Páginas modificado */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de páginas</label>
                <input
                  type="number"
                  name="paginas"
                  placeholder="Escriba el número de páginas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.paginas}
                  onChange={handleChange}
                  min="1"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN/ISSN</label>
                <input
                  type="text"
                  name="issn"
                  placeholder="Escriba el código ISBN/ISSN del libro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.issn}
                  onChange={handleChange}
                />
              </div>
              
              {/* Campo Idioma mejorado con dropdown */}
              <div className="form-group relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                <input
                  type="text"
                  name="idioma"
                  placeholder="Escriba el idioma del libro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={languageQuery}
                  onChange={handleLanguageInputChange}
                  onFocus={() => setShowLanguageDropdown(true)}
                  autoComplete="off"
                />
                {showLanguageDropdown && (
                  <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
                    {isLoadingLanguages ? (
                      <div className="p-2 text-center text-gray-500">Cargando idiomas...</div>
                    ) : filteredLanguages.length > 0 ? (
                      filteredLanguages.map((lang, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => selectLanguage(lang)}
                        >
                          {lang}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-gray-500">No se encontraron resultados</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Campo Fecha mejorado con formato de fecha */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de publicación</label>
                <input
                  type="date"
                  name="fecha"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.fecha}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  name="estado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.estado}
                  onChange={handleChange}
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="Usado">Usado</option>
                  <option value="Deteriorado">Deteriorado</option>
                </select>
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
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  name="stock"
                  placeholder="Cantidad disponible"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
            
            {/* Campo Descripción (full width) */}
            <div className="form-group mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                placeholder="Escriba una descripción del libro"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
              />
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