import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from '../utils/mailer.js';

const prisma = new PrismaClient();

export const registrarEmpresa = async (data: any) => {
  const { nombre, email, nit, telefono, direccion, sector, descripcion } = data;

  const existeEmail = await prisma.usuario.findUnique({ where: { email } });
  if (existeEmail) throw new Error("Ya existe un usuario registrado con este correo");

  const existeNit = await prisma.empresa.findUnique({ where: { nit } });
  if (existeNit) throw new Error("Ya existe un usuario registrado con este correo");

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      rol: "EMPRESA",
    },
  });

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

export const actualizarEstadoEmpresa = async (id: number, estado: "PENDIENTE" | "APROBADA" | "RECHAZADA") => {
  const empresa = await prisma.empresa.update({
    where: { id },
    data: { estado },
    include: { usuario: true },
  });

  if (estado === "APROBADA") {
    // Generar contraseña aleatoria
    const nuevaPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar usuario con nueva contraseña
    await prisma.usuario.update({
      where: { id: empresa.usuarioId },
      data: { password: hashedPassword },
    });

    // Enviar correo
    const html = `
      <h2>Tu solicitud ha sido aprobada 🎉</h2>
      <p>Hola ${empresa.usuario.nombre},</p>
      <p>Tu empresa ha sido aprobada en la plataforma. Aquí tienes tu nueva contraseña:</p>
      <p><b>${nuevaPassword}</b></p>
      <p>Por favor, inicia sesión y cámbiala lo antes posible.</p>
      <br>
      <p>Atentamente,<br>Equipo EMSITEL</p>
    `;

    await sendMail(empresa.usuario.email, "Aprobación de empresa - EMSITEL", html);
  }

  return empresa;
};


export const loginEmpresa = async (nit: string, password: string) => {
  const empresa = await prisma.empresa.findUnique({ where: { nit }, include: { usuario: true } });
  if (!empresa?.usuario) throw new Error("Usuario no encontrado");
  const usuario = empresa?.usuario;

  if (!usuario.password) {
    throw new Error("Tu cuenta aún no ha sido aprobada o activada.");
  }

  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido) throw new Error("Contraseña incorrecta");

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  const { password: _password, ...usuarioSafe } = usuario;

  return {
    message: "empresa logueada correctamente",
    usuario: usuarioSafe,
    token
  };
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

export const obtenerEmpresaPorUsuarioId = async (usuarioId: number) => {
  const empresa = await prisma.empresa.findUnique({
    where: { usuarioId },
    include: {
      usuario: {
        select: { id: true, nombre: true, email: true },
      },
    },
  });

  return empresa;
};

export const editarEmpresa = async (
  id: number,
  data: {
    nombre?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    sector?: string;
    descripcion?: string;
  }
) => {
  // Verificar si la empresa existe
  const empresaExistente = await prisma.empresa.findUnique({
    where: { id },
    include: { usuario: true },
  });

  if (!empresaExistente) {
    throw new Error("Empresa no encontrada");
  }

  const updatesEmpresa: any = {};
  const updatesUsuario: any = {};

  // Construir los datos a actualizar (solo campos válidos)
  if (data.telefono !== undefined) updatesEmpresa.telefono = data.telefono;
  if (data.direccion !== undefined) updatesEmpresa.direccion = data.direccion;
  if (data.sector !== undefined) updatesEmpresa.sector = data.sector;
  if (data.descripcion !== undefined) updatesEmpresa.descripcion = data.descripcion;

  if (data.nombre !== undefined) updatesUsuario.nombre = data.nombre;

  if (data.email !== undefined) {
    // Validar que el nuevo correo no esté tomado por otro usuario
    const existeEmail = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existeEmail && existeEmail.id !== empresaExistente.usuarioId) {
      throw new Error("Ya existe un usuario registrado con este correo");
    }
    updatesUsuario.email = data.email;
  }

  // Ejecutar actualización dentro de una transacción
  const empresaActualizada = await prisma.$transaction(async (tx) => {
    if (Object.keys(updatesUsuario).length > 0) {
      await tx.usuario.update({
        where: { id: empresaExistente.usuarioId },
        data: updatesUsuario,
      });
    }

    const empresa = await tx.empresa.update({
      where: { id },
      data: updatesEmpresa,
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
      },
    });

    return empresa;
  });

  return empresaActualizada;
};