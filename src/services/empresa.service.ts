import { EstadoGeneral, PrismaClient } from '@prisma/client';
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

// export const actualizarEstadoEmpresa = async (id: number, estado: "PENDIENTE" | "APROBADA" | "RECHAZADA") => {
//   const empresa = await prisma.empresa.update({
//     where: { id },
//     data: { estado },
//     include: { usuario: true },
//   });

//   if (estado === "APROBADA") {
//     // Generar contraseña aleatoria
//     const nuevaPassword = Math.random().toString(36).slice(-10);
//     const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

//     // Actualizar usuario con nueva contraseña
//     await prisma.usuario.update({
//       where: { id: empresa.usuarioId },
//       data: { password: hashedPassword },
//     });

//     // Enviar correo
//     const html = `
//       <h2>Tu solicitud ha sido aprobada 🎉</h2>
//       <p>Hola ${empresa.usuario.nombre},</p>
//       <p>Tu empresa ha sido aprobada en la plataforma. Aquí tienes tu nueva contraseña:</p>
//       <p><b>${nuevaPassword}</b></p>
//       <p>Por favor, inicia sesión y cámbiala lo antes posible.</p>
//       <br>
//       <p>Atentamente,<br>Equipo EMSITEL</p>
//     `;

//     await sendMail(empresa.usuario.email, "Aprobación de empresa - EMSITEL", html);
//   }

//   return empresa;
// };

export const aprobarEmpresa = async (id: number) => {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) throw new Error("Empresa no encontrada"); // ✅ Validación

  const empresaActualizada = await prisma.empresa.update({
    where: { id },
    data: { estado: EstadoGeneral.APROBADA },
    include: { usuario: true },
  });

  // Generar contraseña y enviar correo
  const nuevaPassword = Math.random().toString(36).slice(-10);
  const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

  await prisma.usuario.update({
    where: { id: empresa.usuarioId },
    data: { password: hashedPassword },
  });

  const html = `
    <h2>Tu solicitud ha sido aprobada</h2>
    <p>Hola ${empresaActualizada .usuario.nombre},</p>
    <p>Tu empresa ha sido aprobada en la plataforma. Aquí tienes tu nueva contraseña:</p>
    <p><b>${nuevaPassword}</b></p>
    <p>Por favor, inicia sesión y cámbiala lo antes posible.</p>
    <br>
    <p>Atentamente,<br>la UFPS</p>
  `;

  await sendMail(empresaActualizada.usuario.email, "Aprobación de empresa", html);

  return empresaActualizada;
};

export const rechazarEmpresa = async (id: number) => {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) throw new Error("Empresa no encontrada");
  const empresaActualizada = await prisma.empresa.update({
    where: { id },
    data: { estado: EstadoGeneral.RECHAZADA },
    include: { usuario: true },
  });
  return empresaActualizada;
};

export const toggleEstadoEmpresa = async (id: number) => {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) throw new Error("Empresa no encontrada");

  let nuevoEstado: EstadoGeneral;
  if (empresa.estado === EstadoGeneral.APROBADA) {
    nuevoEstado = EstadoGeneral.INACTIVA;
  } else if (empresa.estado === EstadoGeneral.INACTIVA) {
    nuevoEstado = EstadoGeneral.APROBADA;
  } else {
    throw new Error("Solo se pueden activar/desactivar empresas aprobadas");
  }

  return await prisma.empresa.update({
    where: { id },
    data: { estado: nuevoEstado },
    include: { usuario: true },
  });
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

export const obtenerEmpresas = async () => {
  const empresas = await prisma.empresa.findMany({
    where: { estado: {
      notIn: ["PENDIENTE"]
    } },
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

export const obtenerEmpresaPorId = async (id: number) => {
  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: {
      usuario: {
        select: { id: true, nombre: true, email: true },
      },
    },
  });

  return empresa;
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

//Funciones para recuperar contraseña
export const solicitarRecuperacionContrasenia = async (identificador: string) => {

  const empresa = await prisma.empresa.findUnique({
    where: { nit: identificador },
    include: { usuario: true },
  });

  if (!empresa || !empresa.usuario) {
    throw new Error("Empresa no encontrada");
  }

  const usuario = empresa.usuario;

  const token = jwt.sign(
    { id: usuario.id, tipo: "recuperacion" },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" }
  );

  const enlace = `${process.env.FRONTEND_URL}/recuperar-contrasenia?token=${token}`;

  const html = `
    <h2>Recuperación de contraseña 🔐</h2>
    <p>Hola ${usuario.nombre},</p>
    <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace:</p>
    <p><a href="${enlace}" target="_blank">Restablecer contraseña</a></p>
    <p>Este enlace expirará en 15 minutos.</p>
    <br>
    <p>Si no solicitaste esto, puedes ignorar el correo.</p>
    <br>
    <p>Atentamente,<br>la UFPS</p>
  `;

  await sendMail(usuario.email, "Recuperación de contraseña", html);

  return { message: "Correo de recuperación enviado correctamente" };
};

export const restablecerContrasenia = async (token: string, nuevaPassword: string) => {
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    if (!decoded || decoded.tipo !== "recuperacion") {
      throw new Error("Token inválido");
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.id } });
    if (!usuario) throw new Error("Usuario no encontrado");

    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashedPassword },
    });

    return { message: "Contraseña actualizada correctamente" };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("El enlace de recuperación ha expirado");
    }
    throw new Error("Token inválido o expirado");
  }
};