// src/controllers/libroController.js
const { libroService } = require('../../Database/services');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Obtener todos los libros con filtros y paginación
 * @route   GET /api/v1/libros
 * @access  Public
 */
const getLibros = catchAsync(async (req, res, next) => {
  // Extraer parámetros de consulta
  const {
    titulo, autor, editorial, genero, idioma, estado,
    precio_min, precio_max, anio_min, anio_max,
    solo_disponibles, incluir_inactivos,
    page = 1, limit = 10, sort = 'fecha_registro', order = 'desc'
  } = req.query;

  // Construir objeto de filtros
  const filtros = {
    titulo,
    autor,
    editorial,
    genero,
    idioma,
    estado,
    precio_min,
    precio_max,
    anio_min,
    anio_max,
    solo_disponibles: solo_disponibles === 'true'
  };

  // Solo usuarios administradores pueden ver libros inactivos
  const esAdmin = req.user && (req.user.tipo_usuario === 'administrador' || req.user.tipo_usuario === 'root');
  filtros.incluir_inactivos = esAdmin && incluir_inactivos === 'true';

  // Obtener libros con filtros y paginación
  const resultado = await libroService.listarLibros(
    filtros,
    parseInt(page),
    parseInt(limit),
    sort,
    order
  );

  // Devolver respuesta
  res.status(200).json({
    status: 'success',
    resultados: resultado.datos.length,
    paginacion: resultado.paginacion,
    data: resultado.datos
  });
});

/**
 * @desc    Obtener un libro por ID
 * @route   GET /api/v1/libros/:id
 * @access  Public
 */
const getLibroPorId = catchAsync(async (req, res, next) => {
  const libro = await libroService.obtenerLibroPorId(req.params.id);

  if (!libro) {
    return next(new AppError('Libro no encontrado', 404));
  }

  // Verificar si el libro está activo o si el usuario es administrador
  const esAdmin = req.user && (req.user.tipo_usuario === 'administrador' || req.user.tipo_usuario === 'root');
  if (!libro.activo && !esAdmin) {
    return next(new AppError('Libro no disponible', 404));
  }

  res.status(200).json({
    status: 'success',
    data: libro
  });
});

/**
 * @desc    Crear un nuevo libro
 * @route   POST /api/v1/libros
 * @access  Private/Admin
 */
const crearLibro = catchAsync(async (req, res, next) => {
  // Verificar permisos de administrador
  if (!req.user || (req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root')) {
    return next(new AppError('No tiene permisos para crear libros', 403));
  }

  // Validar campos obligatorios
  const {
    titulo, autor, editorial, genero, idioma,
    fecha_publicacion, anio_publicacion, numero_paginas,
    precio_info, precio, estado
  } = req.body;

  // Verificar campos obligatorios
  if (!titulo) {
    return next(new AppError('El título del libro es obligatorio', 400));
  }
  
  if (!autor || !Array.isArray(autor) || autor.length === 0) {
    return next(new AppError('Se requiere al menos un autor para el libro', 400));
  }
  
  if (!editorial) {
    return next(new AppError('La editorial es obligatoria', 400));
  }
  
  if (!genero) {
    return next(new AppError('El género del libro es obligatorio', 400));
  }
  
  if (!idioma) {
    return next(new AppError('El idioma del libro es obligatorio', 400));
  }
  
  if (!fecha_publicacion) {
    return next(new AppError('La fecha de publicación es obligatoria', 400));
  }
  
  if (!anio_publicacion) {
    return next(new AppError('El año de publicación es obligatorio', 400));
  }
  
  if (!numero_paginas) {
    return next(new AppError('El número de páginas es obligatorio', 400));
  }
  
  if (!precio && (!precio_info || !precio_info.precio_base)) {
    return next(new AppError('El precio del libro es obligatorio', 400));
  }
  
  if (!estado) {
    return next(new AppError('El estado del libro (nuevo/usado) es obligatorio', 400));
  }

  // Validaciones adicionales
  // Validar fecha de publicación
  try {
    new Date(fecha_publicacion);
  } catch (error) {
    return next(new AppError('Fecha de publicación inválida', 400));
  }

  // Validar año de publicación
  const anioActual = new Date().getFullYear();
  if (anio_publicacion < 1000 || anio_publicacion > anioActual) {
    return next(new AppError(`El año de publicación debe estar entre 1000 y ${anioActual}`, 400));
  }

  // Validar estado del libro
  if (!['nuevo', 'usado'].includes(estado)) {
    return next(new AppError('El estado del libro debe ser "nuevo" o "usado"', 400));
  }
  
  // Validar número de páginas
  if (numero_paginas <= 0) {
    return next(new AppError('El número de páginas debe ser mayor a cero', 400));
  }
  
  // Validar precio
  if (precio && precio <= 0) {
    return next(new AppError('El precio debe ser mayor a cero', 400));
  }
  
  // Verificar estructura de autor
  for (const autorItem of autor) {
    if (!autorItem.nombre || !autorItem.apellidos) {
      return next(new AppError('Cada autor debe tener nombre y apellidos', 400));
    }
  }
  
  // Si hay precio_info, validar estructura
  if (precio_info) {
    if (!precio_info.precio_base || precio_info.precio_base <= 0) {
      return next(new AppError('El precio base debe ser mayor a cero', 400));
    }
    
    if (precio_info.moneda && !['COP', 'USD', 'EUR'].includes(precio_info.moneda)) {
      return next(new AppError('Moneda no válida. Debe ser COP, USD o EUR', 400));
    }
  }

  // Crear libro con datos validados
  try {
    const nuevoLibro = await libroService.crearLibro(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Libro creado exitosamente',
      data: nuevoLibro
    });
  } catch (error) {
    return next(new AppError(`Error al crear libro: ${error.message}`, 400));
  }
});

/**
 * @desc    Actualizar un libro
 * @route   PUT /api/v1/libros/:id
 * @access  Private/Admin
 */
const actualizarLibro = catchAsync(async (req, res, next) => {
  // Verificar permisos de administrador
  if (!req.user || (req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root')) {
    return next(new AppError('No tiene permisos para actualizar libros', 403));
  }

  // Verificar que el libro existe
  const libroExistente = await libroService.obtenerLibroPorId(req.params.id);
  if (!libroExistente) {
    return next(new AppError('Libro no encontrado', 404));
  }

  // Validar campos que requieren validación específica
  if (req.body.anio_publicacion) {
    const anioActual = new Date().getFullYear();
    if (req.body.anio_publicacion < 1000 || req.body.anio_publicacion > anioActual) {
      return next(new AppError(`El año de publicación debe estar entre 1000 y ${anioActual}`, 400));
    }
  }

  if (req.body.estado && !['nuevo', 'usado'].includes(req.body.estado)) {
    return next(new AppError('El estado del libro debe ser "nuevo" o "usado"', 400));
  }

  if (req.body.fecha_publicacion) {
    try {
      new Date(req.body.fecha_publicacion);
    } catch (error) {
      return next(new AppError('Fecha de publicación inválida', 400));
    }
  }
  
  if (req.body.numero_paginas && req.body.numero_paginas <= 0) {
    return next(new AppError('El número de páginas debe ser mayor a cero', 400));
  }
  
  if (req.body.precio && req.body.precio <= 0) {
    return next(new AppError('El precio debe ser mayor a cero', 400));
  }
  
  // Validar estructura de autor si se proporciona
  if (req.body.autor) {
    if (!Array.isArray(req.body.autor)) {
      return next(new AppError('El campo autor debe ser un array', 400));
    }
    
    if (req.body.autor.length === 0) {
      return next(new AppError('Se requiere al menos un autor para el libro', 400));
    }
    
    for (const autorItem of req.body.autor) {
      if (!autorItem.nombre || !autorItem.apellidos) {
        return next(new AppError('Cada autor debe tener nombre y apellidos', 400));
      }
    }
  }
  
  // Validar precio_info si se proporciona
  if (req.body.precio_info) {
    if (req.body.precio_info.precio_base && req.body.precio_info.precio_base <= 0) {
      return next(new AppError('El precio base debe ser mayor a cero', 400));
    }
    
    if (req.body.precio_info.moneda && !['COP', 'USD', 'EUR'].includes(req.body.precio_info.moneda)) {
      return next(new AppError('Moneda no válida. Debe ser COP, USD o EUR', 400));
    }
  }

  // Actualizar libro con datos validados
  try {
    const libroActualizado = await libroService.actualizarLibro(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      message: 'Libro actualizado exitosamente',
      data: libroActualizado
    });
  } catch (error) {
    return next(new AppError(`Error al actualizar libro: ${error.message}`, 400));
  }
});

/**
 * @desc    Eliminar un libro (desactivación lógica)
 * @route   DELETE /api/v1/libros/:id
 * @access  Private/Admin
 */
const eliminarLibro = catchAsync(async (req, res, next) => {
  // Verificar permisos de administrador
  if (!req.user || (req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root')) {
    return next(new AppError('No tiene permisos para eliminar libros', 403));
  }

  // Verificar que el libro existe
  const libroExistente = await libroService.obtenerLibroPorId(req.params.id);
  if (!libroExistente) {
    return next(new AppError('Libro no encontrado', 404));
  }

  // Desactivar libro (eliminación lógica)
  await libroService.desactivarLibro(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Libro desactivado correctamente'
  });
});

/**
 * @desc    Eliminar un libro permanentemente
 * @route   DELETE /api/v1/libros/:id/permanente
 * @access  Private/Root
 */
const eliminarLibroPermanente = catchAsync(async (req, res, next) => {
  // Verificar permisos de usuario root
  if (!req.user || req.user.tipo_usuario !== 'root') {
    return next(new AppError('No tiene permisos para eliminar libros permanentemente', 403));
  }

  // Verificar que el libro existe
  const libroExistente = await libroService.obtenerLibroPorId(req.params.id);
  if (!libroExistente) {
    return next(new AppError('Libro no encontrado', 404));
  }

  // Eliminar libro permanentemente
  await libroService.eliminarLibroPermanente(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Libro eliminado permanentemente'
  });
});

/**
 * @desc    Agregar un ejemplar a un libro
 * @route   POST /api/v1/libros/:id/ejemplares
 * @access  Private/Admin
 */
const agregarEjemplar = catchAsync(async (req, res, next) => {
  // Verificar permisos de administrador
  if (!req.user || (req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root')) {
    return next(new AppError('No tiene permisos para agregar ejemplares', 403));
  }

  // Verificar que el código de ejemplar es obligatorio
  if (!req.body.codigo) {
    return next(new AppError('El código del ejemplar es obligatorio', 400));
  }
  
  // Sanear el código (no espacios, solo alfanuméricos)
  req.body.codigo = req.body.codigo.trim().replace(/[^a-zA-Z0-9-_]/g, '');
  
  if (req.body.codigo.length < 3) {
    return next(new AppError('El código del ejemplar debe tener al menos 3 caracteres', 400));
  }

  // Verificar que el código no esté en uso
  const codigoExistente = await libroService.verificarCodigoEjemplar(req.body.codigo);
  if (codigoExistente) {
    return next(new AppError('El código del ejemplar ya está en uso', 400));
  }
  
  // Validar estado físico si se proporciona
  if (req.body.estado_fisico && !['excelente', 'bueno', 'aceptable', 'deteriorado'].includes(req.body.estado_fisico)) {
    return next(new AppError('Estado físico no válido', 400));
  }

  // Agregar ejemplar
  try {
    const libroActualizado = await libroService.agregarEjemplar(req.params.id, req.body);

    res.status(201).json({
      status: 'success',
      message: 'Ejemplar agregado exitosamente',
      data: libroActualizado
    });
  } catch (error) {
    return next(new AppError(`Error al agregar ejemplar: ${error.message}`, 400));
  }
});

/**
 * @desc    Actualizar un ejemplar específico
 * @route   PUT /api/v1/libros/:id/ejemplares/:codigo
 * @access  Private/Admin
 */
const actualizarEjemplar = catchAsync(async (req, res, next) => {
  // Verificar permisos de administrador
  if (!req.user || (req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root')) {
    return next(new AppError('No tiene permisos para actualizar ejemplares', 403));
  }
  
  // Validar estado físico si se proporciona
  if (req.body.estado_fisico && !['excelente', 'bueno', 'aceptable', 'deteriorado'].includes(req.body.estado_fisico)) {
    return next(new AppError('Estado físico no válido', 400));
  }

  // Actualizar ejemplar
  try {
    const libroActualizado = await libroService.actualizarEjemplar(
      req.params.id,
      req.params.codigo,
      req.body
    );

    res.status(200).json({
      status: 'success',
      message: 'Ejemplar actualizado exitosamente',
      data: libroActualizado
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

/**
 * @desc    Eliminar un ejemplar específico
 * @route   DELETE /api/v1/libros/:id/ejemplares/:codigo
 * @access  Private/Admin
 */
const eliminarEjemplar = catchAsync(async (req, res, next) => {
  // Verificar permisos de administrador
  if (!req.user || (req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root')) {
    return next(new AppError('No tiene permisos para eliminar ejemplares', 403));
  }

  // Eliminar ejemplar
  try {
    const libroActualizado = await libroService.eliminarEjemplar(
      req.params.id,
      req.params.codigo
    );

    res.status(200).json({
      status: 'success',
      message: 'Ejemplar eliminado exitosamente',
      data: libroActualizado
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

/**
 * @desc    Agregar un descuento a un libro
 * @route   POST /api/v1/libros/:id/descuentos
 * @access  Private/Admin
 */
const agregarDescuento = catchAsync(async (req, res, next) => {
  // Verificar permisos de administrador
  if (!req.user || (req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root')) {
    return next(new AppError('No tiene permisos para agregar descuentos', 403));
  }

  // Validar campos obligatorios
  if (!req.body.tipo || !req.body.valor) {
    return next(new AppError('El tipo y valor del descuento son obligatorios', 400));
  }

  // Validar tipo de descuento
  if (!['porcentaje', 'valor_fijo', 'promocion_2x1', 'bundle'].includes(req.body.tipo)) {
    return next(new AppError('Tipo de descuento no válido', 400));
  }

  // Validar valor del descuento
  if (req.body.valor <= 0) {
    return next(new AppError('El valor del descuento debe ser positivo', 400));
  }

  // Si es porcentaje, validar que no sea mayor a 100
  if (req.body.tipo === 'porcentaje' && req.body.valor > 100) {
    return next(new AppError('El porcentaje de descuento no puede ser mayor a 100', 400));
  }

  // Validar fechas
  if (req.body.fecha_fin) {
    const fechaFin = new Date(req.body.fecha_fin);
    const hoy = new Date();
    
    if (fechaFin < hoy) {
      return next(new AppError('La fecha de fin del descuento no puede ser en el pasado', 400));
    }
  }

  // Agregar descuento
  try {
    const libroActualizado = await libroService.agregarDescuento(req.params.id, req.body);

    res.status(201).json({
      status: 'success',
      message: 'Descuento agregado exitosamente',
      data: libroActualizado
    });
  } catch (error) {
    return next(new AppError(`Error al agregar descuento: ${error.message}`, 400));
  }
});

/**
 * @desc    Desactivar todos los descuentos de un libro
 * @route   DELETE /api/v1/libros/:id/descuentos
 * @access  Private/Admin
 */
const desactivarDescuentos = catchAsync(async (req, res, next) => {
  // Verificar permisos de administrador
  if (!req.user || (req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root')) {
    return next(new AppError('No tiene permisos para desactivar descuentos', 403));
  }

  // Desactivar descuentos
  try {
    const libroActualizado = await libroService.desactivarDescuentos(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Descuentos desactivados exitosamente',
      data: libroActualizado
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

/**
 * @desc    Obtener libros con descuentos activos
 * @route   GET /api/v1/libros/descuentos
 * @access  Public
 */
const getLibrosConDescuento = catchAsync(async (req, res, next) => {
  const limite = parseInt(req.query.limit) || 20;
  
  const libros = await libroService.obtenerLibrosConDescuento(limite);

  res.status(200).json({
    status: 'success',
    resultados: libros.length,
    data: libros
  });
});

/**
 * @desc    Obtener libros destacados (mejor calificados)
 * @route   GET /api/v1/libros/destacados
 * @access  Public
 */
const getLibrosDestacados = catchAsync(async (req, res, next) => {
  const limite = parseInt(req.query.limit) || 10;
  
  const libros = await libroService.obtenerLibrosDestacados(limite);

  res.status(200).json({
    status: 'success',
    resultados: libros.length,
    data: libros
  });
});

/**
 * @desc    Añadir calificación a un libro
 * @route   POST /api/v1/libros/:id/calificacion
 * @access  Private
 */
const calificarLibro = catchAsync(async (req, res, next) => {
  // Verificar que el usuario esté autenticado
  if (!req.user) {
    return next(new AppError('Debe iniciar sesión para calificar un libro', 401));
  }

  // Validar calificación
  const calificacion = parseFloat(req.body.calificacion);
  if (isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
    return next(new AppError('La calificación debe ser un número entre 1 y 5', 400));
  }

  // Actualizar calificación
  try {
    const libroActualizado = await libroService.actualizarCalificacion(
      req.params.id,
      calificacion
    );

    res.status(200).json({
      status: 'success',
      message: 'Calificación registrada exitosamente',
      data: libroActualizado
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

/**
 * @desc    Buscar libros por texto
 * @route   GET /api/v1/libros/buscar
 * @access  Public
 */
const buscarLibros = catchAsync(async (req, res, next) => {
  const { q, limit } = req.query;
  const limite = parseInt(limit) || 20;
  
  if (!q) {
    return next(new AppError('Se requiere un término de búsqueda', 400));
  }

  const libros = await libroService.buscarPorTexto(q, limite);

  res.status(200).json({
    status: 'success',
    resultados: libros.length,
    data: libros
  });
});

/**
 * @desc    Marcar un libro como histórico agotado
 * @route   PATCH /api/v1/libros/:id/historico
 * @access  Private/Admin
 */
const marcarComoHistorico = catchAsync(async (req, res, next) => {
  // Verificar permisos de administrador
  if (!req.user || (req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root')) {
    return next(new AppError('No tiene permisos para marcar libros como históricos', 403));
  }

  // Verificar que el libro existe
  const libroExistente = await libroService.obtenerLibroPorId(req.params.id);
  if (!libroExistente) {
    return next(new AppError('Libro no encontrado', 404));
  }

  // Marcar como histórico
  try {
    const libroActualizado = await libroService.marcarComoHistoricoAgotado(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Libro marcado como histórico agotado',
      data: libroActualizado
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

module.exports = {
    getLibros,
    getLibroPorId,
    crearLibro,
    actualizarLibro,
    eliminarLibro,
    eliminarLibroPermanente,
    agregarEjemplar,
    actualizarEjemplar,
    eliminarEjemplar,
    agregarDescuento,
    desactivarDescuentos,
    getLibrosConDescuento,
    getLibrosDestacados,
    calificarLibro,
    buscarLibros,
    marcarComoHistorico
  };