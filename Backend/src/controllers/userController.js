// src/controllers/userController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  Usuario,
  crearCliente,
  crearAdministrador,
  crearRoot,
  obtenerUsuarioCompleto,
  buscarUsuarioPorEmail,
  actualizarUsuario,
  desactivarUsuario
} = require('../../../Database/models');

/**
 * Generar token JWT
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Registrar un nuevo usuario
 * @route   POST /api/v1/users/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { usuario, email, password, tipo_usuario, ...restData } = req.body;

    // Verificar si el usuario ya existe
    // const existeUsuario = await Usuario.findOne({ $or: [{ usuario }, { email }] });
    // if (existeUsuario) {
    //   return res.status(400).json({
    //     status: 'error',
    //     message: 'El usuario o email ya están registrados'
    //   });
    // }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Datos básicos del usuario
    const userData = {
      usuario,
      email,
      password: passwordHash,
      tipo_usuario
    };

    // Separar los datos según su tipo
    let profileData = {};
    let tipoData = {};

    // Extraer los datos según el tipo de usuario
    if (tipo_usuario === 'cliente' || tipo_usuario === 'administrador') {
      const { DNI, nombres, apellidos, fecha_nacimiento, lugar_nacimiento, genero, direcciones, telefono, telefono_alternativo, foto_perfil, ...restTipoData } = restData;
      
      profileData = { 
        DNI, 
        nombres, 
        apellidos, 
        fecha_nacimiento, 
        lugar_nacimiento, 
        genero,
        direcciones: direcciones ? [direcciones] : [],
        telefono,
        telefono_alternativo,
        foto_perfil
      };
      
      tipoData = restTipoData;
    } else {
      tipoData = restData;
    }

    // Crear usuario según su tipo
    let nuevoUsuario;

    switch (tipo_usuario) {
      case 'cliente':
        nuevoUsuario = await crearCliente(userData, profileData, tipoData);
        break;
      case 'administrador':
        // Verificar permisos para crear admin
        if (req.user && req.user.tipo_usuario !== 'administrador' && req.user.tipo_usuario !== 'root') {
          return res.status(403).json({
            status: 'error',
            message: 'No tiene permisos para crear un administrador'
          });
        }
        nuevoUsuario = await crearAdministrador(userData, profileData, tipoData);
        break;
      case 'root':
        // Solo un root puede crear otro root
        if (req.user && req.user.tipo_usuario !== 'root') {
          return res.status(403).json({
            status: 'error',
            message: 'No tiene permisos para crear un usuario root'
          });
        }
        nuevoUsuario = await crearRoot(userData, tipoData);
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Tipo de usuario no válido'
        });
    }

    // Eliminar password de la respuesta
    if (nuevoUsuario) {
      // Si es un objeto con propiedades anidadas
      if (nuevoUsuario.password) {
        delete nuevoUsuario.password;
      }

      // Responder con información del usuario y token
      res.status(201).json({
        status: 'success',
        data: {
          ...nuevoUsuario,
          token: generateToken(nuevoUsuario._id),
        },
      });
    }
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Autenticar usuario / obtener token
 * @route   POST /api/v1/users/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar email y obtener usuario completo
    const usuario = await buscarUsuarioPorEmail(email);
    if (!usuario) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({
        status: 'error',
        message: 'Esta cuenta ha sido desactivada'
      });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    await Usuario.findByIdAndUpdate(usuario._id, {
      ultimo_acceso: Date.now()
    });

    // Eliminar password de la respuesta
    delete usuario.password;

    // Responder con información del usuario y token
    res.status(200).json({
      status: 'success',
      data: {
        ...usuario,
        token: generateToken(usuario._id),
      },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener perfil del usuario
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    // Obtener información completa del usuario
    const usuarioCompleto = await obtenerUsuarioCompleto(req.user._id);
    
    if (!usuarioCompleto) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
    }
    
    // Eliminar password por seguridad
    delete usuarioCompleto.password;
    
    res.status(200).json({
      status: 'success',
      data: usuarioCompleto,
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar perfil del usuario
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const { password, email, usuario, ...restData } = req.body;
    
    // Datos a actualizar en el esquema de usuario base
    const userData = {};
    
    // Si se incluye nueva contraseña, encriptarla
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(password, salt);
    }

    // Separación de datos para actualización
    let profileData = {};
    let tipoData = {};
    
    // Si se intenta cambiar email o usuario, verificar que no estén en uso
    if (email || usuario) {
      const filtro = [];
      if (email) filtro.push({ email });
      if (usuario) filtro.push({ usuario });

      const existeUsuario = await Usuario.findOne({ 
        $and: [
          { _id: { $ne: req.user._id } },
          { $or: filtro }
        ] 
      });

      if (existeUsuario) {
        return res.status(400).json({
          status: 'error',
          message: 'El email o nombre de usuario ya está en uso por otra cuenta'
        });
      }

      if (email) userData.email = email;
      if (usuario) userData.usuario = usuario;
    }
    
    // Separar datos según el tipo de usuario
    if (req.user.tipo_usuario === 'cliente' || req.user.tipo_usuario === 'administrador') {
      const { 
        DNI, nombres, apellidos, fecha_nacimiento, lugar_nacimiento, 
        genero, direcciones, telefono, telefono_alternativo, foto_perfil, 
        ...restTipoData 
      } = restData;
      
      if (DNI || nombres || apellidos || fecha_nacimiento || lugar_nacimiento || 
          genero || direcciones || telefono || telefono_alternativo || foto_perfil) {
        profileData = {};
        if (DNI) profileData.DNI = DNI;
        if (nombres) profileData.nombres = nombres;
        if (apellidos) profileData.apellidos = apellidos;
        if (fecha_nacimiento) profileData.fecha_nacimiento = fecha_nacimiento;
        if (lugar_nacimiento) profileData.lugar_nacimiento = lugar_nacimiento;
        if (genero) profileData.genero = genero;
        if (direcciones) profileData.direcciones = direcciones;
        if (telefono) profileData.telefono = telefono;
        if (telefono_alternativo) profileData.telefono_alternativo = telefono_alternativo;
        if (foto_perfil) profileData.foto_perfil = foto_perfil;
      }
      
      tipoData = Object.keys(restTipoData).length > 0 ? restTipoData : undefined;
    } else {
      tipoData = Object.keys(restData).length > 0 ? restData : undefined;
    }

    // Actualizar usuario con los datos separados
    const usuarioActualizado = await actualizarUsuario(
      req.user._id,
      Object.keys(userData).length > 0 ? userData : undefined,
      Object.keys(profileData).length > 0 ? profileData : undefined,
      tipoData
    );
    
    // Eliminar password por seguridad
    if (usuarioActualizado && usuarioActualizado.password) {
      delete usuarioActualizado.password;
    }

    res.status(200).json({
      status: 'success',
      data: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar usuario (desactivación lógica)
 * @route   DELETE /api/v1/users/profile
 * @access  Private
 */
const deleteUser = async (req, res) => {
  try {
    // Desactivación lógica del usuario
    await desactivarUsuario(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Usuario desactivado correctamente',
    });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al desactivar usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener todos los usuarios
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtros
    const filtro = {};
    if (req.query.tipo) filtro.tipo_usuario = req.query.tipo;
    if (req.query.activo !== undefined) filtro.activo = req.query.activo === 'true';

    // Contar total de usuarios que coinciden con el filtro
    const total = await Usuario.countDocuments(filtro);

    // Obtener usuarios paginados (solo datos básicos)
    const usuarios = await Usuario.find(filtro)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ fecha_registro: -1 });

    res.status(200).json({
      status: 'success',
      resultados: usuarios.length,
      paginacion: {
        pagina: page,
        limite: limit,
        total,
        paginas: Math.ceil(total / limit),
      },
      data: usuarios,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener un usuario por ID
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res) => {
  try {
    // Obtener información completa del usuario
    const usuarioCompleto = await obtenerUsuarioCompleto(req.params.id);
    
    if (!usuarioCompleto) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
    }
    
    // Eliminar password por seguridad
    if (usuarioCompleto.password) {
      delete usuarioCompleto.password;
    }

    res.status(200).json({
      status: 'success',
      data: usuarioCompleto,
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un usuario por ID (admin)
 * @route   PUT /api/v1/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res) => {
  try {
    // Verificar si el usuario existe
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
    }

    // El usuario root no puede ser modificado excepto por otro root
    if (usuario.tipo_usuario === 'root' && req.user.tipo_usuario !== 'root') {
      return res.status(403).json({
        status: 'error',
        message: 'No tiene permisos para modificar un usuario root'
      });
    }

    const { password, email, usuario: nombreUsuario, ...restData } = req.body;
    
    // Datos a actualizar en el esquema de usuario base
    const userData = {};
    
    // Si se incluye nueva contraseña, encriptarla
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(password, salt);
    }

    // Si se intenta cambiar email o usuario, verificar que no estén en uso
    if (email || nombreUsuario) {
      const filtro = [];
      if (email) filtro.push({ email });
      if (nombreUsuario) filtro.push({ usuario: nombreUsuario });

      const existeUsuario = await Usuario.findOne({ 
        $and: [
          { _id: { $ne: req.params.id } },
          { $or: filtro }
        ] 
      });

      if (existeUsuario) {
        return res.status(400).json({
          status: 'error',
          message: 'El email o nombre de usuario ya está en uso por otra cuenta'
        });
      }

      if (email) userData.email = email;
      if (nombreUsuario) userData.usuario = nombreUsuario;
    }
    
    // Separar datos según el tipo de usuario
    let profileData = {};
    let tipoData = {};
    
    if (usuario.tipo_usuario === 'cliente' || usuario.tipo_usuario === 'administrador') {
      const { 
        DNI, nombres, apellidos, fecha_nacimiento, lugar_nacimiento, 
        genero, direcciones, telefono, telefono_alternativo, foto_perfil, 
        ...restTipoData 
      } = restData;
      
      if (DNI || nombres || apellidos || fecha_nacimiento || lugar_nacimiento || 
          genero || direcciones || telefono || telefono_alternativo || foto_perfil) {
        profileData = {};
        if (DNI) profileData.DNI = DNI;
        if (nombres) profileData.nombres = nombres;
        if (apellidos) profileData.apellidos = apellidos;
        if (fecha_nacimiento) profileData.fecha_nacimiento = fecha_nacimiento;
        if (lugar_nacimiento) profileData.lugar_nacimiento = lugar_nacimiento;
        if (genero) profileData.genero = genero;
        if (direcciones) profileData.direcciones = direcciones;
        if (telefono) profileData.telefono = telefono;
        if (telefono_alternativo) profileData.telefono_alternativo = telefono_alternativo;
        if (foto_perfil) profileData.foto_perfil = foto_perfil;
      }
      
      tipoData = Object.keys(restTipoData).length > 0 ? restTipoData : undefined;
    } else {
      tipoData = Object.keys(restData).length > 0 ? restData : undefined;
    }

    // Actualizar usuario con los datos separados
    const usuarioActualizado = await actualizarUsuario(
      req.params.id,
      Object.keys(userData).length > 0 ? userData : undefined,
      Object.keys(profileData).length > 0 ? profileData : undefined,
      tipoData
    );
    
    // Eliminar password por seguridad
    if (usuarioActualizado && usuarioActualizado.password) {
      delete usuarioActualizado.password;
    }

    res.status(200).json({
      status: 'success',
      data: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar un usuario por ID (admin)
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
const deleteUserById = async (req, res) => {
  try {
    // Verificar si el usuario existe
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
    }

    // El usuario root no puede ser eliminado excepto por otro root
    if (usuario.tipo_usuario === 'root' && req.user.tipo_usuario !== 'root') {
      return res.status(403).json({
        status: 'error',
        message: 'No tiene permisos para eliminar un usuario root'
      });
    }

    // Verificar que un usuario no se elimine a sí mismo
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        status: 'error',
        message: 'No puede eliminar su propia cuenta por esta vía'
      });
    }

    // Desactivación lógica del usuario
    await desactivarUsuario(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Usuario desactivado correctamente',
    });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al desactivar usuario',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUserById
};