// src/utils/emailService.js
const nodemailer = require('nodemailer');

/**
 * Servicio para el envío de correos electrónicos
 * Utiliza nodemailer con una cuenta de Gmail
 */
class EmailService {
  constructor() {
    // Configuración del transporter de nodemailer con Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'tu-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'tu-contraseña-de-aplicación'
      }
    });
  }

  /**
   * Envía un correo de recuperación de contraseña
   * @param {String} to - Dirección de correo del destinatario
   * @param {String} resetLink - Enlace de restablecimiento de contraseña
   * @param {String} verificationCode - Código de verificación numérico
   * @returns {Promise} Resultado del envío
   */
  async sendPasswordResetEmail(to, resetLink, verificationCode) {
    try {
      // Configuración del correo
      const mailOptions = {
        from: `"Sistema de Recuperación de Contraseña" <${process.env.EMAIL_USER || 'tu-email@gmail.com'}>`,
        to,
        subject: 'Recuperación de Contraseña',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Recuperación de Contraseña</h2>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si no has sido tú, puedes ignorar este correo.</p>
            <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Restablecer Contraseña</a>
            </div>
            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; background-color: #f7f7f7; padding: 10px; border-radius: 4px;">${resetLink}</p>
            <p>También necesitarás el siguiente código de verificación cuando se te solicite:</p>
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #333; background-color: #f0f0f0; padding: 10px; border-radius: 4px; display: inline-block;">${verificationCode}</p>
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #777; text-align: center;">
              Este enlace y código caducarán en 1 hora por razones de seguridad.<br>
              Si no solicitaste este cambio, por favor contacta con nosotros inmediatamente.
            </p>
          </div>
        `
      };

      // Enviar el correo
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo de recuperación enviado:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      throw error;
    }
  }

  /**
   * Envía un correo de confirmación de cambio de contraseña
   * @param {String} to - Dirección de correo del destinatario
   * @returns {Promise} Resultado del envío
   */
  async sendPasswordChangedEmail(to) {
    try {
      // Configuración del correo
      const mailOptions = {
        from: `"Sistema de Seguridad" <${process.env.EMAIL_USER || 'tu-email@gmail.com'}>`,
        to,
        subject: 'Contraseña Actualizada con Éxito',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Contraseña Actualizada</h2>
            <p>Tu contraseña ha sido actualizada con éxito.</p>
            <p>Si no has realizado este cambio, por favor contacta inmediatamente con nuestro equipo de soporte o intenta recuperar tu cuenta.</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONT_URL || 'https://tusitio.com'}/contacto" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Contactar Soporte</a>
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #777; text-align: center;">
              Este es un mensaje automático, por favor no respondas a este correo.
            </p>
          </div>
        `
      };

      // Enviar el correo
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo de confirmación enviado:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error al enviar correo de confirmación:', error);
      throw error;
    }
  }
}

// Exportar instancia del servicio
module.exports = new EmailService();