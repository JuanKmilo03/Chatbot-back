import { PrismaClient, Rol } from "@prisma/client";

const prisma = new PrismaClient();

export async function generarCodigoSeguridad(prisma: any) {
 const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let codigo = "";
  let existe = true;

  while (existe) {
    codigo = "";
    for (let i = 0; i < 8; i++) {
      codigo += chars[Math.floor(Math.random() * chars.length)];
    }

    const usuario = await prisma.usuario.findFirst({
      where: { codigoSeguridad: codigo }
    });

    existe = !!usuario;
  }

  return codigo;
}
export async function generarCodigoUsuario(rol: string, prisma: any) {
let prefijo = "";

  switch (rol) {
    case "ESTUDIANTE": prefijo = "UEST"; break;
    case "EMPRESA":    prefijo = "UEMP"; break;
    case "DIRECTOR":   prefijo = "UDIR"; break;
    default:           prefijo = "UADM";
  }

  let codigo = "";
  let existe = true;

  while (existe) {
    const numero = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    codigo = `${prefijo}${numero}`;

    const encontrado = await prisma.usuario.findFirst({
      where: { codigoUsuario: codigo }
    });

    existe = !!encontrado;
  }

  return codigo;
}
