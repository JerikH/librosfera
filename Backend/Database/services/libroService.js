// Database/services/libroService.js
const mongoose = require('mongoose');
const Libro = require('../models/libroModel');
const Inventario = require('../models/inventarioModel');
const Busqueda = require('../models/busquedaModel');
const fs = require('fs').promises;
const path = require('path');

/**
 * Servicio de Libros - Encapsula la lógica de negocio y acceso a datos para libros
 * Proporciona métodos para todas las operaciones relacionadas con libros en la aplicación
 */
const libroService = {
  /**
   * Crea un nuevo libro en la base de datos
   * @param {Object} libroData - Datos del libro a crear
   * @returns {Promise<Object>} El libro creado
   */
  async crearLibro(libroData) {
    try {
      // Iniciar una sesión de transacción de MongoDB
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Comprobar campos obligatorios
        const {
          titulo,
          autor,
          editorial,
          genero,
          idioma,
          fecha_publicacion,
          anio_publicacion,
          numero_paginas,
          precio_info,
          precio,
          estado
        } = libroData;

        // Validar que tengamos todos los campos obligatorios
        if (!titulo || !autor || !editorial || !genero || !idioma || 
            !fecha_publicacion || !anio_publicacion || !numero_paginas || 
            !precio || !estado) {
          throw new Error('Faltan campos obligatorios para crear el libro');
        }

        // Formatear datos de autor si es necesario
        let autorFormateado = autor;

        // Si el autor viene como un objeto simple en lugar de array
        if (autor && !Array.isArray(autor)) {
          autorFormateado = [autor];
        }

        // Generar autor_nombre_completo
        const autorNombreCompleto = autorFormateado.map(a => 
          `${a.nombre} ${a.apellidos}`
        ).join(', ');
        
        libroData.autor = autorFormateado;
        libroData.autor_nombre_completo = autorNombreCompleto;

        // Si se proporciona precio_info, asegurarse de que tenga la estructura correcta
        if (!libroData.precio_info) {
          libroData.precio_info = {
            precio_base: precio,
            moneda: 'COP',
            impuesto: {
              tipo: 'IVA',
              porcentaje: 19
            },
            descuentos: []
          };
        }

        // Crear instancia del modelo con los datos
        const nuevoLibro = new Libro(libroData);
        await nuevoLibro.save({ session });

        // Crear registro de inventario para el libro
        const nuevoInventario = new Inventario({
          id_libro: nuevoLibro._id,
          stock_total: libroData.stock || 0,
          stock_disponible: libroData.stock || 0
        });
        await nuevoInventario.save({ session });

        // Confirmar la transacción
        await session.commitTransaction();
        session.endSession();

        return nuevoLibro.toObject();
      } catch (error) {
        // Si algo falla, abortar la transacción
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error creando libro:', error);
      throw error;
    }
  },

  /**
   * Obtiene un libro por su ID
   * @param {String} libroId - ID del libro a buscar
   * @returns {Promise<Object>} El libro encontrado
   */
  async obtenerLibroPorId(libroId) {
    try {
      let libro;

      // Verificar si es un ObjectId válido de MongoDB
      if (mongoose.Types.ObjectId.isValid(libroId)) {
        libro = await Libro.findById(libroId);
      } else {
        // Si no es un ObjectId, buscar por id_libro
        libro = await Libro.findOne({ id_libro: libroId });
      }

      if (!libro) {
        throw new Error('Libro no encontrado');
      }

      return libro.toObject();
    } catch (error) {
      console.error('Error obteniendo libro por ID:', error);
      throw error;
    }
  },

  /**
   * Actualiza un libro existente
   * @param {String} libroId - ID del libro a actualizar
   * @param {Object} datosActualizados - Nuevos datos del libro
   * @param {Number} version - Versión actual del libro para control de concurrencia
   * @returns {Promise<Object>} El libro actualizado
   */
  async actualizarLibro(libroId, datosActualizados, version) {
    try {
      // Iniciar una sesión de transacción
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Verificar si el libro existe
        let libro;
        if (mongoose.Types.ObjectId.isValid(libroId)) {
          libro = await Libro.findById(libroId).session(session);
        } else {
          libro = await Libro.findOne({ id_libro: libroId }).session(session);
        }

        if (!libro) {
          throw new Error('Libro no encontrado para actualizar');
        }

        // Control de concurrencia optimista
        if (version !== undefined && libro.version !== version) {
          throw new Error('El libro ha sido modificado por otro usuario. Por favor, recarga los datos.');
        }

        // Verificar si hay cambios en el autor
        if (datosActualizados.autor) {
          let autor = datosActualizados.autor;
          
          // Si el autor viene como un objeto simple en lugar de array
          if (!Array.isArray(autor)) {
            autor = [autor];
          }

          // Actualizar el autor_nombre_completo
          if (autor.length > 0) {
            datosActualizados.autor_nombre_completo = autor.map(a => 
              `${a.nombre} ${a.apellidos}`
            ).join(', ');
          }
        }

        // Actualizar fecha de última actualización
        datosActualizados.ultima_actualizacion = new Date();

        // Actualizar el libro
        let libroActualizado;
        if (mongoose.Types.ObjectId.isValid(libroId)) {
          libroActualizado = await Libro.findByIdAndUpdate(
            libroId,
            { $set: datosActualizados },
            { new: true, runValidators: true, session }
          );
        } else {
          libroActualizado = await Libro.findOneAndUpdate(
            { id_libro: libroId },
            { $set: datosActualizados },
            { new: true, runValidators: true, session }
          );
        }

        if (!libroActualizado) {
          throw new Error('Libro no encontrado después de intentar actualizar');
        }

        // Si se actualizó el stock, actualizar el inventario
        if (datosActualizados.stock !== undefined) {
          const inventario = await Inventario.findOne({ id_libro: libroActualizado._id }).session(session);
          
          if (inventario) {
            const diferencia = datosActualizados.stock - (libro.stock || 0);
            
            if (diferencia > 0) {
              // Aumentó el stock
              await inventario.registrarEntrada(
                diferencia, 
                'ajuste_inventario', 
                null, 
                'Actualización manual del stock'
              );
            } else if (diferencia < 0) {
              // Disminuyó el stock
              await inventario.registrarSalida(
                Math.abs(diferencia), 
                'ajuste_inventario', 
                null, 
                null, 
                'Actualización manual del stock'
              );
            }
          } else {
            // Crear inventario si no existe
            const nuevoInventario = new Inventario({
              id_libro: libroActualizado._id,
              stock_total: datosActualizados.stock,
              stock_disponible: datosActualizados.stock
            });
            await nuevoInventario.save({ session });
          }
        }

        // Confirmar la transacción
        await session.commitTransaction();
        session.endSession();

        return libroActualizado.toObject();
      } catch (error) {
        // Si algo falla, abortar la transacción
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error actualizando libro:', error);
      throw error;
    }
  },

  /**
   * Elimina lógicamente un libro (marca como inactivo)
   * @param {String} libroId - ID del libro a desactivar
   * @returns {Promise<Boolean>} True si se desactivó correctamente
   */
  async desactivarLibro(libroId) {
    try {
      // Verificar si el libro existe
      const libroExistente = await this.obtenerLibroPorId(libroId);

      if (!libroExistente) {
        throw new Error('Libro no encontrado para desactivar');
      }

      // Desactivar lógicamente el libro (marcar como inactivo)
      let resultado;
      if (mongoose.Types.ObjectId.isValid(libroId)) {
        resultado = await Libro.findByIdAndUpdate(
          libroId,
          { 
            $set: { 
              activo: false,
              ultima_actualizacion: new Date()
            }
          },
          { new: true }
        );
      } else {
        resultado = await Libro.findOneAndUpdate(
          { id_libro: libroId },
          { 
            $set: { 
              activo: false,
              ultima_actualizacion: new Date()
            }
          },
          { new: true }
        );
      }

      if (!resultado) {
        throw new Error('Error al desactivar el libro');
      }

      return true;
    } catch (error) {
      console.error('Error desactivando libro:', error);
      throw error;
    }
  },

  /**
   * Elimina físicamente un libro de la base de datos
   * @param {String} libroId - ID del libro a eliminar
   * @returns {Promise<Boolean>} True si se eliminó correctamente
   */
  async eliminarLibroPermanente(libroId) {
    try {
      // Iniciar una sesión de transacción
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Verificar si el libro existe
        let libroExistente;
        if (mongoose.Types.ObjectId.isValid(libroId)) {
          libroExistente = await Libro.findById(libroId).session(session);
        } else {
          libroExistente = await Libro.findOne({ id_libro: libroId }).session(session);
        }

        if (!libroExistente) {
          throw new Error('Libro no encontrado para eliminación física');
        }

        // Eliminar físicamente el libro
        let resultado;
        if (mongoose.Types.ObjectId.isValid(libroId)) {
          resultado = await Libro.findByIdAndDelete(libroId).session(session);
        } else {
          resultado = await Libro.findOneAndDelete({ id_libro: libroId }).session(session);
        }

        if (!resultado) {
          throw new Error('Error al eliminar físicamente el libro');
        }

        // Eliminar inventario asociado
        await Inventario.findOneAndDelete({ id_libro: libroExistente._id }).session(session);

        // Eliminar imágenes físicas asociadas al libro
        if (libroExistente.imagenes && libroExistente.imagenes.length > 0) {
          // Eliminar archivos de imágenes si es necesario
          // Este proceso se debe manejar según la implementación de almacenamiento
          // de imágenes de la aplicación
        }

        // Confirmar la transacción
        await session.commitTransaction();
        session.endSession();

        return true;
      } catch (error) {
        // Si algo falla, abortar la transacción
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error eliminando físicamente libro:', error);
      throw error;
    }
  },

  /**
   * Listar libros con filtros y paginación
   * @param {Object} filtros - Filtros para la búsqueda
   * @param {Number} pagina - Número de página
   * @param {Number} limite - Cantidad de resultados por página
   * @param {String} ordenarPor - Campo por el que ordenar
   * @param {String} direccion - Dirección del ordenamiento ('asc' o 'desc')
   * @returns {Promise<Object>} Resultados paginados
   */
  async listarLibros(filtros = {}, pagina = 1, limite = 10, ordenarPor = 'fecha_registro', direccion = 'desc') {
    try {
      // Calcular índice para paginación
      const skip = (pagina - 1) * limite;

      // Obtener query base según criterios
      const query = Libro.buscarPorCriterios(filtros);

      // Contar total de resultados para la paginación
      const total = await Libro.countDocuments(query.getQuery());

      // Definir ordenamiento
      const ordenamiento = {};
      ordenamiento[ordenarPor] = direccion === 'asc' ? 1 : -1;

      // Ejecutar la consulta con paginación
      const libros = await query
        .skip(skip)
        .limit(limite)
        .sort(ordenamiento);

      // Calcular el total de páginas
      const totalPaginas = Math.ceil(total / limite) || 1;

      // Devolver resultados con metadatos de paginación
      return {
        datos: libros.map(l => l.toObject()),
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
 * Realiza una búsqueda de libros y guarda la consulta
 * No depende de índices de texto, usa regex y ponderación manual para resultados relevantes
 * @param {String} termino - Término de búsqueda
 * @param {Object} filtros - Filtros adicionales
 * @param {Object} usuario - Usuario que realiza la búsqueda (opcional)
 * @param {Number} limite - Cantidad de resultados
 * @returns {Promise<Object>} Resultados de la búsqueda y registro
 */
  async buscarYRegistrar(termino, filtros = {}, usuario = null, limite = 20) {
    try {
      // Crear query base
      const query = {};
      
      // Búsqueda por texto utilizando expresiones regulares
      if (termino && termino.trim() !== '') {
        // Escapar caracteres especiales para la expresión regular
        const terminoSeguro = termino.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        // Crear expresión regular case-insensitive
        const regex = new RegExp(terminoSeguro, 'i');
        
        // Buscar en múltiples campos
        query.$or = [
          { titulo: regex },
          { autor_nombre_completo: regex },
          { descripcion: regex },
          { editorial: regex },
          { 'palabras_clave': regex }
        ];
      }
      
      // Aplicar filtros adicionales
      if (filtros.genero) query.genero = filtros.genero;
      if (filtros.editorial) query.editorial = { $regex: filtros.editorial, $options: 'i' };
      if (filtros.idioma) query.idioma = filtros.idioma;
      if (filtros.estado) query.estado = filtros.estado;
      
      // Solo mostrar activos por defecto
      if (filtros.incluir_inactivos !== true) {
        query.activo = true;
      }
      
      // Filtros de precio
      if (filtros.precio_min || filtros.precio_max) {
        query.precio = {};
        if (filtros.precio_min) query.precio.$gte = parseFloat(filtros.precio_min);
        if (filtros.precio_max) query.precio.$lte = parseFloat(filtros.precio_max);
      }

      // Solo disponibles
      if (filtros.solo_disponibles) {
        query.stock = { $gt: 0 };
      }

      // Obtener todos los libros que coinciden con la consulta
      let libros = await Libro.find(query).limit(limite * 2); // Obtenemos más para luego ordenar
      
      // Si tenemos un término de búsqueda, calculamos una puntuación de relevancia manual
      if (termino && termino.trim() !== '') {
        const terminoLower = termino.toLowerCase();
        const palabrasBusqueda = terminoLower.split(/\s+/).filter(p => p.length > 2);
        
        // Asignar puntuación a cada libro según relevancia
        libros = libros.map(libro => {
          let puntuacion = 0;
          const libroObj = libro.toObject();
          
          // Coincidencia exacta en título (mayor prioridad)
          if (libroObj.titulo && libroObj.titulo.toLowerCase().includes(terminoLower)) {
            puntuacion += 10;
            
            // Bonus por coincidencia en título al inicio
            if (libroObj.titulo.toLowerCase().startsWith(terminoLower)) {
              puntuacion += 5;
            }
          }
          
          // Coincidencia en autor
          if (libroObj.autor_nombre_completo && 
              libroObj.autor_nombre_completo.toLowerCase().includes(terminoLower)) {
            puntuacion += 8;
          }
          
          // Coincidencia en palabras clave
          if (libroObj.palabras_clave && libroObj.palabras_clave.length > 0) {
            const coincidencias = libroObj.palabras_clave.filter(
              palabra => palabra.toLowerCase().includes(terminoLower)
            ).length;
            puntuacion += coincidencias * 3;
          }
          
          // Coincidencia en descripción
          if (libroObj.descripcion && libroObj.descripcion.toLowerCase().includes(terminoLower)) {
            puntuacion += 2;
          }
          
          // Coincidencia por palabras individuales
          if (palabrasBusqueda.length > 1) {
            palabrasBusqueda.forEach(palabra => {
              if (libroObj.titulo && libroObj.titulo.toLowerCase().includes(palabra)) {
                puntuacion += 1;
              }
              if (libroObj.autor_nombre_completo && 
                  libroObj.autor_nombre_completo.toLowerCase().includes(palabra)) {
                puntuacion += 0.8;
              }
              if (libroObj.descripcion && libroObj.descripcion.toLowerCase().includes(palabra)) {
                puntuacion += 0.5;
              }
            });
          }
          
          // Agregar puntuación al libro
          return {
            ...libroObj,
            _puntuacion: puntuacion
          };
        });
        
        // Ordenar por puntuación (mayor a menor)
        libros.sort((a, b) => b._puntuacion - a._puntuacion);
        
        // Limitar resultados
        libros = libros.slice(0, limite);
        
        // Eliminar campo de puntuación antes de devolver
        libros = libros.map(libro => {
          const { _puntuacion, ...libroSinPuntuacion } = libro;
          return libroSinPuntuacion;
        });
      } else {
        // Si no hay término de búsqueda, limitar resultados
        libros = libros.slice(0, limite);
      }

      // Registrar la búsqueda en el historial
      const busquedaData = {
        termino: termino || '',
        total_resultados: libros.length,
        filtros
      };
      
      // Agregar usuario si está autenticado
      if (usuario && usuario._id) {
        busquedaData.id_usuario = usuario._id;
      }
      
      // Guardar registro de búsqueda
      const nuevaBusqueda = new Busqueda(busquedaData);
      await nuevaBusqueda.save();

      return {
        resultados: libros,
        id_busqueda: nuevaBusqueda._id
      };
    } catch (error) {
      console.error('Error en búsqueda de libros:', error);
      throw error;
    }
  },

  /**
   * Registrar interacción con un libro desde una búsqueda
   * @param {String} idBusqueda - ID de la búsqueda
   * @param {String} idLibro - ID del libro visualizado
   * @returns {Promise<Object>} Registro de búsqueda actualizado
   */
  async registrarInteraccionBusqueda(idBusqueda, idLibro) {
    try {
      const busqueda = await Busqueda.findById(idBusqueda);
      
      if (!busqueda) {
        throw new Error('Búsqueda no encontrada');
      }
      
      await busqueda.agregarLibroVisto(idLibro);
      
      return busqueda;
    } catch (error) {
      console.error('Error registrando interacción de búsqueda:', error);
      throw error;
    }
  },

  /**
   * Obtener libros recomendados para un usuario
   * @param {String} idUsuario - ID del usuario
   * @param {Number} limite - Cantidad máxima de recomendaciones
   * @returns {Promise<Array>} Lista de libros recomendados
   */
  async obtenerRecomendaciones(idUsuario, limite = 5) {
    try {
      // Obtener búsquedas recientes del usuario
      const busquedasRecientes = await Busqueda.busquedasRecientesUsuario(idUsuario, 10);
      
      // Extraer términos más frecuentes
      const terminosFrecuentes = {};
      busquedasRecientes.forEach(busqueda => {
        if (busqueda.termino) {
          if (!terminosFrecuentes[busqueda.termino]) {
            terminosFrecuentes[busqueda.termino] = 0;
          }
          terminosFrecuentes[busqueda.termino]++;
        }
      });
      
      // Ordenar términos por frecuencia
      const terminosOrdenados = Object.entries(terminosFrecuentes)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .slice(0, 3); // Tomar los 3 términos más frecuentes
      
      if (terminosOrdenados.length > 0) {
        // Construir query para encontrar libros relacionados
        const query = {
          activo: true,
          stock: { $gt: 0 },
          $text: { $search: terminosOrdenados.join(' ') }
        };
        
        // Excluir libros ya vistos
        const librosVistos = [];
        busquedasRecientes.forEach(busqueda => {
          if (busqueda.interaccion && busqueda.interaccion.libros_vistos) {
            librosVistos.push(...busqueda.interaccion.libros_vistos);
          }
        });
        
        if (librosVistos.length > 0) {
          query._id = { $nin: librosVistos };
        }
        
        // Buscar libros relacionados con los términos frecuentes
        return await Libro.find(
          query,
          { score: { $meta: "textScore" } }
        )
        .sort({ score: { $meta: "textScore" } })
        .limit(limite);
      }
      
      // Si no hay suficientes datos de búsqueda, recomendar los más populares
      return await Libro.obtenerLibrosDestacados(limite);
    } catch (error) {
      console.error('Error obteniendo recomendaciones:', error);
      // Si hay error, devolver libros populares como fallback
      return await Libro.obtenerLibrosDestacados(limite);
    }
  },

  /**
   * Obtener libros con descuento activo
   * @param {Number} limite - Cantidad máxima de resultados
   * @returns {Promise<Array>} Lista de libros con descuento
   */
  async obtenerLibrosConDescuento(limite = 20) {
    try {
      const libros = await Libro.obtenerLibrosConDescuento()
        .limit(limite);
      
      return libros.map(l => l.toObject());
    } catch (error) {
      console.error('Error obteniendo libros con descuento:', error);
      throw error;
    }
  },

  /**
   * Obtener libros destacados (mejor calificados)
   * @param {Number} limite - Cantidad máxima de resultados
   * @returns {Promise<Array>} Lista de libros destacados
   */
  async obtenerLibrosDestacados(limite = 10) {
    try {
      const libros = await Libro.obtenerLibrosDestacados(limite);
      return libros.map(l => l.toObject());
    } catch (error) {
      console.error('Error obteniendo libros destacados:', error);
      throw error;
    }
  },

  /**
   * Actualizar calificación de un libro
   * @param {String} idLibro - ID del libro
   * @param {Number} calificacion - Valor de la calificación (1-5)
   * @returns {Promise<Object>} Libro actualizado
   */
  async actualizarCalificacion(idLibro, calificacion) {
    try {
      const libroActualizado = await Libro.agregarCalificacion(idLibro, calificacion);
      return libroActualizado.toObject();
    } catch (error) {
      console.error('Error actualizando calificación:', error);
      throw error;
    }
  },

  /**
   * Buscar libros por texto
   * @param {String} texto - Texto a buscar
   * @param {Number} limite - Cantidad máxima de resultados
   * @returns {Promise<Array>} Lista de libros encontrados
   */
  async buscarPorTexto(texto, limite = 20) {
    try {
      const libros = await Libro.buscarPorTexto(texto, limite);
      return libros.map(l => l.toObject());
    } catch (error) {
      console.error('Error buscando libros por texto:', error);
      throw error;
    }
  },

  /**
   * Marcar un libro como histórico agotado
   * @param {String} idLibro - ID del libro
   * @returns {Promise<Object>} Libro actualizado
   */
  async marcarComoHistoricoAgotado(idLibro) {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Actualizar libro
        const libroActualizado = await Libro.marcarComoHistoricoAgotado(idLibro)
          .session(session);
        
        if (!libroActualizado) {
          throw new Error('Libro no encontrado');
        }

        // Actualizar inventario
        const inventario = await Inventario.findOne({ id_libro: idLibro })
          .session(session);
        
        if (inventario) {
          inventario.estado = 'historico_agotado';
          await inventario.save({ session });
        }

        await session.commitTransaction();
        session.endSession();
        
        return libroActualizado.toObject();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error marcando libro como histórico:', error);
      throw error;
    }
  },

  /**
   * Agregar un ejemplar a un libro
   * @param {String} idLibro - ID del libro
   * @param {Object} ejemplarData - Datos del ejemplar
   * @returns {Promise<Object>} Libro actualizado
   */
  async agregarEjemplar(idLibro, ejemplarData) {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Verificar si el libro existe
        let libro;
        if (mongoose.Types.ObjectId.isValid(idLibro)) {
          libro = await Libro.findById(idLibro).session(session);
        } else {
          libro = await Libro.findOne({ id_libro: idLibro }).session(session);
        }

        if (!libro) {
          throw new Error('Libro no encontrado');
        }

        // Verificar si el código ya existe
        const codigoExiste = await Libro.verificarCodigoEjemplar(ejemplarData.codigo);
        if (codigoExiste) {
          throw new Error(`Ya existe un ejemplar con el código ${ejemplarData.codigo}`);
        }

        // Agregar el ejemplar
        await libro.agregarEjemplar(
          ejemplarData.codigo,
          ejemplarData.estado_fisico || 'excelente',
          ejemplarData.ubicacion || ''
        );

        // Actualizar inventario
        const inventario = await Inventario.findOne({ id_libro: libro._id })
          .session(session);
        
        if (inventario) {
          await inventario.registrarEntrada(
            1, // Un ejemplar
            'inventario_inicial',
            null, // ID usuario
            `Registro manual de ejemplar: ${ejemplarData.codigo}`
          );
        } else {
          // Crear inventario si no existe
          const nuevoInventario = new Inventario({
            id_libro: libro._id,
            stock_total: 1,
            stock_disponible: 1
          });
          await nuevoInventario.save({ session });
        }

        await session.commitTransaction();
        session.endSession();
        
        return libro.toObject();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error agregando ejemplar:', error);
      throw error;
    }
  },

  /**
   * Actualizar un ejemplar específico
   * @param {String} idLibro - ID del libro
   * @param {String} codigo - Código del ejemplar
   * @param {Object} datosActualizados - Nuevos datos del ejemplar
   * @returns {Promise<Object>} Libro actualizado
   */
  async actualizarEjemplar(idLibro, codigo, datosActualizados) {
    try {
      // Buscar el libro
      let libro;
      if (mongoose.Types.ObjectId.isValid(idLibro)) {
        libro = await Libro.findById(idLibro);
      } else {
        libro = await Libro.findOne({ id_libro: idLibro });
      }

      if (!libro) {
        throw new Error('Libro no encontrado');
      }

      // Encontrar el ejemplar
      const ejemplarIndex = libro.ejemplares.findIndex(e => e.codigo === codigo);
      if (ejemplarIndex === -1) {
        throw new Error(`Ejemplar con código ${codigo} no encontrado`);
      }

      // Actualizar los campos del ejemplar
      if (datosActualizados.estado_fisico) {
        libro.ejemplares[ejemplarIndex].estado_fisico = datosActualizados.estado_fisico;
      }
      
      if (datosActualizados.ubicacion !== undefined) {
        libro.ejemplares[ejemplarIndex].ubicacion = datosActualizados.ubicacion;
      }
      
      if (datosActualizados.disponible !== undefined) {
        const estadoAnterior = libro.ejemplares[ejemplarIndex].disponible;
        libro.ejemplares[ejemplarIndex].disponible = datosActualizados.disponible;
        
        // Si cambió disponibilidad, actualizar inventario
        if (estadoAnterior !== datosActualizados.disponible) {
          const inventario = await Inventario.findOne({ id_libro: libro._id });
          if (inventario) {
            if (datosActualizados.disponible) {
              // Liberar reserva
              await inventario.liberarReserva(
                1, // Un ejemplar
                null, // ID usuario
                null, // ID reserva
                `Actualización manual de disponibilidad: ${codigo}`
              );
            } else {
              // Reservar ejemplar
              await inventario.reservarEjemplares(
                1, // Un ejemplar
                null, // ID usuario
                null, // ID reserva
                `Actualización manual de disponibilidad: ${codigo}`
              );
            }
          }
        }
      }

      libro.markModified('ejemplares');
      await libro.save();
      
      return libro.toObject();
    } catch (error) {
      console.error('Error actualizando ejemplar:', error);
      throw error;
    }
  },

  /**
   * Eliminar un ejemplar específico
   * @param {String} idLibro - ID del libro
   * @param {String} codigo - Código del ejemplar
   * @returns {Promise<Object>} Libro actualizado
   */
  async eliminarEjemplar(idLibro, codigo) {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Buscar el libro
        let libro;
        if (mongoose.Types.ObjectId.isValid(idLibro)) {
          libro = await Libro.findById(idLibro).session(session);
        } else {
          libro = await Libro.findOne({ id_libro: idLibro }).session(session);
        }

        if (!libro) {
          throw new Error('Libro no encontrado');
        }

        // Encontrar el ejemplar
        const ejemplarIndex = libro.ejemplares.findIndex(e => e.codigo === codigo);
        if (ejemplarIndex === -1) {
          throw new Error(`Ejemplar con código ${codigo} no encontrado`);
        }

        // Verificar si el ejemplar estaba disponible
        const estabaDisponible = libro.ejemplares[ejemplarIndex].disponible;

        // Eliminar el ejemplar
        libro.ejemplares.splice(ejemplarIndex, 1);
        libro.stock = libro.ejemplares.length;
        libro.markModified('ejemplares');
        await libro.save({ session });

        // Actualizar inventario
        if (estabaDisponible) {
          const inventario = await Inventario.findOne({ id_libro: libro._id })
            .session(session);
          
          if (inventario) {
            await inventario.registrarSalida(
              1, // Un ejemplar
              'baja', 
              null, // ID usuario
              null, // ID transacción
              `Eliminación manual de ejemplar: ${codigo}`
            );
          }
        }

        await session.commitTransaction();
        session.endSession();
        
        return libro.toObject();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error eliminando ejemplar:', error);
      throw error;
    }
  },

  /**
   * Agregar un descuento a un libro
   * @param {String} idLibro - ID del libro
   * @param {Object} descuentoData - Datos del descuento
   * @returns {Promise<Object>} Libro actualizado
   */
  async agregarDescuento(idLibro, descuentoData) {
    try {
      // Buscar el libro
      let libro;
      if (mongoose.Types.ObjectId.isValid(idLibro)) {
        libro = await Libro.findById(idLibro);
      } else {
        libro = await Libro.findOne({ id_libro: idLibro });
      }

      if (!libro) {
        throw new Error('Libro no encontrado');
      }

      // Validar datos del descuento
      if (!descuentoData.tipo || !descuentoData.valor) {
        throw new Error('El tipo y valor del descuento son obligatorios');
      }

      if (!['porcentaje', 'valor_fijo', 'promocion_2x1', 'bundle'].includes(descuentoData.tipo)) {
        throw new Error('Tipo de descuento no válido');
      }

      // Agregar el descuento
      await libro.agregarDescuento(
        descuentoData.tipo,
        descuentoData.valor,
        descuentoData.fecha_inicio,
        descuentoData.fecha_fin,
        descuentoData.codigo_promocion || ''
      );
      
      return libro.toObject();
    } catch (error) {
      console.error('Error agregando descuento:', error);
      throw error;
    }
  },

  /**
   * Desactivar todos los descuentos de un libro
   * @param {String} idLibro - ID del libro
   * @returns {Promise<Object>} Libro actualizado
   */
  async desactivarDescuentos(idLibro) {
    try {
      const libroActualizado = await Libro.desactivarDescuentos(idLibro);
      
      if (!libroActualizado) {
        throw new Error('Libro no encontrado');
      }
      
      return libroActualizado.toObject();
    } catch (error) {
      console.error('Error desactivando descuentos:', error);
      throw error;
    }
  },

  /**
   * Verificar si un código de ejemplar ya existe
   * @param {String} codigo - Código a verificar
   * @returns {Promise<Boolean>} True si el código ya existe
   */
  async verificarCodigoEjemplar(codigo) {
    try {
      return await Libro.verificarCodigoEjemplar(codigo);
    } catch (error) {
      console.error('Error verificando código de ejemplar:', error);
      throw error;
    }
  },

  /**
   * Subir y agregar una imagen a un libro
   * @param {String} idLibro - ID del libro
   * @param {Object} archivo - Archivo de imagen
   * @param {Object} metadatos - Metadatos de la imagen
   * @returns {Promise<Object>} Libro actualizado
   */
  async agregarImagenLibro(idLibro, archivo, metadatos) {
    try {
      // Buscar el libro
      let libro;
      if (mongoose.Types.ObjectId.isValid(idLibro)) {
        libro = await Libro.findById(idLibro);
      } else {
        libro = await Libro.findOne({ id_libro: idLibro });
      }

      if (!libro) {
        throw new Error('Libro no encontrado');
      }

      // Generar nombre único para el archivo
      const extension = path.extname(archivo.originalname).toLowerCase();
      const nombreArchivo = `${libro._id}_${Date.now()}${extension}`;
      
      // Directorio de imágenes
      const directorioImagenes = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/libros');
      
      // Asegurarse de que el directorio exista
      await fs.mkdir(directorioImagenes, { recursive: true });
      
      // Ruta completa del archivo
      const rutaArchivo = path.join(directorioImagenes, nombreArchivo);
      
      // Guardar el archivo en el sistema de archivos
      await fs.writeFile(rutaArchivo, archivo.buffer);
      
      // URL para acceder a la imagen (ajustar según la configuración del servidor)
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const urlImagen = `${baseUrl}/uploads/libros/${nombreArchivo}`;
      
      // Preparar datos de la imagen
      const imagenData = {
        url: urlImagen,
        nombre_archivo: nombreArchivo,
        tipo: metadatos.tipo || 'detalle',
        orden: metadatos.orden !== undefined ? metadatos.orden : 999, // Por defecto al final
        alt_text: metadatos.alt_text || libro.titulo
      };
      
      // Agregar la imagen al libro
      await libro.agregarImagen(imagenData);
      
      // Si es la primera imagen y no hay portada, hacerla portada
      if (libro.imagenes.length === 1 && !libro.imagenes_legacy.portada) {
        libro.imagenes_legacy.portada = urlImagen;
        await libro.save();
      }
      
      return libro.toObject();
    } catch (error) {
      console.error('Error agregando imagen al libro:', error);
      throw error;
    }
  },

  /**
   * Actualizar orden de imágenes
   * @param {String} idLibro - ID del libro
   * @param {Array} ordenesNuevos - Array de {id_imagen, orden_nuevo}
   * @returns {Promise<Object>} Libro actualizado
   */
  async actualizarOrdenImagenes(idLibro, ordenesNuevos) {
    try {
      // Buscar el libro
      let libro;
      if (mongoose.Types.ObjectId.isValid(idLibro)) {
        libro = await Libro.findById(idLibro);
      } else {
        libro = await Libro.findOne({ id_libro: idLibro });
      }

      if (!libro) {
        throw new Error('Libro no encontrado');
      }

      // Actualizar orden de imágenes
      await libro.actualizarOrdenImagenes(ordenesNuevos);
      
      return libro.toObject();
    } catch (error) {
      console.error('Error actualizando orden de imágenes:', error);
      throw error;
    }
  },

  /**
   * Eliminar una imagen de un libro
   * @param {String} idLibro - ID del libro
   * @param {String} idImagen - ID de la imagen
   * @returns {Promise<Object>} Libro actualizado
   */
  async eliminarImagenLibro(idLibro, idImagen) {
    try {
      // Buscar el libro
      let libro;
      if (mongoose.Types.ObjectId.isValid(idLibro)) {
        libro = await Libro.findById(idLibro);
      } else {
        libro = await Libro.findOne({ id_libro: idLibro });
      }

      if (!libro) {
        throw new Error('Libro no encontrado');
      }

      // Encontrar la imagen
      const imagen = libro.imagenes.id(idImagen);
      if (!imagen) {
        throw new Error('Imagen no encontrada');
      }

      // Guardar nombre de archivo para eliminar después
      const nombreArchivo = imagen.nombre_archivo;
      
      // Eliminar la imagen del libro
      await libro.eliminarImagen(idImagen);
      
      // Eliminar archivo físico
      try {
        const directorioImagenes = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/libros');
        const rutaArchivo = path.join(directorioImagenes, nombreArchivo);
        await fs.unlink(rutaArchivo);
      } catch (err) {
        console.warn(`No se pudo eliminar el archivo físico: ${err.message}`);
        // Continuar incluso si no se puede eliminar el archivo físico
      }
      
      return libro.toObject();
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      throw error;
    }
  },

  /**
   * Reservar stock de un libro para una compra
   * @param {String} idLibro - ID del libro
   * @param {Number} cantidad - Cantidad a reservar
   * @param {String} idUsuario - ID del usuario que realiza la reserva
   * @param {String} idReserva - ID de la reserva o carrito
   * @returns {Promise<Object>} Resultado de la operación
   */
  async reservarStock(idLibro, cantidad, idUsuario, idReserva) {
    try {
      // Iniciar sesión de transacción para asegurar atomicidad
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Verificar si el libro existe
        let libro;
        if (mongoose.Types.ObjectId.isValid(idLibro)) {
          libro = await Libro.findById(idLibro).session(session);
        } else {
          libro = await Libro.findOne({ id_libro: idLibro }).session(session);
        }

        if (!libro) {
          throw new Error('Libro no encontrado');
        }

        // Verificar si hay suficiente stock disponible
        const inventario = await Inventario.findOne({ id_libro: libro._id })
          .session(session);
        
        if (!inventario) {
          throw new Error('Inventario no encontrado para este libro');
        }

        if (inventario.stock_disponible < cantidad) {
          throw new Error(`Stock insuficiente. Disponible: ${inventario.stock_disponible}, Solicitado: ${cantidad}`);
        }

        // Reservar stock en el inventario
        await inventario.reservarEjemplares(
          cantidad,
          idUsuario,
          idReserva,
          `Reserva para compra ID: ${idReserva}`
        );

        await session.commitTransaction();
        session.endSession();
        
        return {
          exito: true,
          mensaje: `${cantidad} ejemplar(es) reservado(s) exitosamente`,
          inventario: {
            stock_total: inventario.stock_total,
            stock_disponible: inventario.stock_disponible,
            stock_reservado: inventario.stock_reservado
          }
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error reservando stock:', error);
      throw error;
    }
  },

  /**
   * Liberar stock reservado de un libro
   * @param {String} idLibro - ID del libro
   * @param {Number} cantidad - Cantidad a liberar
   * @param {String} idUsuario - ID del usuario
   * @param {String} idReserva - ID de la reserva o carrito
   * @returns {Promise<Object>} Resultado de la operación
   */
  async liberarStockReservado(idLibro, cantidad, idUsuario, idReserva) {
    try {
      // Iniciar sesión de transacción
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Verificar si el libro existe
        let libro;
        if (mongoose.Types.ObjectId.isValid(idLibro)) {
          libro = await Libro.findById(idLibro).session(session);
        } else {
          libro = await Libro.findOne({ id_libro: idLibro }).session(session);
        }

        if (!libro) {
          throw new Error('Libro no encontrado');
        }

        // Liberar stock en el inventario
        const inventario = await Inventario.findOne({ id_libro: libro._id })
          .session(session);
        
        if (!inventario) {
          throw new Error('Inventario no encontrado para este libro');
        }

        // Verificar que haya suficiente stock reservado
        if (inventario.stock_reservado < cantidad) {
          throw new Error(`No hay suficiente stock reservado. Reservado: ${inventario.stock_reservado}, Solicitado: ${cantidad}`);
        }

        await inventario.liberarReserva(
          cantidad,
          idUsuario,
          idReserva,
          `Liberación de reserva ID: ${idReserva}`
        );

        await session.commitTransaction();
        session.endSession();
        
        return {
          exito: true,
          mensaje: `${cantidad} ejemplar(es) liberado(s) exitosamente`,
          inventario: {
            stock_total: inventario.stock_total,
            stock_disponible: inventario.stock_disponible,
            stock_reservado: inventario.stock_reservado
          }
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error liberando stock reservado:', error);
      throw error;
    }
  },

  /**
   * Confirmar compra de un libro (convierte reserva en venta)
   * @param {String} idLibro - ID del libro
   * @param {Number} cantidad - Cantidad comprada
   * @param {String} idUsuario - ID del usuario
   * @param {String} idTransaccion - ID de la transacción
   * @param {String} idReserva - ID de la reserva o carrito
   * @returns {Promise<Object>} Resultado de la operación
   */
  async confirmarCompraLibro(idLibro, cantidad, idUsuario, idTransaccion, idReserva) {
    try {
      // Iniciar sesión de transacción
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Verificar si el libro existe
        let libro;
        if (mongoose.Types.ObjectId.isValid(idLibro)) {
          libro = await Libro.findById(idLibro).session(session);
        } else {
          libro = await Libro.findOne({ id_libro: idLibro }).session(session);
        }

        if (!libro) {
          throw new Error('Libro no encontrado');
        }

        // Confirmar venta en el inventario
        const inventario = await Inventario.findOne({ id_libro: libro._id })
          .session(session);
        
        if (!inventario) {
          throw new Error('Inventario no encontrado para este libro');
        }

        // Registrar salida (venta)
        await inventario.registrarSalida(
          cantidad,
          'venta',
          idUsuario,
          idTransaccion,
          `Venta confirmada. Transacción: ${idTransaccion}, Reserva: ${idReserva}`
        );

        await session.commitTransaction();
        session.endSession();
        
        return {
          exito: true,
          mensaje: `Compra de ${cantidad} ejemplar(es) registrada exitosamente`,
          inventario: {
            stock_total: inventario.stock_total,
            stock_disponible: inventario.stock_disponible,
            stock_reservado: inventario.stock_reservado
          }
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error('Error confirmando compra:', error);
      throw error;
    }
  }
};

module.exports = libroService;