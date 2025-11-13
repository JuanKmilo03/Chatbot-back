import { PrismaClient, Rol } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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


export const getUserById = async (userId: number) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      empresa: true,
      estudiante: true,
      director: true,
    },
  });

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  // Evitar enviar el password
  const { password: _, ...usuarioSinPassword } = usuario;
  return usuarioSinPassword;
};

export const changePasswordService = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");
  if (!user.password)
    throw new Error("El usuario no tiene una contraseña registrada");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("Contraseña actual incorrecta");

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.usuario.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { message: "Contraseña actualizada correctamente" };
};