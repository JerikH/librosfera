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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    const librosDir = path.join(uploadDir, 'libros');
    
    // Asegurar que los directorios existan
    ensureDirectoryExists(uploadDir);
    ensureDirectoryExists(librosDir);
    
    cb(null, librosDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único basado en ID del libro y timestamp
    const uniqueSuffix = `${req.params.id}_${Date.now()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

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
const uploadSingleImage = upload.single('imagen');

// Middleware para subir múltiples imágenes (máx. 5)
const uploadMultipleImages = upload.array('imagenes', 5);

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