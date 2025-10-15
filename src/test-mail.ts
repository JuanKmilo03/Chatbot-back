import { sendMail } from "./utils/mailer.js";

sendMail(
  "enviadormilo@gmail.com",
  "Prueba de envío",
  "<h1>Funciona el mailer ✅</h1>"
);