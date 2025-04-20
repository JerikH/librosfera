// src/middleware/uploadMiddleware.js
const multer = require('multer');
const AppError = require('../utils/appError');
const path = require('path');
const fs = require('fs');

// Función para asegurar que existe un directorio
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Directorio creado: ${dirPath}`);
    } catch (err) {
      console.error(`Error al crear directorio ${dirPath}:`, err);
      throw new Error(`No se pudo crear el directorio: ${dirPath}`);
    }
  }
};

// Configurar almacenamiento para multer
const storage = multer.memoryStorage(); // Usar almacenamiento en memoria para mayor control

// Filtro de archivos para permitir solo imágenes
const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('El archivo no es una imagen. Por favor, suba solo imágenes.', 400), false);
  }
};

// Configuración básica de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limitar a 5MB
  }
});

// Middleware para subir una sola imagen
const uploadSingleImage = (req, res, next) => {
  // Verificar y crear directorios
  try {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    const librosDir = path.join(uploadDir, 'libros');
    
    ensureDirectoryExists(uploadDir);
    ensureDirectoryExists(librosDir);
    
    console.log('Directorios de upload verificados:', { uploadDir, librosDir });
    
    // Continuar con el upload
    upload.single('imagen')(req, res, (err) => {
      if (err) {
        console.error('Error en upload:', err);
        return handleMulterError(err, req, res, next);
      }
      
      // Si llegamos aquí, el archivo está en req.file (en memoria)
      if (req.file) {
        console.log('Archivo recibido:', req.file.originalname, req.file.mimetype, req.file.size);
        
        // Guardar el archivo en el sistema de archivos
        const extension = path.extname(req.file.originalname).toLowerCase();
        const nombreArchivo = `${req.params.id}_${Date.now()}${extension}`;
        const rutaArchivo = path.join(librosDir, nombreArchivo);
        
        fs.writeFile(rutaArchivo, req.file.buffer, (err) => {
          if (err) {
            console.error('Error guardando archivo:', err);
            return next(new AppError('Error al guardar el archivo en el sistema', 500));
          }
          
          console.log('Archivo guardado exitosamente en:', rutaArchivo);
          
          // Agregar información del archivo guardado a req.file
          req.file.path = rutaArchivo;
          req.file.filename = nombreArchivo;
          
          // Crear URL para acceder a la imagen
          const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
          req.file.url = `${baseUrl}/uploads/libros/${nombreArchivo}`;
          
          next();
        });
      } else {
        console.warn('No se recibió ningún archivo');
        next();
      }
    });
  } catch (error) {
    console.error('Error preparando upload:', error);
    next(new AppError(`Error preparando upload: ${error.message}`, 500));
  }
};

// Middleware para subir múltiples imágenes (máx. 5)
const uploadMultipleImages = (req, res, next) => {
  // Verificar y crear directorios
  try {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    const librosDir = path.join(uploadDir, 'libros');
    
    ensureDirectoryExists(uploadDir);
    ensureDirectoryExists(librosDir);
    
    // Continuar con el upload
    upload.array('imagenes', 5)(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      
      // Si llegamos aquí, los archivos están en req.files (en memoria)
      if (req.files && req.files.length > 0) {
        // Array para almacenar promesas de escritura de archivos
        const writePromises = [];
        
        req.files.forEach((file, index) => {
          const extension = path.extname(file.originalname).toLowerCase();
          const nombreArchivo = `${req.params.id}_${Date.now()}_${index}${extension}`;
          const rutaArchivo = path.join(librosDir, nombreArchivo);
          
          // Crear promesa para escribir el archivo
          const writePromise = fs.promises.writeFile(rutaArchivo, file.buffer)
            .then(() => {
              // Agregar información del archivo guardado
              file.path = rutaArchivo;
              file.filename = nombreArchivo;
              
              // Crear URL para acceder a la imagen
              const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
              file.url = `${baseUrl}/uploads/libros/${nombreArchivo}`;
              
              return file;
            })
            .catch(err => {
              console.error('Error guardando archivo:', err);
              throw new Error(`Error guardando archivo ${file.originalname}: ${err.message}`);
            });
          
          writePromises.push(writePromise);
        });
        
        // Esperar a que todos los archivos se guarden
        Promise.all(writePromises)
          .then(() => next())
          .catch(err => next(new AppError(`Error guardando archivos: ${err.message}`, 500)));
      } else {
        next();
      }
    });
  } catch (error) {
    next(new AppError(`Error preparando upload: ${error.message}`, 500));
  }
};

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('El archivo es demasiado grande. Máximo 5MB permitidos.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Demasiados archivos o campo de archivo incorrecto.', 400));
    }
    return next(new AppError(`Error al subir archivo: ${err.message}`, 400));
  }
  next(err);
};

// Verificar que los directorios de upload existan
const checkUploadDirs = (req, res, next) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    const librosDir = path.join(uploadDir, 'libros');
    
    // Crear directorios si no existen
    ensureDirectoryExists(uploadDir);
    ensureDirectoryExists(librosDir);
    
    console.log('Directorios verificados antes de upload');
    next();
  } catch (error) {
    return next(new AppError(`Error preparando directorios: ${error.message}`, 500));
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  handleMulterError,
  checkUploadDirs
};