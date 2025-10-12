import { PrismaClient, EstadoGeneral } from '@prisma/client';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const registrarEmpresa = async (data: any) => {
  const { nombre, email, password, nit, telefono, direccion, sector, descripcion } = data;

  // Verificar si ya existe
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) throw new Error("Ya existe un usuario registrado con este correo");

  // Crear usuario
  const hashedPassword = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: hashedPassword,
      rol: "EMPRESA",
    },
  });

  // Crear empresa asociada
  const empresa = await prisma.empresa.create({
    data: {
      usuarioId: usuario.id,
      nit,
      telefono,
      direccion,
      sector,
      descripcion,
    },
  });

  return empresa;
};

export const loginEmpresa = async (email: string, password: string) => {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) throw new Error("Usuario no encontrado");

  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido) throw new Error("Contraseña incorrecta");

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return token;
};

export const obtenerEmpresasPendientes = async () => {
  const empresas = await prisma.empresa.findMany({
    where: { estado: "PENDIENTE" },
    include: {
      usuario: {
        select: {
          nombre: true,
          email: true,
        },
      },
    },
  });

  return empresas;
};

export const actualizarEstadoEmpresa = async (id: number, estado: EstadoGeneral) => {
  const empresa = await prisma.empresa.update({
    where: { id },
    data: { estado },
  });
  return empresa;
};
