import { PrismaClient, Rol } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  // Campos específicos según el rol
  nit?: string; // Para EMPRESA
  nombreEmpresa?: string; // Para EMPRESA
  habilidades?: string; // Para ESTUDIANTE
  perfil?: string; // Para ESTUDIANTE
}

const crearEmpresa = async (
  nombre: string,
  email: string,
  hashedPassword: string,
  nit: string,
  nombreEmpresa: string
) => {
  if (!nit || !nombreEmpresa) {
    throw new Error('Para registrar una empresa, se requiere NIT y nombre de la empresa');
  }

  return await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: hashedPassword,
      rol: Rol.EMPRESA,
      empresa: {
        create: {
          nombre: nombreEmpresa,
          nit
        }
      }
    },
    include: {
      empresa: true
    }
  });
};

const crearDirector = async (
  nombre: string,
  email: string,
  hashedPassword: string
) => {
  return await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: hashedPassword,
      rol: Rol.DIRECTOR,
      director: {
        create: {}
      }
    },
    include: {
      director: true
    }
  });
};

const crearEstudiante = async (
  nombre: string,
  email: string,
  hashedPassword: string,
  habilidades?: string,
  perfil?: string
) => {
  return await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: hashedPassword,
      rol: Rol.ESTUDIANTE,
      estudiante: {
        create: {
          habilidades: habilidades || null,
          perfil: perfil || null
        }
      }
    },
    include: {
      estudiante: true
    }
  });
};

export const register = async (data: RegisterData) => {
  const { nombre, email, password, rol, nit, nombreEmpresa, habilidades, perfil } = data;

  // Verificar si el usuario ya existe
  const usuarioExiste = await prisma.usuario.findUnique({
    where: { email }
  });

  if (usuarioExiste) {
    throw new Error('El email ya está registrado');
  }

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Map de funciones por rol
  const creadores = {
    [Rol.EMPRESA]: () => crearEmpresa(nombre, email, hashedPassword, nit!, nombreEmpresa!),
    [Rol.DIRECTOR]: () => crearDirector(nombre, email, hashedPassword),
    [Rol.ESTUDIANTE]: () => crearEstudiante(nombre, email, hashedPassword, habilidades, perfil)
  };

  const creador = creadores[rol];
  
  if (!creador) {
    throw new Error('Rol no válido');
  }

  const usuario = await creador();

  // Remover password del objeto de respuesta
  const { password: _, ...usuarioSinPassword } = usuario;

  return usuarioSinPassword;
};

export const login = async (email: string, password: string) => {
  // Buscar usuario
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: {
      empresa: true,
      director: true,
      estudiante: true
    }
  });

  if (!usuario) {
    throw new Error('Credenciales inválidas');
  }

  // Verificar contraseña
  const passwordValida = await bcrypt.compare(password, usuario.password);

  if (!passwordValida) {
    throw new Error('Credenciales inválidas');
  }

  // Remover password del objeto de respuesta
  const { password: _, ...usuarioSinPassword } = usuario;

  return usuarioSinPassword;
};