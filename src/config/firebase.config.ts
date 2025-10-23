import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config(); // Carga variables desde .env

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!serviceAccount.private_key || !serviceAccount.client_email) {
  console.error("❌ Error: Variables de entorno de Firebase no configuradas correctamente.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;
