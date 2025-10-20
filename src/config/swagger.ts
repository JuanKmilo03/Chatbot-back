import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from "./env.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Chatbot',
      version: '1.0.0',
      description: 'Documentación de la API del chatbot',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
      },
    ],
  },
  apis: [path.join(__dirname, '../routes/*.ts')],
};

export const swaggerSpec = swaggerJSDoc(options);


