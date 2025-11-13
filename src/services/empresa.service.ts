import { EstadoEmpresa, PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMailWithTemplate } from '../utils/mailer.js';

const prisma = new PrismaClient();

export const registrarEmpresa = async (data: any) => {
  const {
    nombre,
    email,
    nit,
    telefono,
    direccion,
    sector,
    descripcion,
    // Datos del representante legal
    representante
  } = data;

  const existeEmail = await prisma.usuario.findUnique({ where: { email } });
  if (existeEmail) throw new Error("Ya existe un usuario registrado con este correo");

  const existeNit = await prisma.empresa.findUnique({ where: { nit } });
  if (existeNit) throw new Error("Ya existe una empresa registrada con este NIT");

  // Validar datos del representante legal
  if (!representante?.nombreCompleto || !representante?.tipoDocumento ||
      !representante?.numeroDocumento || !representante?.cargo || !representante?.email) {
    throw new Error("Los datos del representante legal son obligatorios");
  }

  // Verificar que el número de documento del representante no esté duplicado
  const documentoDuplicado = await prisma.representanteLegal.findUnique({
    where: { numeroDocumento: representante.numeroDocumento },
  });

  if (documentoDuplicado) {
    throw new Error("El número de documento del representante legal ya está registrado");
  }

  // Crear todo en una transacción
  const result = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nombre,
        email,
        rol: "EMPRESA",
      },
    });

    const empresa = await tx.empresa.create({
      data: {
        usuarioId: usuario.id,
        nit,
        telefono,
        direccion,
        sector,
        descripcion,
      },
    });

    // Crear representante legal
    const representanteLegal = await tx.representanteLegal.create({
      data: {
        empresaId: empresa.id,
        nombreCompleto: representante.nombreCompleto,
        tipoDocumento: representante.tipoDocumento,
        numeroDocumento: representante.numeroDocumento,
        cargo: representante.cargo,
        telefono: representante.telefono,
        email: representante.email,
      },
    });

    return { empresa, representanteLegal };
  });

  return result;
};

export const aprobarEmpresa = async (id: number) => {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) throw new Error("Empresa no encontrada"); // ✅ Validación

  const empresaActualizada = await prisma.empresa.update({
    where: { id },
    data: { estado: EstadoEmpresa.APROBADA },
    include: { usuario: true },
  });

  // Generar contraseña y enviar correo
  const nuevaPassword = Math.random().toString(36).slice(-10);
  const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

  await prisma.usuario.update({
    where: { id: empresa.usuarioId },
    data: { password: hashedPassword },
  });

  await sendMailWithTemplate(
    empresaActualizada.usuario.email,
    process.env.SENDGRID_TEMPLATE_EMPRESA_APROBADA || 'd-default-template-id',
    {
      nombre: empresaActualizada.usuario.nombre,
      nit: empresa.nit,
      contrasena: nuevaPassword,
    }
  );

  return empresaActualizada;
};

export const rechazarEmpresa = async (id: number) => {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) throw new Error("Empresa no encontrada");
  const empresaActualizada = await prisma.empresa.update({
    where: { id },
    data: { estado: EstadoEmpresa.RECHAZADA },
    include: { usuario: true },
  });
  return empresaActualizada;
};

export const toggleEstadoEmpresa = async (id: number) => {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) throw new Error("Empresa no encontrada");

  let nuevoEstado: EstadoEmpresa;
  if (empresa.estado === EstadoEmpresa.HABILITADA) {
    nuevoEstado = EstadoEmpresa.INHABILITADA;
  } else if (empresa.estado === EstadoEmpresa.INHABILITADA) {
    nuevoEstado = EstadoEmpresa.HABILITADA;
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

export const obtenerEmpresasPendientes = async (params: {
  page?: number;
  pageSize?: number;
  nombre?: string;
  correo?: string;
  nit?: string;
  sector?: string;
}) => {
  const { page = 1, pageSize = 10, nombre, correo, nit, sector } = params;

  const where: any = {
    estado: "PENDIENTE",
    AND: [
      ...(sector ? [{ sector: { contains: sector, mode: "insensitive" } }] : []),
      ...(nombre ? [{ usuario: { nombre: { contains: nombre, mode: "insensitive" } } }] : []),
      ...(correo ? [{ usuario: { email: { contains: correo, mode: "insensitive" } } }] : []),
      ...(nit ? [{ nit: { contains: nit, mode: "insensitive" } }] : []),
    ],
  };

  const [data, total] = await Promise.all([
    prisma.empresa.findMany({
      where,
      include: { usuario: { select: { nombre: true, email: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.empresa.count({ where }),
  ]);

  return { data, total, page, pageSize };
};

export const obtenerEmpresas = async (params: {
  page?: number;
  pageSize?: number;
  estado?: string;
  nombre?: string;
  correo?: string;
  nit?: string;
  sector?: string;
}) => {
  const { page = 1, pageSize = 10, estado, nombre, correo, nit, sector } = params;

  const where: any = {
    AND: [
      // Estado
      estado
        ? { estado }
        : { estado: { notIn: ["PENDIENTE"] } },

      ...(sector ? [{ sector: { contains: sector, mode: "insensitive" } }] : []),
      ...(nombre ? [{ usuario: { nombre: { contains: nombre, mode: "insensitive" } } }] : []),
      ...(correo ? [{ usuario: { email: { contains: correo, mode: "insensitive" } } }] : []),
      ...(nit ? [{ nit: { contains: nit, mode: "insensitive" } }] : []),
    ],
  };

  const [data, total] = await Promise.all([
    prisma.empresa.findMany({
      where,
      include: { usuario: { select: { nombre: true, email: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.empresa.count({ where }),
  ]);

  return { data, total, page, pageSize };
};

export const obtenerEmpresaPorId = async (id: number) => {
  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: {
      usuario: {
        select: { id: true, nombre: true, email: true },
      },
      representanteLegal: true,
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
      representanteLegal: true,
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

  if (!empresaExistente) throw new Error("Empresa no encontrada");

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

    return tx.empresa.update({
      where: { id },
      data: updatesEmpresa,
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
      },
    });
  });
  // Asegurarte de devolver también los campos que no se modificaron
  return {
    id: empresaActualizada.id,
    usuarioId: empresaActualizada.usuarioId,
    directorId: empresaActualizada.directorId ?? null,
    estado: empresaActualizada.estado,
    createdAt: empresaActualizada.createdAt,
    nit: empresaActualizada.nit,
    telefono: empresaActualizada.telefono,
    direccion: empresaActualizada.direccion,
    sector: empresaActualizada.sector,
    descripcion: empresaActualizada.descripcion,
    usuario: empresaActualizada.usuario,
  };
};

export const listarEmpresasSelector = async () => {
  const empresas = await prisma.empresa.findMany({
    where: { estado: EstadoEmpresa.APROBADA }, // opcional: solo activas/aprobadas
    select: {
      id: true,
      usuario: { select: { nombre: true } }
    },
    orderBy: { usuario: { nombre: 'asc' } }
  });

  // Devolver en formato {id, nombre}
  return empresas.map(e => ({ id: e.id, nombre: e.usuario.nombre }));
};


export const crearEmpresaPorDirector = async (data: any, directorId: number) => {
  const {
    nombre,
    email,
    nit,
    telefono,
    direccion,
    sector,
    descripcion,
    // Datos del representante legal
    representante
  } = data;

  // Validar que el correo y el NIT sean únicos
  const existeEmail = await prisma.usuario.findUnique({ where: { email } });
  if (existeEmail) throw new Error("Ya existe un usuario registrado con este correo");

  const existeNit = await prisma.empresa.findUnique({ where: { nit } });
  if (existeNit) throw new Error("Ya existe una empresa registrada con este NIT");

  // Validar datos del representante legal
  if (!representante?.nombreCompleto || !representante?.tipoDocumento ||
      !representante?.numeroDocumento || !representante?.cargo || !representante?.email) {
    throw new Error("Los datos del representante legal son obligatorios");
  }

  // Verificar que el número de documento del representante no esté duplicado
  const documentoDuplicado = await prisma.representanteLegal.findUnique({
    where: { numeroDocumento: representante.numeroDocumento },
  });

  if (documentoDuplicado) {
    throw new Error("El número de documento del representante legal ya está registrado");
  }

  // 🔐 Generar contraseña automática
  const passwordGenerada = Math.random().toString(36).slice(-10);
  const hashedPassword = await bcrypt.hash(passwordGenerada, 10);

  // Crear todo en una transacción
  const result = await prisma.$transaction(async (tx) => {
    // Crear el usuario con rol EMPRESA
    const usuario = await tx.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: "EMPRESA",
      },
    });

    // Crear la empresa con estado APROBADA y asociar al director
    const empresa = await tx.empresa.create({
      data: {
        usuarioId: usuario.id,
        nit,
        telefono,
        direccion,
        sector,
        descripcion,
        estado: EstadoEmpresa.APROBADA,
        directorId,
      },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
      },
    });

    // Crear representante legal
    const representanteLegal = await tx.representanteLegal.create({
      data: {
        empresaId: empresa.id,
        nombreCompleto: representante.nombreCompleto,
        tipoDocumento: representante.tipoDocumento,
        numeroDocumento: representante.numeroDocumento,
        cargo: representante.cargo,
        telefono: representante.telefono,
        email: representante.email,
      },
    });

    return { empresa, representanteLegal };
  });

  // Enviar correo con plantilla de SendGrid
  await sendMailWithTemplate(
    email,
    process.env.SENDGRID_TEMPLATE_EMPRESA_APROBADA || 'd-default-template-id',
    {
      nombre: nombre,
      nit: nit,
      contrasena: passwordGenerada,
    }
  );

  return result.empresa;
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

  await sendMailWithTemplate(
    usuario.email,
    process.env.SENDGRID_TEMPLATE_RECUPERACION_PASSWORD || 'd-default-template-id',
    {
      nombre: usuario.nombre,
      enlace: enlace,
    }
  );

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