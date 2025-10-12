import { sendMail } from "./utils/mailer";

sendMail(
  "enviadormilo@gmail.com",
  "Prueba de envío",
  "<h1>Funciona el mailer ✅</h1>"
);