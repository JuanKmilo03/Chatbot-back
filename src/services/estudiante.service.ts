import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class EstudianteService {
  // Crear estudiante
  static async crear(data: {
    nombre: string;
    email: string;
    password?: string;
    habilidades?: string;
    perfil?: string;
  }) {
    const { nombre, email, password, habilidades, perfil } = data;

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) throw new Error('El correo ya está registrado');

    const hashed = password ? await bcrypt.hash(password, 10) : null;

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashed,
        rol: 'ESTUDIANTE',
      },
    });

    const estudiante = await prisma.estudiante.create({
      data: {
        usuarioId: usuario.id,
        habilidades,
        perfil,
      },
      include: { usuario: true },
    });

    return estudiante;
  }

  // Obtener todos
  static async obtenerTodos() {
    return prisma.estudiante.findMany({
      include: { usuario: true },
    });
  }

  // Obtener por ID
  static async obtenerPorId(id: number) {
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: { usuario: true },
    });

    if (!estudiante) throw new Error('Estudiante no encontrado');
    return estudiante;
  }

  // Actualizar estudiante
  static async actualizar(id: number, data: any) {
    const { nombre, email, habilidades, perfil } = data;

    const existe = await prisma.estudiante.findUnique({ where: { id } });
    if (!existe) throw new Error('Estudiante no encontrado');

    const actualizado = await prisma.estudiante.update({
      where: { id },
      data: {
        habilidades,
        perfil,
        usuario: {
          update: { nombre, email },
        },
      },
      include: { usuario: true },
    });

    return actualizado;
  }

  // Soft delete (marcar inactivo)
  static async softDelete(id: number) {
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: { usuario: true },
    });

    if (!estudiante) throw new Error('Estudiante no encontrado');

    // 👇 Aquí podrías usar un campo `activo` si lo agregas al modelo
    await prisma.usuario.update({
      where: { id: estudiante.usuarioId },
      data: { rol: 'ESTUDIANTE', actualizadoEn: new Date() },
    });

    return { message: 'Estudiante marcado como inactivo' };
  }
}
