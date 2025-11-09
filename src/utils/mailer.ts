import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Configurar API key al inicio
const initializeSendGrid = () => {
  const apiKey = process.env.MAIL_PASS;
  if (!apiKey) {
    console.warn('⚠️  MAIL_PASS no está configurado en las variables de entorno');
  }
  sgMail.setApiKey(apiKey as string);
};

initializeSendGrid();

/**
 * Envía un correo usando una plantilla dinámica de SendGrid
 * @param to - Correo del destinatario
 * @param templateId - ID de la plantilla en SendGrid (d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
 * @param dynamicTemplateData - Objeto con los datos dinámicos que se usarán en la plantilla
 */
export const sendMailWithTemplate = async (
  to: string,
  templateId: string,
  dynamicTemplateData: Record<string, any>
) => {
  // Reinicializar SendGrid con la API key actual por si cambió
  initializeSendGrid();

  const msg = {
    to,
    from: process.env.MAIL_FROM || 'practicas@dominio.com',
    templateId,
    dynamicTemplateData,
  };

  try {
    const info = await sgMail.send(msg);
    console.log('Correo con plantilla enviado:', info[0].statusCode);
    return info;
  } catch (error) {
    console.error('Error enviando correo con plantilla:', error);
    throw error;
  }
};
