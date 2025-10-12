import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
     dest: "uploads/",
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 mb de tam maximo
});

