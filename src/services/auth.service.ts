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
  const { nombre, email, password, rol, habilidades, perfil } = data;

  const usuarioExiste = await prisma.usuario.findUnique({ where: { email } });
  if (usuarioExiste) throw new Error("El email ya está registrado");

  const hashedPassword = await bcrypt.hash(password, 10);

  const creadores = {
    [Rol.DIRECTOR]: () => crearDirector(nombre, email, hashedPassword),
    [Rol.ESTUDIANTE]: () => crearEstudiante(nombre, email, hashedPassword, habilidades, perfil),
  };

  const creador = creadores[Rol.DIRECTOR];
  if (!creador) throw new Error("Rol no válido");

  const usuario = await creador();

  // No devolver contraseña
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

  if (!usuario.password) {
    throw new Error('No hay contraseña');
  }

  // Verificar contraseña
  const passwordValida = await bcrypt.compare(password, usuario?.password);

  if (!passwordValida) {
    throw new Error('Credenciales inválidas');
  }

  // Remover password del objeto de respuesta
  const { password: _, ...usuarioSinPassword } = usuario;

  return usuarioSinPassword;
};