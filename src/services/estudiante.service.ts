import { Estudiante, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const estudianteService = {
  /**
   * Obtener estudiantes con paginación, filtros y ordenamiento.
   * @param params - { skip, take, where, orderBy }
   * @returns Lista de estudiantes activos
   */
  async getAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.EstudianteWhereInput;
    orderBy?: Prisma.EstudianteOrderByWithRelationInput;
  }): Promise<Estudiante[]> {
    const { skip = 0, take = 10, where = {}, orderBy = { id: "asc" } } = params;
    return prisma.estudiante.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        usuario: true,
        postulaciones: true,
        practicas: true,
      },
    });
  },
  /**
 * Obtener estudiantes que cumplan con un filtro sin paginación
 * @param where - Filtros dinámicos
 * @param orderBy - Ordenamiento opcional
 * @returns Lista de estudiantes que cumplen el filtro
 */
  async findMany(where: Prisma.EstudianteWhereInput = {}, orderBy?: Prisma.Enumerable<Prisma.EstudianteOrderByWithRelationInput>): Promise<Estudiante[]> {
    return prisma.estudiante.findMany({
      where: { ...where, activo: true },
      orderBy: orderBy || [{ id: "asc" }],
      include: {
        usuario: true,
        postulaciones: true,
        practicas: true,
      },
    });
  },
  /**
   * Obtener un estudiante por su ID.
   * @param id - ID del estudiante
   * @returns Estudiante o null si no existe
   */
  async getById(id: number): Promise<Estudiante | null> {
    return prisma.estudiante.findUnique({
      where: { id },
      include: {
        usuario: true,
        postulaciones: true,
        practicas: true,
      },
    });
  },
  /**
   * Crear un nuevo estudiante.
   * @param data - Datos del estudiante
   * @returns Estudiante creado
   */
  async create(data: Prisma.EstudianteCreateInput): Promise<Estudiante> {
    return prisma.estudiante.create({ data, include: { usuario: true } });
  },
  /**
   * Actualizar un estudiante existente.
   * @param id - ID del estudiante
   * @param data - Datos a actualizar
   * @returns Estudiante actualizado
   */
  async update(
    id: number,
    data: Prisma.EstudianteUpdateInput
  ): Promise<Estudiante> {
    return prisma.estudiante.update({
      where: { id },
      data,
      include: {usuario: true}
    });
  },
  /**
   * Soft delete de estudiante (marcar como inactivo).
   * @param id - ID del estudiante
   * @returns Estudiante actualizado con activo = false
   */
  async softDelete(id: number): Promise<Estudiante> {
    return prisma.estudiante.update({
      where: { id },
      data: { activo: false },
      include: { usuario: true },
    });
  },
  /**
   * Reactivar un estudiante previamente inactivo.
   * @param id - ID del estudiante
   * @returns Estudiante actualizado con activo = true
   */
  async reactivate(id: number): Promise<Estudiante> {
    return prisma.estudiante.update({
      where: { id },
      data: { activo: true },
      include: { usuario: true },
    });
  },
}
