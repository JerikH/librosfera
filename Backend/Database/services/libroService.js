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
        console.log('Creando nuevo libro:', JSON.stringify(libroData, null, 2));
        
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
        
        console.log('Libro creado con ID:', nuevoLibro._id);

        // Crear registro de inventario para el libro
        const nuevoInventario = new Inventario({
          id_libro: nuevoLibro._id,
          stock_total: libroData.stock || 0,
          stock_disponible: libroData.stock || 0
        });
        await nuevoInventario.save({ session });
        console.log('Inventario creado con ID:', nuevoInventario._id);

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
      console.log('Servicio: Buscando libro con ID:', libroId);
      let libro;

      // Verificar si es un ObjectId válido de MongoDB
      if (mongoose.Types.ObjectId.isValid(libroId)) {
        libro = await Libro.findById(libroId);
        console.log('Búsqueda por _id:', libro ? 'Encontrado' : 'No encontrado');
      } else {
        // Si no es un ObjectId, buscar por id_libro
        libro = await Libro.findOne({ id_libro: libroId });
        console.log('Búsqueda por id_libro:', libro ? 'Encontrado' : 'No encontrado');
      }

      if (!libro) {
        throw new Error(`Libro no encontrado con ID: ${libroId}`);
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
      console.log(`Actualizando libro ${libroId} con datos:`, JSON.stringify(datosActualizados, null, 2));
      
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
                'ajuste_auditoria',
                null, 
                'Actualización manual del stock'
              );
            } else if (diferencia < 0) {
              // Disminuyó el stock
              await inventario.registrarSalida(
                Math.abs(diferencia), 
                'ajuste_auditoria',
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
        
        console.log('Libro actualizado exitosamente:', libroActualizado._id);
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
      console.log('Desactivando libro con ID:', libroId);
      
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
      
      console.log('Libro desactivado correctamente:', resultado._id);
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
      console.log('Eliminando permanentemente libro con ID:', libroId);
      
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
          const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
          const librosDir = path.join(uploadDir, 'libros');
          
          // Procesar cada imagen para eliminarla
          const deletePromises = libroExistente.imagenes.map(imagen => {
            if (imagen.nombre_archivo) {
              const rutaArchivo = path.join(librosDir, imagen.nombre_archivo);
              return fs.unlink(rutaArchivo).catch(err => {
                console.warn(`No se pudo eliminar la imagen ${imagen.nombre_archivo}: ${err.message}`);
              });
            }
            return Promise.resolve();
          });
          
          // Esperar a que se eliminen todas las imágenes
          await Promise.all(deletePromises);
        }

        // Confirmar la transacción
        await session.commitTransaction();
        session.endSession();
        
        console.log('Libro eliminado permanentemente:', libroExistente._id);
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
      console.log(`Listando libros - Página ${pagina}, Límite ${limite}, Orden ${ordenarPor} ${direccion}`);
      console.log('Filtros:', JSON.stringify(filtros, null, 2));
      
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

      console.log(`Libros encontrados: ${libros.length}, Total: ${total}`);
      
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
   * Realiza una búsqueda de libros utilizando Atlas Search y guarda la consulta
   * @param {String} termino - Término de búsqueda
   * @param {Object} filtros - Filtros adicionales
   * @param {Object} usuario - Usuario que realiza la búsqueda (opcional)
   * @param {Number} limite - Cantidad de resultados
   * @returns {Promise<Object>} Resultados de la búsqueda y registro
   */
  async buscarYRegistrar(termino, filtros = {}, usuario = null, limite = 20) {
    try {
      // Decodificar términos de búsqueda que puedan venir URL-encoded
      if (termino) {
        try {
          termino = decodeURIComponent(termino);
        } catch (e) {
          console.warn('Error decodificando término de búsqueda, usando valor original:', e.message);
        }
      }
      
      console.log(`Búsqueda: "${termino || ''}", filtros:`, JSON.stringify(filtros, null, 2));
      
      // Crear pipeline de búsqueda
      const pipeline = [];
      
      // Etapa 1: Buscar con Atlas Search (si hay término de búsqueda)
      if (termino && termino.trim() !== '') {
        pipeline.push({
          $search: {
            index: 'libro_search_index', // Nombre del índice creado en Atlas
            compound: {
              should: [
                // Búsqueda en título (mayor peso)
                {
                  text: {
                    query: termino,
                    path: "titulo",
                    score: { boost: { value: 5 } },
                    fuzzy: {
                      maxEdits: 2,
                      prefixLength: 1
                    }
                  }
                },
                // Búsqueda en autor
                {
                  text: {
                    query: termino,
                    path: "autor_nombre_completo",
                    score: { boost: { value: 4 } },
                    fuzzy: {
                      maxEdits: 2,
                      prefixLength: 1
                    }
                  }
                },
                // Búsqueda en género
                {
                  text: {
                    query: termino,
                    path: "genero",
                    score: { boost: { value: 3 } },
                    fuzzy: {
                      maxEdits: 2,
                      prefixLength: 1
                    }
                  }
                },
                // Búsqueda en editorial
                {
                  text: {
                    query: termino,
                    path: "editorial",
                    score: { boost: { value: 3 } },
                    fuzzy: {
                      maxEdits: 2,
                      prefixLength: 1
                    }
                  }
                },
                // Búsqueda en palabras clave
                {
                  text: {
                    query: termino,
                    path: "palabras_clave",
                    score: { boost: { value: 2 } },
                    fuzzy: {
                      maxEdits: 2,
                      prefixLength: 1
                    }
                  }
                },
                // Búsqueda en descripción
                {
                  text: {
                    query: termino,
                    path: "descripcion",
                    score: { boost: { value: 1 } },
                    fuzzy: {
                      maxEdits: 2,
                      prefixLength: 1
                    }
                  }
                }
              ],
              minimumShouldMatch: 1
            }
          }
        });
      }
      
      // Etapa 2: Aplicar filtros adicionales con $match
      const matchConditions = { activo: true };
      
      // Aplicar filtros específicos
      this.aplicarFiltrosAtlasSearch(matchConditions, filtros);
      
      // Agregar etapa $match al pipeline
      pipeline.push({ $match: matchConditions });
      
      // Etapa 3: Obtener documentos usando aggregate con el pipeline
      let libros;
      
      if (pipeline.length > 0) {
        // Si hay búsqueda de texto o filtros, usar pipeline completo
        libros = await Libro.aggregate(pipeline).limit(limite);
        
        // Para búsquedas de texto, los resultados ya vienen ordenados por relevancia (score)
        // Para búsquedas solo con filtros, podríamos añadir un $sort si es necesario
        
        console.log(`Libros encontrados: ${libros.length}`);
      } else {
        // Si no hay búsqueda ni filtros, devolver libros por defecto (más recientes)
        libros = await Libro.find({ activo: true }).sort({ fecha_registro: -1 }).limit(limite);
        console.log(`No se especificaron criterios, mostrando ${libros.length} libros recientes`);
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
      console.log('Búsqueda registrada con ID:', nuevaBusqueda._id);
      
      return {
        resultados: libros,
        id_busqueda: nuevaBusqueda._id
      };
    } catch (error) {
      console.error('Error en búsqueda de libros con Atlas Search:', error);
      throw error;
    }
  },

  // Método auxiliar para aplicar filtros a la búsqueda de Atlas Search
  aplicarFiltrosAtlasSearch(matchConditions, filtros) {
    // Filtros de texto (ya no necesitamos normalización ni regex, Atlas Search se encarga)
    if (filtros.genero) {
      matchConditions.genero = filtros.genero;
    }
    
    if (filtros.editorial) {
      matchConditions.editorial = filtros.editorial;
    }
    
    if (filtros.idioma) {
      matchConditions.idioma = filtros.idioma;
    }
    
    if (filtros.estado) {
      matchConditions.estado = filtros.estado;
    }
    
    // Filtros de precio
    if (filtros.precio_min || filtros.precio_max) {
      matchConditions.precio = {};
      if (filtros.precio_min) matchConditions.precio.$gte = parseFloat(filtros.precio_min);
      if (filtros.precio_max) matchConditions.precio.$lte = parseFloat(filtros.precio_max);
    }
    
    // Solo disponibles
    if (filtros.solo_disponibles) {
      matchConditions.stock = { $gt: 0 };
    }
    
    // Incluir inactivos
    if (filtros.incluir_inactivos !== true) {
      matchConditions.activo = true;
    }
  },

  // Método para búsquedas con autocompletado
  async buscarAutocomplete(prefijo, campo = "titulo", limite = 10) {
    try {
      if (!prefijo || prefijo.trim() === '') {
        return [];
      }

      // Validar que el campo tenga soporte para autocompletado
      const camposPermitidos = ['titulo', 'autor_nombre_completo', 'genero', 'editorial'];
      if (!camposPermitidos.includes(campo)) {
        campo = 'titulo'; // Valor por defecto si no es válido
      }

      // Pipeline para autocompletado usando Atlas Search
      const pipeline = [
        {
          $search: {
            index: "libro_search_index",
            // Usar el subcampo autocomplete del campo solicitado
            autocomplete: {
              query: prefijo,
              path: `${campo}.autocomplete`,
              fuzzy: {
                maxEdits: 1,
                prefixLength: 1
              }
            }
          }
        },
        // Obtener solo los campos necesarios y score
        {
          $project: {
            _id: 1,
            titulo: 1,
            autor_nombre_completo: 1,
            [campo]: 1,
            // Usar doble score para evitar el error de $meta
            score: { $const: 1.0 } // Score constante como alternativa
          }
        },
        // Limitar cantidad de resultados
        {
          $limit: limite
        }
      ];

      const resultados = await Libro.aggregate(pipeline);
      return resultados;
    } catch (error) {
      console.error(`Error en autocompletado para ${campo}:`, error);
      
      // Plan B: Usar búsqueda de texto normal si falla autocomplete
      try {
        console.log(`Intentando fallback para autocompletar ${campo} con búsqueda de texto normal`);
        return await this.busquedaTextoSimple(prefijo, campo, limite);
      } catch (fallbackError) {
        console.error('Error en fallback de autocompletado:', fallbackError);
        throw error; // Propagar el error original
      }
    }
  },

  // Método fallback para autocompletado usando regex
  async busquedaTextoSimple(prefijo, campo = "titulo", limite = 10) {
    // Escapar caracteres especiales para regex
    const terminoEscapado = prefijo.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // Crear condición de búsqueda
    const query = { 
      activo: true,
      [campo]: { $regex: `^${terminoEscapado}`, $options: 'i' }
    };
    
    // Campos a seleccionar
    const projection = { 
      _id: 1, 
      titulo: 1, 
      autor_nombre_completo: 1,
      [campo]: 1
    };
    
    // Ejecutar consulta
    return await Libro.find(query, projection).limit(limite);
  },

  // Método para búsqueda difusa (fuzzy) por múltiples campos
  async busquedaDifusa(termino, campos = ["titulo", "autor_nombre_completo"], limite = 20) {
    try {
      if (!termino || termino.trim() === '') {
        return [];
      }

      // Verificar si los campos solicitados son válidos
      const camposValidos = ["titulo", "autor_nombre_completo", "genero", "editorial", "descripcion", "palabras_clave"];
      const camposFiltrados = Array.isArray(campos) 
        ? campos.filter(c => camposValidos.includes(c))
        : typeof campos === 'string'
          ? campos.split(',').map(c => c.trim()).filter(c => camposValidos.includes(c))
          : ["titulo", "autor_nombre_completo"];

      // Si no quedaron campos válidos, usar los predeterminados
      if (camposFiltrados.length === 0) {
        camposFiltrados.push("titulo", "autor_nombre_completo");
      }

      // Pipeline para búsqueda difusa usando Atlas Search
      const pipeline = [
        {
          $search: {
            index: "libro_search_index",
            compound: {
              should: camposFiltrados.map(campo => ({
                text: {
                  query: termino,
                  path: campo,
                  fuzzy: {
                    maxEdits: 2,
                    prefixLength: 1
                  }
                }
              })),
              minimumShouldMatch: 1
            }
          }
        },
        {
          $match: { activo: true }
        },
        // En lugar de usar $meta searchScore, usar $addFields con valor constante si es necesario
        {
          $addFields: {
            relevance: 1.0 // Score constante como alternativa
          }
        },
        {
          $limit: limite
        }
      ];

      const resultados = await Libro.aggregate(pipeline);
      return resultados;
    } catch (error) {
      console.error('Error en búsqueda difusa:', error);
      
      // Plan B: Usar búsqueda básica con regex si falla la búsqueda difusa
      try {
        console.log('Intentando fallback para búsqueda difusa con regex básico');
        return await this.busquedaRegexBasica(termino, campos, limite);
      } catch (fallbackError) {
        console.error('Error en fallback de búsqueda difusa:', fallbackError);
        throw error; // Propagar el error original
      }
    }
  },

  // Método fallback para búsqueda difusa usando regex
  async busquedaRegexBasica(termino, campos = ["titulo", "autor_nombre_completo"], limite = 20) {
    // Normalizar término (quitar acentos)
    const normalizarTexto = (texto) => {
      if (!texto) return '';
      return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    };
    
    const terminoNormalizado = normalizarTexto(termino);
    
    // Escapar caracteres especiales para regex
    const escaparRegex = (texto) => {
      return texto.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };
    
    const terminoRegex = escaparRegex(terminoNormalizado);
    
    // Asegurar que campos sea un array
    const camposArray = Array.isArray(campos) 
      ? campos 
      : typeof campos === 'string'
        ? campos.split(',').map(c => c.trim())
        : ["titulo", "autor_nombre_completo"];
    
    // Crear condiciones para cada campo
    const condiciones = camposArray.map(campo => ({
      [campo]: { $regex: terminoRegex, $options: 'i' }
    }));
    
    // Construir query
    const query = { 
      activo: true,
      $or: condiciones
    };
    
    // Ejecutar consulta
    return await Libro.find(query).limit(limite);
  },

  // Método para búsqueda por sinónimos (útil para términos relacionados)
  async busquedaConSinonimos(termino, sinonimos = [], limite = 20) {
    try {
      // Si no hay término o sinónimos, retornar array vacío
      if ((!termino || termino.trim() === '') && (!sinonimos || sinonimos.length === 0)) {
        return [];
      }

      // Construir array de términos incluyendo el original y sus sinónimos
      const terminos = [termino, ...sinonimos].filter(t => t && t.trim() !== '');

      const pipeline = [
        {
          $search: {
            index: "libro_search_index",
            compound: {
              should: terminos.map(t => ({
                text: {
                  query: t,
                  path: ["titulo", "autor_nombre_completo", "genero", "descripcion", "palabras_clave"],
                  fuzzy: {
                    maxEdits: 1
                  }
                }
              })),
              minimumShouldMatch: 1
            }
          }
        },
        {
          $match: { activo: true }
        },
        {
          $sort: { score: { $meta: "searchScore" } }
        },
        {
          $limit: limite
        }
      ];

      return await Libro.aggregate(pipeline);
    } catch (error) {
      console.error('Error en búsqueda con sinónimos:', error);
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
      console.log(`Registrando interacción: Búsqueda ${idBusqueda}, Libro ${idLibro}`);
      
      const busqueda = await Busqueda.findById(idBusqueda);
      
      if (!busqueda) {
        throw new Error(`Búsqueda no encontrada con ID: ${idBusqueda}`);
      }
      
      await busqueda.agregarLibroVisto(idLibro);
      console.log('Interacción registrada correctamente');
      
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
      console.log(`Obteniendo recomendaciones para usuario ${idUsuario}`);
      
      // Obtener búsquedas recientes del usuario
      const busquedasRecientes = await Busqueda.busquedasRecientesUsuario(idUsuario, 10);
      
      // Extraer términos más frecuentes
      const terminosFrecuentes = {};
      busquedasRecientes.forEach(busqueda => {
        if (busqueda.termino && busqueda.termino.trim() !== '') {
          const termino = busqueda.termino.toLowerCase().trim();
          if (!terminosFrecuentes[termino]) {
            terminosFrecuentes[termino] = 0;
          }
          terminosFrecuentes[termino]++;
        }
      });
      
      // Ordenar términos por frecuencia
      const terminosOrdenados = Object.entries(terminosFrecuentes)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .slice(0, 3); // Tomar los 3 términos más frecuentes
      
      console.log('Términos frecuentes de búsqueda:', terminosOrdenados);
      
      // Obtener libros ya vistos por el usuario (para excluirlos)
      const librosVistos = [];
      busquedasRecientes.forEach(busqueda => {
        if (busqueda.interaccion && busqueda.interaccion.libros_vistos) {
          librosVistos.push(...busqueda.interaccion.libros_vistos);
        }
      });
      
      // ESTRATEGIA 1: Recomendaciones basadas en calificaciones
      console.log('Buscando recomendaciones por calificaciones...');
      const recomendacionesPorCalificacion = await Libro.find({ 
        activo: true,
        stock: { $gt: 0 },
        'calificaciones.cantidad': { $gt: 0 },
        'calificaciones.promedio': { $gte: 4.0 }
      })
      .sort({ 'calificaciones.promedio': -1 })
      .limit(limite);
      
      if (recomendacionesPorCalificacion.length > 0) {
        console.log(`Encontradas ${recomendacionesPorCalificacion.length} recomendaciones por calificación`);
        return recomendacionesPorCalificacion;
      }
      
      // ESTRATEGIA 2: Recomendaciones basadas en términos de búsqueda
      if (terminosOrdenados.length > 0) {
        console.log('Buscando recomendaciones por términos frecuentes...');
        // Construir query para búsqueda por términos
        const query = {
          activo: true,
          stock: { $gt: 0 }
        };
        
        // Excluir libros ya vistos si hay alguno
        if (librosVistos.length > 0) {
          query._id = { $nin: librosVistos };
        }
        
        // Crear condiciones para búsqueda por términos
        const orConditions = [];
        terminosOrdenados.forEach(termino => {
          orConditions.push(
            { titulo: { $regex: termino, $options: 'i' } },
            { autor_nombre_completo: { $regex: termino, $options: 'i' } },
            { genero: { $regex: termino, $options: 'i' } },
            { descripcion: { $regex: termino, $options: 'i' } }
          );
        });
        
        if (orConditions.length > 0) {
          query.$or = orConditions;
        }
        
        // Buscar libros relacionados con términos frecuentes
        const recomendaciones = await Libro.find(query)
          .sort({ fecha_registro: -1 })
          .limit(limite);
        
        if (recomendaciones.length > 0) {
          console.log(`Encontradas ${recomendaciones.length} recomendaciones por términos`);
          return recomendaciones;
        }
      }
      
      // ESTRATEGIA 3: Recomendaciones por libros con descuento
      console.log('Buscando recomendaciones por descuento...');
      const librosConDescuento = await Libro.obtenerLibrosConDescuento()
        .limit(limite);
      
      if (librosConDescuento.length > 0) {
        console.log(`Encontradas ${librosConDescuento.length} recomendaciones con descuento`);
        return librosConDescuento;
      }
      
      // ESTRATEGIA 4: Como último recurso, mostrar libros recientes
      console.log('Mostrando libros recientes como recomendación...');
      return await Libro.find({ 
        activo: true, 
        stock: { $gt: 0 } 
      })
      .sort({ fecha_registro: -1 })
      .limit(limite);
      
    } catch (error) {
      console.error('Error obteniendo recomendaciones:', error);
      // Si hay error, devolver libros recientes como fallback
      try {
        return await Libro.find({ 
          activo: true, 
          stock: { $gt: 0 } 
        })
        .sort({ fecha_registro: -1 })
        .limit(limite);
      } catch (err) {
        console.error('Error en fallback de recomendaciones:', err);
        return []; // Devolver array vacío en caso de error completo
      }
    }
  },

  /**
   * Obtener libros con descuento activo
   * @param {Number} limite - Cantidad máxima de resultados
   * @returns {Promise<Array>} Lista de libros con descuento
   */
  async obtenerLibrosConDescuento(limite = 20) {
    try {
      console.log(`Obteniendo hasta ${limite} libros con descuento`);
      
      const libros = await Libro.obtenerLibrosConDescuento()
        .limit(limite);
      
      console.log(`Libros con descuento encontrados: ${libros.length}`);
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
      console.log(`Obteniendo hasta ${limite} libros destacados`);
      
      const libros = await Libro.obtenerLibrosDestacados(limite);
      
      console.log(`Libros destacados encontrados: ${libros.length}`);
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
      console.log(`Calificando libro ${idLibro} con ${calificacion} estrellas`);
      
      const libroActualizado = await Libro.agregarCalificacion(idLibro, calificacion);
      
      if (!libroActualizado) {
        throw new Error(`No se pudo actualizar la calificación del libro ${idLibro}`);
      }
      
      console.log('Calificación actualizada correctamente');
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
      console.log(`Buscando libros con texto "${texto}"`);
      
      const libros = await Libro.buscarPorTexto(texto, limite);
      
      console.log(`Libros encontrados: ${libros.length}`);
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
      console.log(`Marcando libro ${idLibro} como histórico agotado`);
      
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Actualizar libro
        const libroActualizado = await Libro.marcarComoHistoricoAgotado(idLibro)
          .session(session);
        
        if (!libroActualizado) {
          throw new Error(`Libro no encontrado con ID: ${idLibro}`);
        }

        // Actualizar inventario
        const inventario = await Inventario.findOne({ id_libro: idLibro })
          .session(session);
        
        if (inventario) {
          inventario.estado = 'historico_agotado';
          await inventario.save({ session });
          console.log('Inventario actualizado a histórico agotado');
        } else {
          console.log('No se encontró inventario para este libro');
        }

        await session.commitTransaction();
        session.endSession();
        
        console.log('Libro marcado como histórico agotado correctamente');
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
      console.log(`Agregando ejemplar al libro ${idLibro}:`, JSON.stringify(ejemplarData, null, 2));
      
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
          throw new Error(`Libro no encontrado con ID: ${idLibro}`);
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
        console.log('Ejemplar agregado al libro');

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
          console.log('Inventario actualizado');
        } else {
          // Crear inventario si no existe
          const nuevoInventario = new Inventario({
            id_libro: libro._id,
            stock_total: 1,
            stock_disponible: 1
          });
          await nuevoInventario.save({ session });
          console.log('Creado nuevo inventario para el libro');
        }

        await session.commitTransaction();
        session.endSession();
        
        console.log('Ejemplar agregado correctamente');
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
      console.log(`Actualizando ejemplar ${codigo} del libro ${idLibro}:`, 
                  JSON.stringify(datosActualizados, null, 2));
      
      // Iniciar sesión de transacción
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
          throw new Error(`Libro no encontrado con ID: ${idLibro}`);
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
            const inventario = await Inventario.findOne({ id_libro: libro._id }).session(session);
            if (inventario) {
              if (datosActualizados.disponible) {
                // Liberar reserva
                await inventario.liberarReserva(
                  1, // Un ejemplar
                  null, // ID usuario
                  null, // ID reserva
                  `Actualización manual de disponibilidad: ${codigo}`
                );
                console.log('Ejemplar marcado como disponible en inventario');
              } else {
                // Reservar ejemplar
                await inventario.reservarEjemplares(
                  1, // Un ejemplar
                  null, // ID usuario
                  null, // ID reserva
                  `Actualización manual de disponibilidad: ${codigo}`
                );
                console.log('Ejemplar marcado como no disponible en inventario');
              }
            }
          }
        }

        libro.markModified('ejemplares');
        await libro.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        console.log('Ejemplar actualizado correctamente');
        return libro.toObject();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
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
      console.log(`Eliminando ejemplar ${codigo} del libro ${idLibro}`);
      
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
          throw new Error(`Libro no encontrado con ID: ${idLibro}`);
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
        console.log('Ejemplar eliminado de libro');

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
            console.log('Inventario actualizado');
          }
        }

        await session.commitTransaction();
        session.endSession();
        
        console.log('Ejemplar eliminado correctamente');
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
      console.log(`Agregando descuento al libro ${idLibro}:`, JSON.stringify(descuentoData, null, 2));
      
      // Buscar el libro
      let libro;
      if (mongoose.Types.ObjectId.isValid(idLibro)) {
        libro = await Libro.findById(idLibro);
      } else {
        libro = await Libro.findOne({ id_libro: idLibro });
      }

      if (!libro) {
        throw new Error(`Libro no encontrado con ID: ${idLibro}`);
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
      
      console.log('Descuento agregado correctamente');
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
      console.log(`Desactivando descuentos del libro ${idLibro}`);
      
      const libroActualizado = await Libro.desactivarDescuentos(idLibro);
      
      if (!libroActualizado) {
        throw new Error(`Libro no encontrado con ID: ${idLibro}`);
      }
      
      console.log('Descuentos desactivados correctamente');
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
      console.log(`Verificando si existe el código de ejemplar: ${codigo}`);
      
      const existe = await Libro.verificarCodigoEjemplar(codigo);
      
      console.log(`Código ${codigo} existe: ${existe ? 'Sí' : 'No'}`);
      return existe;
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
      console.log('Agregando imagen al libro:', idLibro);
      console.log('Archivo recibido:', archivo ? {
        filename: archivo.filename,
        originalname: archivo.originalname,
        mimetype: archivo.mimetype,
        size: archivo.size,
        path: archivo.path,
        url: archivo.url
      } : 'No hay archivo');
      
      // Buscar el libro
      let libro;
      if (mongoose.Types.ObjectId.isValid(idLibro)) {
        libro = await Libro.findById(idLibro);
      } else {
        libro = await Libro.findOne({ id_libro: idLibro });
      }

      if (!libro) {
        throw new Error(`Libro no encontrado con ID: ${idLibro}`);
      }

      console.log('Libro encontrado:', libro._id.toString());

      // Verificar que la imagen existe
      if (!archivo || (!archivo.filename && !archivo.path)) {
        throw new Error('No se recibió un archivo de imagen válido');
      }

      // URL para acceder a la imagen
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const urlImagen = archivo.url || `${baseUrl}/uploads/libros/${archivo.filename}`;
      
      console.log('URL de la imagen:', urlImagen);
      
      // Preparar datos de la imagen
      const imagenData = {
        url: urlImagen,
        nombre_archivo: archivo.filename,
        tipo: metadatos.tipo || 'detalle',
        orden: metadatos.orden !== undefined ? parseInt(metadatos.orden) : 999, // Por defecto al final
        alt_text: metadatos.alt_text || libro.titulo,
        fecha_subida: new Date(),
        activa: true
      };
      
      console.log('Datos de imagen a guardar:', imagenData);
      
      // Agregar la imagen al libro
      if (!libro.imagenes) {
        libro.imagenes = [];
      }
      
      // Si es portada con orden 0, verificar si ya existe y actualizar
      if (imagenData.tipo === 'portada' && imagenData.orden === 0) {
        const portadaIndex = libro.imagenes.findIndex(
          img => img.tipo === 'portada' && img.orden === 0
        );
        
        if (portadaIndex >= 0) {
          // Actualizar portada existente
          libro.imagenes[portadaIndex] = {
            ...libro.imagenes[portadaIndex].toObject(),
            ...imagenData
          };
        } else {
          // Agregar nueva portada
          libro.imagenes.push(imagenData);
        }
      } else {
        // Agregar imagen normal
        libro.imagenes.push(imagenData);
      }
      
      // Ordenar imágenes por orden
      libro.imagenes.sort((a, b) => a.orden - b.orden);
      
      libro.markModified('imagenes');
      
      // Si es la primera imagen y no hay portada en legacy, hacerla portada
      if (libro.imagenes.length === 1 && (!libro.imagenes_legacy || !libro.imagenes_legacy.portada)) {
        if (!libro.imagenes_legacy) {
          libro.imagenes_legacy = { adicionales: [] };
        }
        libro.imagenes_legacy.portada = urlImagen;
        libro.markModified('imagenes_legacy');
      }
      
      // Guardar el libro
      await libro.save();
      
      console.log('Imagen agregada correctamente');
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
      console.log(`Actualizando orden de imágenes del libro ${idLibro}:`, ordenesNuevos);
      
      // Buscar el libro
      let libro;
      if (mongoose.Types.ObjectId.isValid(idLibro)) {
        libro = await Libro.findById(idLibro);
      } else {
        libro = await Libro.findOne({ id_libro: idLibro });
      }
  
      if (!libro) {
        throw new Error(`Libro no encontrado con ID: ${idLibro}`);
      }
  
      // Guardar el valor de ordenesNuevos para debugging
      console.log('Órdenes nuevos recibidos:', JSON.stringify(ordenesNuevos));
      
      // Actualizar orden de imágenes - MEJORAR LA LÓGICA
      ordenesNuevos.forEach(item => {
        // Buscar por ID MongoDB o por índice si el ID no existe
        const imagen = libro.imagenes.id(item.id_imagen);
        if (imagen) {
          imagen.orden = item.orden_nuevo;
        } else {
          // Si no encuentra por ID, intentar buscar la imagen por índice o URL
          // Esto es un fallback por si los IDs están mal formados
          const imagenIndex = libro.imagenes.findIndex(img => 
            (img._id && img._id.toString() === item.id_imagen) || 
            img.url.includes(item.id_imagen)
          );
          
          if (imagenIndex !== -1) {
            libro.imagenes[imagenIndex].orden = item.orden_nuevo;
            libro.markModified(`imagenes.${imagenIndex}.orden`);
          }
        }
      });
      
      // Ordenar imágenes por orden
      libro.imagenes.sort((a, b) => a.orden - b.orden);
      
      libro.markModified('imagenes');
      await libro.save();
      
      console.log('Orden de imágenes actualizado correctamente');
      return libro;
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
      console.log(`Eliminando imagen ${idImagen} del libro ${idLibro}`);
      
      // Buscar el libro
      let libro;
      if (mongoose.Types.ObjectId.isValid(idLibro)) {
        libro = await Libro.findById(idLibro);
      } else {
        libro = await Libro.findOne({ id_libro: idLibro });
      }
  
      if (!libro) {
        throw new Error(`Libro no encontrado con ID: ${idLibro}`);
      }
  
      // Si el libro no tiene imágenes
      if (!libro.imagenes || libro.imagenes.length === 0) {
        throw new Error(`El libro no tiene imágenes para eliminar`);
      }
  
      // Intentamos distintas estrategias para encontrar la imagen
      let imagenAEliminar = null;
      let imagenIndex = -1;
      
      // 1. Buscar imagen por ID exacto (si es un ObjectID válido)
      if (mongoose.Types.ObjectId.isValid(idImagen)) {
        // Intentamos encontrar directamente por id
        imagenIndex = libro.imagenes.findIndex(img => 
          img._id && img._id.toString() === idImagen
        );
        
        if (imagenIndex >= 0) {
          imagenAEliminar = libro.imagenes[imagenIndex];
        }
      }
      
      // 2. Si no encontramos por ID, intentar por posición o atributos
      if (imagenIndex === -1) {
        // Si idImagen es un número, buscar por índice
        const posicion = parseInt(idImagen);
        if (!isNaN(posicion) && posicion >= 0 && posicion < libro.imagenes.length) {
          imagenIndex = posicion;
          imagenAEliminar = libro.imagenes[imagenIndex];
        } else {
          // 3. Buscar por tipo o nombre de archivo
          imagenIndex = libro.imagenes.findIndex(img => 
            (img.tipo === 'portada' && idImagen.includes('portada')) ||
            (img.tipo === 'contraportada' && idImagen.includes('contraportada')) ||
            (img.nombre_archivo && img.nombre_archivo.includes(idImagen))
          );
          
          if (imagenIndex >= 0) {
            imagenAEliminar = libro.imagenes[imagenIndex];
          }
        }
      }
      
      // 4. Último recurso: simplemente eliminar la primera imagen
      if (imagenIndex === -1 && libro.imagenes.length > 0) {
        imagenIndex = 0;
        imagenAEliminar = libro.imagenes[0];
        console.log("No se encontró la imagen específica, eliminando la primera imagen disponible.");
      }
      
      // Si aún así no se encuentra la imagen
      if (imagenIndex === -1) {
        console.log("Imágenes disponibles:", libro.imagenes.map(img => ({
          _id: img._id?.toString(),
          tipo: img.tipo,
          orden: img.orden,
          nombre_archivo: img.nombre_archivo
        })));
        throw new Error(`Imagen no encontrada con ID: ${idImagen}`);
      }
      
      // Guardar nombre de archivo para eliminar después
      const nombreArchivo = libro.imagenes[imagenIndex].nombre_archivo;
      
      // Eliminar la imagen utilizando splice (más seguro que .remove())
      libro.imagenes.splice(imagenIndex, 1);
      libro.markModified('imagenes');
      
      await libro.save();
      
      // Eliminar archivo físico
      try {
        const directorioImagenes = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/libros');
        const rutaArchivo = path.join(directorioImagenes, nombreArchivo);
        await fs.unlink(rutaArchivo).catch(e => console.warn(`Aviso: ${e.message}`));
        console.log('Archivo físico eliminado');
      } catch (err) {
        console.warn(`No se pudo eliminar el archivo físico: ${err.message}`);
        // Continuar incluso si no se puede eliminar el archivo físico
      }
      
      return libro;
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
      console.log(`Reservando ${cantidad} unidades del libro ${idLibro}`);
      
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
          throw new Error(`Libro no encontrado con ID: ${idLibro}`);
        }

        // Verificar si hay suficiente stock disponible
        const inventario = await Inventario.findOne({ id_libro: libro._id })
          .session(session);
        
        if (!inventario) {
          throw new Error('Inventario no encontrado para este libro');
        }

        console.log(`Stock disponible: ${inventario.stock_disponible}, Solicitado: ${cantidad}`);
        
        if (inventario.stock_disponible < cantidad) {
          throw new Error(`Stock insuficiente. Disponible: ${inventario.stock_disponible}, Solicitado: ${cantidad}`);
        }

        // Determinar si idReserva es un ObjectId válido
        let reservaId = null; // Por defecto usamos null si no es un ObjectId válido
        
        // Reservar stock en el inventario
        await inventario.reservarEjemplares(
          cantidad,
          idUsuario,
          reservaId,
          `Reserva para compra ID: ${idReserva}`
        );

        await session.commitTransaction();
        session.endSession();
        
        console.log(`Reservados ${cantidad} ejemplares correctamente`);
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
        console.error('Error reservando stock:', error);
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
      console.log(`Liberando ${cantidad} unidades reservadas del libro ${idLibro}`);
      
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
          throw new Error(`Libro no encontrado con ID: ${idLibro}`);
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

        // Determinar si idReserva es un ObjectId válido
        let reservaId = null; // Por defecto usamos null si no es un ObjectId válido
  
        await inventario.liberarReserva(
          cantidad,
          idUsuario,
          reservaId,
          `Liberación de reserva ID: ${idReserva}`
        );

        await session.commitTransaction();
        session.endSession();
        
        console.log(`Liberados ${cantidad} ejemplares correctamente`);
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
      console.log(`Confirmando compra de ${cantidad} unidades del libro ${idLibro}`);
      
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
          throw new Error(`Libro no encontrado con ID: ${idLibro}`);
        }

        // Determinar si los IDs son ObjectId válidos
        let transaccionId = null; // Usar null en lugar de string no válido
        
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
          transaccionId,
          `Venta confirmada. Transacción: ${idTransaccion}, Reserva: ${idReserva}`
        );

        await session.commitTransaction();
        session.endSession();
        
        console.log(`Compra de ${cantidad} ejemplares confirmada`);
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