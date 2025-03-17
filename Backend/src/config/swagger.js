// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Opciones de configuración para la documentación Swagger/OpenAPI
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Librosfera',
      version: '1.0.0',
      description: 'API RESTful para la tienda de libros Librosfera',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'dev@librosfera.com'
      },
      license: {
        name: 'Privada',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.librosfera.com/api/v1',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Usuario: {
          type: 'object',
          required: ['usuario', 'email', 'password', 'tipo_usuario'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del usuario',
              example: '60d0fe4f5311236168a109ca'
            },
            usuario: {
              type: 'string',
              description: 'Nombre de usuario',
              example: 'juanperez'
            },
            email: {
              type: 'string',
              description: 'Correo electrónico',
              example: 'juan@ejemplo.com'
            },
            tipo_usuario: {
              type: 'string',
              enum: ['cliente', 'administrador', 'root'],
              description: 'Tipo de usuario',
              example: 'cliente'
            },
            activo: {
              type: 'boolean',
              description: 'Indica si el usuario está activo',
              example: true
            },
            fecha_registro: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de registro',
              example: '2021-06-22T12:00:00.000Z'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Error al procesar la solicitud'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/models/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;