// Database/services/libroService.js
const mongoose = require('mongoose');
const Libro = require('../models/libroModel');

/**
 * Servicio de libro - Encapsula la lógica de negocio y acceso a datos para libros
 * Proporciona métodos para todas las operaciones relacionadas con libros en la aplicación
 */
const libroService = {
  /**
   * Busca un libro por su ID o id_libro
   * @param {String} id - ID o id_libro del libro
   * @returns {Promise<Object>} Datos del libro encontrado
   */
  async obtenerLibroPorId(id) {
    try {
      let libro;
      
      // Verificar si es un ObjectId válido
      if (mongoose.Types.ObjectId.isValid(id)) {
        libro = await Libro.findById(id);
      } else {
        // Intentar buscar por id_libro
        libro = await Libro.findOne({ id_libro: id });
      }
      
      return libro;
    } catch (error) {
      console.error('Error obteniendo libro por ID:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo libro
   * @param {Object} libroData - Datos del libro
   * @returns {Promise<Object>} Libro creado
   */
  async crearLibro(libroData) {
    try {
      // Si no se proporciona id_libro, se generará automáticamente
      if (!libroData.id_libro) {
        libroData.id_libro = `LIB${Date.now().toString().slice(-10)}`;
      }
      
      // Crear autor_nombre_completo si existe autor
      if (libroData.autor && libroData.autor.length > 0) {
        const primerAutor = libroData.autor[0];
        libroData.autor_nombre_completo = `${primerAutor.nombre} ${primerAutor.apellidos}`;
      }
      
      // Crear nuevo libro
      const nuevoLibro = new Libro(libroData);
      
      // Guardar en la base de datos
      await nuevoLibro.save();
      
      return nuevoLibro;
    } catch (error) {
      console.error('Error creando libro:', error);
      throw error;
    }
  },

  /**
   * Actualiza un libro existente
   * @param {String} id - ID o id_libro del libro
   * @param {Object} libroData - Datos actualizados del libro
   * @returns {Promise<Object>} Libro actualizado
   */
  async actualizarLibro(id, libroData) {
    try {
      let libro = await this.obtenerLibroPorId(id);
      
      if (!libro) {
        throw new Error('Libro no encontrado');
      }

      // Actualizar campos
      Object.keys(libroData).forEach(campo => {
        // Manejo especial para campos anidados
        if (campo === 'precio_info' && libroData.precio_info) {
          // Actualizar precio base si se proporciona
          if (libroData.precio_info.precio_base) {
            libro.precio_info.precio_base = libroData.precio_info.precio_base;
          }
          
          // Actualizar moneda si se proporciona
          if (libroData.precio_info.moneda) {
            libro.precio_info.moneda = libroData.precio_info.moneda;
          }
          
          // Actualizar impuesto si se proporciona
          if (libroData.precio_info.impuesto) {
            libro.precio_info.impuesto = {
              ...libro.precio_info.impuesto,
              ...libroData.precio_info.impuesto
            };
          }
          
          // Actualizar envío gratis si se proporciona
          if (libroData.precio_info.envio_gratis !== undefined) {
            libro.precio_info.envio_gratis = libroData.precio_info.envio_gratis;
          }
          
          // Manejar descuentos si se proporcionan
          if (libroData.precio_info.descuentos) {
            libro.precio_info.descuentos = libroData.precio_info.descuentos;
          }
        } 
        // Manejo especial para autores
        else if (campo === 'autor' && libroData.autor) {
          libro.autor = libroData.autor;
          // Actualizar autor_nombre_completo para facilitar búsquedas
          if (libroData.autor.length > 0) {
            const primerAutor = libroData.autor[0];
            libro.autor_nombre_completo = `${primerAutor.nombre} ${primerAutor.apellidos}`;
          }
        }
        // Manejo especial para imágenes
        else if (campo === 'imagenes' && libroData.imagenes) {
          libro.imagenes = {
            ...libro.imagenes,
            ...libroData.imagenes
          };
        }
        // Manejo especial para ejemplares
        else if (campo === 'ejemplares' && libroData.ejemplares) {
          libro.ejemplares = libroData.ejemplares;
          // Actualizar stock basado en ejemplares
          libro.stock = libroData.ejemplares.length;
        }
        // Campos simples
        else if (campo !== '_id' && campo !== 'fecha_registro') {
          libro[campo] = libroData[campo];
        }
      });
      
      // Actualizar fecha de última actualización
      libro.ultima_actualizacion = new Date();
      
      // Guardar cambios
      await libro.save();
      
      return libro;
    } catch (error) {
      console.error('Error actualizando libro:', error);
      throw error;
    }
  },

  /**
   * Desactiva un libro (eliminación lógica)
   * @param {String} id - ID o id_libro del libro
   * @returns {Promise<Boolean>} True si se desactivó correctamente
   */
  async desactivarLibro(id) {
    try {
      const libro = await this.obtenerLibroPorId(id);
      
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      // Desactivación lógica
      libro.activo = false;
      libro.ultima_actualizacion = new Date();
      
      await libro.save();
      
      return true;
    } catch (error) {
      console.error('Error desactivando libro:', error);
      throw error;
    }
  },
  
  /**
   * Elimina un libro de forma permanente
   * @param {String} id - ID o id_libro del libro
   * @returns {Promise<Boolean>} True si se eliminó correctamente
   */
  async eliminarLibroPermanente(id) {
    try {
      let resultado;
      
      // Eliminar el libro por id o id_libro
      if (mongoose.Types.ObjectId.isValid(id)) {
        resultado = await Libro.findByIdAndDelete(id);
      } else {
        resultado = await Libro.findOneAndDelete({ id_libro: id });
      }
      
      if (!resultado) {
        throw new Error('Libro no encontrado');
      }
      
      return true;
    } catch (error) {
      console.error('Error eliminando libro permanentemente:', error);
      throw error;
    }
  },
  
  /**
   * Listar libros con filtros y paginación
   * @param {Object} filtros - Filtros para la búsqueda
   * @param {Number} pagina - Número de página
   * @param {Number} limite - Cantidad de resultados por página
   * @param {String} ordenarPor - Campo por el cual ordenar
   * @param {String} orden - Ascendente (asc) o descendente (desc)
   * @returns {Promise<Object>} Datos paginados de libros
   */
  async listarLibros(filtros = {}, pagina = 1, limite = 10, ordenarPor = 'fecha_registro', orden = 'desc') {
    try {
      // Construir el objeto de consulta
      const consulta = {};
      
      // Aplicar filtros
      if (filtros.titulo) {
        consulta.titulo = { $regex: filtros.titulo, $options: 'i' };
      }
      
      if (filtros.autor) {
        consulta.autor_nombre_completo = { $regex: filtros.autor, $options: 'i' };
      }
      
      if (filtros.editorial) {
        consulta.editorial = { $regex: filtros.editorial, $options: 'i' };
      }
      
      if (filtros.genero) {
        consulta.genero = { $regex: filtros.genero, $options: 'i' };
      }
      
      if (filtros.idioma) {
        consulta.idioma = filtros.idioma;
      }
      
      if (filtros.estado) {
        consulta.estado = filtros.estado;
      }

      // Filtro por rango de precio
      if (filtros.precio_min || filtros.precio_max) {
        consulta.precio = {};
        if (filtros.precio_min) consulta.precio.$gte = parseFloat(filtros.precio_min);
        if (filtros.precio_max) consulta.precio.$lte = parseFloat(filtros.precio_max);
      }
      
      // Filtro por rango de año de publicación
      if (filtros.anio_min || filtros.anio_max) {
        consulta.anio_publicacion = {};
        if (filtros.anio_min) consulta.anio_publicacion.$gte = parseInt(filtros.anio_min);
        if (filtros.anio_max) consulta.anio_publicacion.$lte = parseInt(filtros.anio_max);
      }
      
      // Filtrar solo libros con stock disponible
      if (filtros.solo_disponibles) {
        consulta.stock = { $gt: 0 };
      }
      
      // Por defecto, mostrar solo libros activos a menos que se indique lo contrario
      if (filtros.incluir_inactivos !== true) {
        consulta.activo = true;
      }
      
      // Calcular índice para paginación
      const skip = (pagina - 1) * limite;
      
      // Configurar ordenamiento
      const ordenConfig = {};
      ordenConfig[ordenarPor] = orden === 'asc' ? 1 : -1;
      
      // Contar total de resultados para la paginación
      const total = await Libro.countDocuments(consulta);
      
      // Obtener libros filtrados y paginados
      const libros = await Libro.find(consulta)
        .skip(skip)
        .limit(limite)
        .sort(ordenConfig);
      
      // Calcular el total de páginas
      const totalPaginas = Math.ceil(total / limite) || 1;
      
      // Devolver resultados con metadatos de paginación
      return {
        datos: libros,
        paginacion: {
          total,
          pagina,
          limite,
          totalPaginas
        }
      };
    } catch (error) {
      console.error('Error listando libros:', error);
      throw error;
    }
  },
  
  /**
   * Agregar un nuevo ejemplar al libro
   * @param {String} id - ID o id_libro del libro
   * @param {Object} ejemplarData - Datos del ejemplar a agregar
   * @returns {Promise<Object>} Libro actualizado con el nuevo ejemplar
   */
  async agregarEjemplar(id, ejemplarData) {
    try {
      const libro = await this.obtenerLibroPorId(id);
      
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      // Verificar que el código de ejemplar no esté duplicado
      const ejemplarExistente = libro.ejemplares.find(e => e.codigo === ejemplarData.codigo);
      if (ejemplarExistente) {
        throw new Error('Ya existe un ejemplar con ese código');
      }
      
      // Agregar nuevo ejemplar
      libro.ejemplares.push({
        codigo: ejemplarData.codigo,
        estado_fisico: ejemplarData.estado_fisico || 'excelente',
        ubicacion: ejemplarData.ubicacion || '',
        disponible: ejemplarData.disponible !== false,
        fecha_adquisicion: ejemplarData.fecha_adquisicion || new Date()
      });
      
      // Actualizar stock total
      libro.stock = libro.ejemplares.length;
      
      // Guardar cambios
      await libro.save();
      
      return libro;
    } catch (error) {
      console.error('Error agregando ejemplar:', error);
      throw error;
    }
  },
  
  /**
   * Actualiza el estado de un ejemplar específico
   * @param {String} idLibro - ID o id_libro del libro
   * @param {String} codigoEjemplar - Código del ejemplar
   * @param {Object} datosEjemplar - Nuevos datos del ejemplar
   * @returns {Promise<Object>} Libro actualizado
   */
  async actualizarEjemplar(idLibro, codigoEjemplar, datosEjemplar) {
    try {
      const libro = await this.obtenerLibroPorId(idLibro);
      
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      // Buscar el ejemplar por código
      const ejemplarIndex = libro.ejemplares.findIndex(e => e.codigo === codigoEjemplar);
      if (ejemplarIndex === -1) {
        throw new Error('Ejemplar no encontrado');
      }
      
      // Actualizar los campos proporcionados
      if (datosEjemplar.estado_fisico) {
        libro.ejemplares[ejemplarIndex].estado_fisico = datosEjemplar.estado_fisico;
      }
      
      if (datosEjemplar.ubicacion !== undefined) {
        libro.ejemplares[ejemplarIndex].ubicacion = datosEjemplar.ubicacion;
      }
      
      if (datosEjemplar.disponible !== undefined) {
        libro.ejemplares[ejemplarIndex].disponible = datosEjemplar.disponible;
      }
      
      // Marcar como modificado el array de ejemplares
      libro.markModified('ejemplares');
      
      // Guardar cambios
      await libro.save();
      
      return libro;
    } catch (error) {
      console.error('Error actualizando ejemplar:', error);
      throw error;
    }
  },
  
  /**
   * Elimina un ejemplar específico
   * @param {String} idLibro - ID o id_libro del libro
   * @param {String} codigoEjemplar - Código del ejemplar
   * @returns {Promise<Object>} Libro actualizado
   */
  async eliminarEjemplar(idLibro, codigoEjemplar) {
    try {
      const libro = await this.obtenerLibroPorId(idLibro);
      
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      // Eliminar el ejemplar del array
      libro.ejemplares = libro.ejemplares.filter(e => e.codigo !== codigoEjemplar);
      
      // Actualizar stock total
      libro.stock = libro.ejemplares.length;
      
      // Guardar cambios
      await libro.save();
      
      return libro;
    } catch (error) {
      console.error('Error eliminando ejemplar:', error);
      throw error;
    }
  },
  
  /**
   * Agrega un descuento a un libro
   * @param {String} idLibro - ID o id_libro del libro
   * @param {Object} descuentoData - Datos del descuento
   * @returns {Promise<Object>} Libro actualizado con el nuevo descuento
   */
  async agregarDescuento(idLibro, descuentoData) {
    try {
      const libro = await this.obtenerLibroPorId(idLibro);
      
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      // Verificar que precio_info exista
      if (!libro.precio_info) {
        libro.precio_info = {
          precio_base: libro.precio,
          descuentos: []
        };
      }
      
      // Agregar nuevo descuento
      libro.precio_info.descuentos.push({
        tipo: descuentoData.tipo,
        valor: descuentoData.valor,
        fecha_inicio: descuentoData.fecha_inicio || new Date(),
        fecha_fin: descuentoData.fecha_fin,
        codigo_promocion: descuentoData.codigo_promocion || '',
        descripcion: descuentoData.descripcion || '',
        activo: true
      });
      
      // Marcar como modificado
      libro.markModified('precio_info');
      
      // Recalcular precio final y actualizar el campo precio
      libro.precio = libro.precio_info.calcularPrecioFinal();
      
      // Guardar cambios
      await libro.save();
      
      return libro;
    } catch (error) {
      console.error('Error agregando descuento:', error);
      throw error;
    }
  },
  
  /**
   * Desactiva todos los descuentos de un libro
   * @param {String} idLibro - ID o id_libro del libro
   * @returns {Promise<Object>} Libro actualizado
   */
  async desactivarDescuentos(idLibro) {
    try {
      const libro = await this.obtenerLibroPorId(idLibro);
      
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      // Verificar que precio_info y descuentos existan
      if (libro.precio_info && libro.precio_info.descuentos) {
        // Desactivar todos los descuentos
        libro.precio_info.descuentos.forEach(descuento => {
          descuento.activo = false;
        });
        
        // Marcar como modificado
        libro.markModified('precio_info');
        
        // Recalcular precio final y actualizar el campo precio
        libro.precio = libro.precio_info.calcularPrecioFinal();
        
        // Guardar cambios
        await libro.save();
      }
      
      return libro;
    } catch (error) {
      console.error('Error desactivando descuentos:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene libros con descuentos activos
   * @param {Number} limite - Límite de resultados
   * @returns {Promise<Array>} Lista de libros con descuentos
   */
  async obtenerLibrosConDescuento(limite = 20) {
    try {
      const hoy = new Date();
      
      // Buscar libros con descuentos activos
      return await Libro.find({
        activo: true,
        'precio_info.descuentos': {
          $elemMatch: {
            activo: true,
            fecha_inicio: { $lte: hoy },
            fecha_fin: { $gte: hoy }
          }
        }
      }).limit(limite);
    } catch (error) {
      console.error('Error obteniendo libros con descuento:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene los libros más populares o mejor calificados
   * @param {Number} limite - Límite de resultados
   * @returns {Promise<Array>} Lista de libros más populares
   */
  async obtenerLibrosDestacados(limite = 10) {
    try {
      // Buscar libros con mejores calificaciones y que tengan stock
      return await Libro.find({
        activo: true,
        stock: { $gt: 0 },
        'calificaciones.cantidad': { $gt: 0 }
      })
      .sort({ 'calificaciones.promedio': -1 })
      .limit(limite);
    } catch (error) {
      console.error('Error obteniendo libros destacados:', error);
      throw error;
    }
  },
  
  /**
   * Actualiza la calificación de un libro
   * @param {String} idLibro - ID o id_libro del libro
   * @param {Number} nuevaCalificacion - Nueva calificación (1-5)
   * @returns {Promise<Object>} Libro con calificación actualizada
   */
  async actualizarCalificacion(idLibro, nuevaCalificacion) {
    try {
      const libro = await this.obtenerLibroPorId(idLibro);
      
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      // Validar la calificación
      if (nuevaCalificacion < 1 || nuevaCalificacion > 5) {
        throw new Error('La calificación debe estar entre 1 y 5');
      }
      
      // Calcular nuevo promedio
      const calificacionesActuales = libro.calificaciones.cantidad || 0;
      const promedioActual = libro.calificaciones.promedio || 0;
      
      const nuevaCantidad = calificacionesActuales + 1;
      const nuevoPromedio = ((promedioActual * calificacionesActuales) + nuevaCalificacion) / nuevaCantidad;
      
      // Actualizar calificaciones
      libro.calificaciones = {
        promedio: nuevoPromedio,
        cantidad: nuevaCantidad
      };
      
      // Guardar cambios
      await libro.save();
      
      return libro;
    } catch (error) {
      console.error('Error actualizando calificación:', error);
      throw error;
    }
  },
  
  /**
   * Buscar libros por palabras clave o texto en varios campos
   * @param {String} texto - Texto a buscar
   * @param {Number} limite - Límite de resultados
   * @returns {Promise<Array>} Lista de libros coincidentes
   */
  async buscarPorTexto(texto, limite = 20) {
    try {
      // Si no hay texto, devolver lista vacía
      if (!texto || texto.trim() === '') {
        return [];
      }
      
      // Escapar caracteres especiales para regex
      const textoRegex = texto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      
      // Buscar en múltiples campos
      return await Libro.find({
        activo: true,
        $or: [
          { titulo: { $regex: textoRegex, $options: 'i' } },
          { autor_nombre_completo: { $regex: textoRegex, $options: 'i' } },
          { editorial: { $regex: textoRegex, $options: 'i' } },
          { descripcion: { $regex: textoRegex, $options: 'i' } },
          { palabras_clave: { $regex: textoRegex, $options: 'i' } }
        ]
      }).limit(limite);
    } catch (error) {
      console.error('Error buscando libros por texto:', error);
      throw error;
    }
  },
  
  /**
   * Verifica si un código de ejemplar ya existe en la base de datos
   * @param {String} codigo - Código a verificar
   * @returns {Promise<Boolean>} True si el código ya existe
   */
  async verificarCodigoEjemplar(codigo) {
    try {
      // Buscar libros que contengan un ejemplar con ese código
      const libroExistente = await Libro.findOne({
        'ejemplares.codigo': codigo
      });
      
      return libroExistente !== null;
    } catch (error) {
      console.error('Error verificando código de ejemplar:', error);
      throw error;
    }
  },
  
  /**
   * Marcar un libro como histórico agotado
   * @param {String} idLibro - ID o id_libro del libro
   * @returns {Promise<Object>} Libro actualizado
   */
  async marcarComoHistoricoAgotado(idLibro) {
    try {
      const libro = await this.obtenerLibroPorId(idLibro);
      
      if (!libro) {
        throw new Error('Libro no encontrado');
      }
      
      // Marcar como histórico y desactivar
      libro.categoria_historico = true;
      libro.activo = false;
      libro.ultima_actualizacion = new Date();
      
      // Guardar cambios
      await libro.save();
      
      return libro;
    } catch (error) {
      console.error('Error marcando libro como histórico:', error);
      throw error;
    }
  }
};

module.exports = libroService;