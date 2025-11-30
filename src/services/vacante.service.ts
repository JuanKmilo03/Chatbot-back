import { Prisma, PrismaClient, Vacante } from "@prisma/client";

const prisma = new PrismaClient();

export const vacanteService = {
  async create(data: Prisma.VacanteCreateInput): Promise<Vacante> {
    const vacantesCount = await prisma.vacante.count({
      where: {
        empresaId: data.empresa!.connect!.id,
        estado: "APROBADA"
      }
    });

    if (vacantesCount >= 3) throw new Error("No se puede crear más de 3 vacantes por empresa.");

    const vacante = await prisma.vacante.create({
      data: {
        ...data,
        habilidadesBlandas: data.habilidadesBlandas || [],
        habilidadesTecnicas: data.habilidadesTecnicas || [],
      },
    });
    return vacante;
  },
  async update(id: number, data: Prisma.VacanteUpdateInput): Promise<Vacante> {
    const vacanteOriginal = await prisma.vacante.findUnique({
      where: { id },
      select: { empresaId: true }
    });

    if (!vacanteOriginal) throw new Error("Vacante no encontrada");

    let empresaId = vacanteOriginal.empresaId;

    if (data.empresa && data.empresa.connect && data.empresa.connect.id) {
      empresaId = data.empresa.connect.id;
    }

    if (data.estado === "APROBADA") {
      const vacanteCount = await prisma.vacante.count({
        where: {
          empresaId,
          id: { not: id },
          estado: "APROBADA"
        }
      });

      if (vacanteCount >= 3) {
        throw new Error("No se puede tener más de 3 vacantes aprobadas por empresa.");
      }
    }
    const vacante = await prisma.vacante.update({
      where: { id },
      data: {
        ...data,
        habilidadesBlandas: data.habilidadesBlandas || undefined,
        habilidadesTecnicas: data.habilidadesTecnicas || undefined,
      },
    });
    return vacante;
  },
  async getPaginate(params: {
    skip?: number;
    take?: number;
    where?: Prisma.VacanteWhereInput;
    orderBy?: Prisma.VacanteOrderByWithRelationInput;
  }) {
    const { skip = 0, take = 10, where = {}, orderBy = { creadaEn: Prisma.SortOrder.desc } } = params;
    const [data, total] = await Promise.all([
      prisma.vacante.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { empresa: { select: { usuario: true } }, directorValida: true, practicas: true },
      }),
      prisma.vacante.count({ where }),
    ]);
    return { data, total, skip, totalPages: Math.ceil(total / take) };
  },
  async getAll(where: Prisma.VacanteWhereInput, orderBy?: Prisma.Enumerable<Prisma.VacanteOrderByWithRelationInput>): Promise<Vacante[]> {
    return prisma.vacante.findMany({
      where,
      orderBy,
      include: { empresa: true, directorValida: true, practicas: true },
    });
  }
}