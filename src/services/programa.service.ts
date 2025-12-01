import { prisma } from "../config/db.js";


export const crearPrograma = async ({ nombre, facultad }: any) => {
  if (!nombre || !facultad) throw new Error("Nombre y facultad son obligatorios");

  const existe = await prisma.programa.findUnique({ where: { nombre } });
  if (existe) throw new Error("Ya existe un programa con este nombre");

  return prisma.programa.create({
    data: { nombre, facultad },
  });
};

export const obtenerProgramas = () => {
  return prisma.programa.findMany({
    include: {
      directores: true,
      empresas: true,
      estudiantes: true,
    },
  });
};

export const obtenerProgramaPorId = async (id: number) => {
  const programa = await prisma.programa.findUnique({
    where: { id },
    include: {
      directores: true,
      empresas: true,
      estudiantes: true,
    },
  });

  if (!programa) throw new Error("Programa no encontrado");

  return programa;
};

export const actualizarPrograma = async (id: number, data: any) => {
  const { nombre, facultad } = data;

  const existe = await prisma.programa.findUnique({ where: { id } });
  if (!existe) throw new Error("El programa no existe");

  return prisma.programa.update({
    where: { id },
    data: { nombre, facultad },
  });
};

export const eliminarPrograma = async (id: number) => {
  const existe = await prisma.programa.findUnique({ where: { id } });
  if (!existe) throw new Error("El programa no existe");

  // Si tienes dependencias, deberías validar antes de borrar
  return prisma.programa.delete({
    where: { id },
  });
};

export const listarProgramasSelect = async () => {
  return prisma.programa.findMany({
    select: {
      id: true,
      nombre: true,
    },
    orderBy: { nombre: "asc" }
  });
};
