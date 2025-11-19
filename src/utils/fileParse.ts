
import * as XLSX from "xlsx";
import { Readable } from "stream";
import csvParser from "csv-parser";

export async function leerCSV<T = Record<string, any>>(file: Express.Multer.File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const resultados: T[] = [];

    // Convertimos el buffer a stream legible
    const stream = Readable.from(file.buffer);

    stream
      .pipe(csvParser())
      .on("data", (data) => resultados.push(data))
      .on("end", () => resolve(resultados))
      .on("error", (err) => reject(err));
  });
}

export function leerExcel<T = Record<string, any>>(file: Express.Multer.File): T[] {
  // Leer el workbook directamente desde el buffer
  const workbook = XLSX.read(file.buffer, { type: "buffer" });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  

  return data as T[];
}