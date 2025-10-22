import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.MAIL_PASS as string);

export const sendMail = async (to: string, subject: string, html: string) => {
  const msg = {
    to,
    from: process.env.MAIL_FROM || 'practicas@dominio.com',
    subject,
    html,
  };

  try {
    const info = await sgMail.send(msg);
    console.log('✅ Correo enviado:', info[0].statusCode);
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    throw error;
  }
};
