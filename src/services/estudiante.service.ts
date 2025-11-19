import { PrismaClient, EstadoPractica, Rol, Estudiante, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';
import multer from 'multer';

const prisma = new PrismaClient();



interface EstudianteExcel {
  nombre: string;
  email: string;
  codigo?: string;
  telefono?: string;
  programaAcademico?: string;
  semestre?: number;
  empresa: string;
  estadoProceso: EstadoPractica;
}

export class EstudianteExcelService {

  async procesarArchivoEstudiantes(
    archivoBuffer: Buffer,
    nombreArchivo: string
  ): Promise<{ exitosos: number; errores: string[] }> {
    const estudiantes: EstudianteExcel[] = [];
    const errores: string[] = [];

    try {
      const extension = nombreArchivo.toLowerCase();

      if (extension.endsWith('.xlsx') || extension.endsWith('.xls')) {
        const workbook = XLSX.read(archivoBuffer, { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]]
        );

        data.forEach((fila: any, i) => {
          try {
            const estudiante = this.validarFilaEstudiante(fila, i + 2);
            if (estudiante) estudiantes.push(estudiante);
          } catch (e: any) {
            errores.push(`Fila ${i + 2}: ${e.message}`);
          }
        });

      } else if (extension.endsWith('.csv')) {
        await new Promise((resolve, reject) => {
          const stream = Readable.from(archivoBuffer.toString());
          let fila = 0;

          stream
            .pipe(csv())
            .on('data', (data: any) => {
              fila++;
              try {
                const estudiante = this.validarFilaEstudiante(data, fila + 1);
                if (estudiante) estudiantes.push(estudiante);
              } catch (e: any) {
                errores.push(`Fila ${fila + 1}: ${e.message}`);
              }
            })
            .on('end', resolve)
            .on('error', reject);
        });
      } else {
        throw new Error("Formato no soportado. Use .xlsx, .xls o .csv");
      }

      // GUARDAR
      const resp = await this.guardarEstudiantes(estudiantes);
      errores.push(...resp.errores);

      return { exitosos: resp.exitosos, errores };

    } catch (e: any) {
      throw new Error(`Error procesando archivo: ${e.message}`);
    }
  }

  private validarFilaEstudiante(fila: any, numeroFila?: number): EstudianteExcel {
    const nombre = fila['nombre'] || fila['Nombre'] || fila['NOMBRE'];
    const email = fila['email'] || fila['Email'] || fila['EMAIL'];
    const empresa = fila['empresa'] || fila['Empresa'] || fila['EMPRESA'];
    const estado = fila['estado'] || fila['Estado'] || fila['ESTADO'];

    const codigo = fila['codigo']?.toString()
      || fila['Codigo']?.toString()
      || fila['CODIGO']?.toString();

    const telefono = fila['telefono']?.toString()
      || fila['Telefono']?.toString();

    const programa = fila['programa']
      || fila['Programa']
      || fila['PROGRAMA'];

    const semestre = fila['semestre']
      ? parseInt(fila['semestre'])
      : undefined;

    if (!nombre || !email || !empresa || !estado)
      throw new Error("Campos requeridos faltantes (nombre, email, empresa, estado)");

    if (!this.esEmailValido(email))
      throw new Error(`Email inválido: ${email}`);

    const estadoProceso = this.mapearEstadoPractica(estado);
    if (!estadoProceso)
      throw new Error(`Estado de práctica inválido: ${estado}`);

    return {
      nombre,
      email,
      codigo,
      telefono,
      programaAcademico: programa,
      semestre,
      empresa,
      estadoProceso
    };
  }

  private async guardarEstudiantes(
    estudiantes: EstudianteExcel[]
  ): Promise<{ exitosos: number; errores: string[] }> {

    let exitosos = 0;
    const errores: string[] = [];

    for (const est of estudiantes) {
      try {
        await prisma.$transaction(async (tx) => {

          // BUSCAR EMPRESA
          let empresaId: number | undefined;
          let empresaAsignada: string | undefined;

          const empresa = await tx.empresa.findFirst({
            where: {
              usuario: { nombre: { contains: est.empresa, mode: 'insensitive' } }
            }
          });

          if (empresa) empresaId = empresa.id;
          else empresaAsignada = est.empresa;

          // BUSCAR USUARIO
          const usuario = await tx.usuario.findUnique({
            where: { email: est.email }
          });

          const codigoStr = est.codigo ?? null;
          const telefonoStr = est.telefono ?? null;

          if (usuario) {
            // UPDATE
            await tx.estudiante.update({
              where: { usuarioId: usuario.id },
              data: {
                empresaId,
                empresaAsignada,
                estadoProceso: est.estadoProceso,
                codigo: codigoStr,
                telefono: telefonoStr,
                programaAcademico: est.programaAcademico,
                semestre: est.semestre
              }
            });

          } else {
            // CREATE
            const nuevo = await tx.usuario.create({
              data: {
                nombre: est.nombre,
                email: est.email,
                rol: Rol.ESTUDIANTE
              }
            });

            await tx.estudiante.create({
              data: {
                usuarioId: nuevo.id,
                empresaId,
                empresaAsignada,
                estadoProceso: est.estadoProceso,
                codigo: codigoStr,
                telefono: telefonoStr,
                programaAcademico: est.programaAcademico,
                semestre: est.semestre
              }
            });
          }

          exitosos++;
        });

      } catch (e: any) {
        errores.push(`Error guardando ${est.email}: ${e.message}`);
      }
    }

    return { exitosos, errores };
  }

  async listarEstudiantesEnPractica() {
    return prisma.estudiante.findMany({
      where: {
        estadoProceso: {
          in: [EstadoPractica.EN_PROCESO, EstadoPractica.FINALIZADA]
        }
      },
      include: {
        usuario: { select: { id: true, nombre: true, email: true, creadoEn: true } },
        empresa: {
          include: {
            usuario: { select: { nombre: true, email: true } }
          }
        },
        practicas: {
          include: {
            vacante: {
              include: {
                empresa: {
                  include: { usuario: { select: { nombre: true } } }
                }
              }
            }
          }
        }
      },
      orderBy: { usuario: { nombre: "asc" } }
    });
  }

  private esEmailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private mapearEstadoPractica(estado: string): EstadoPractica | null {
    const map: any = {
      "EN_PROCESO": EstadoPractica.EN_PROCESO,
      "FINALIZADA": EstadoPractica.FINALIZADA,
      "CANCELADA": EstadoPractica.CANCELADA,
      "ACTIVA": EstadoPractica.EN_PROCESO,
      "FINALIZADO": EstadoPractica.FINALIZADA,
      "CANCELADO": EstadoPractica.CANCELADA
    };
    return map[estado.toUpperCase()] ?? null;
  }
}


export class EstudianteService {

  static async crear(data: {
    nombre: string;
    email: string;
    password?: string;

    habilidadesTecnicas?: string[];
    habilidadesBlandas?: string[];

    perfil?: string;
    codigo?: string;
    cedula?: string;
  }) {
    const { nombre, email, password, habilidadesTecnicas, habilidadesBlandas, perfil, codigo, cedula } = data;

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
        habilidadesTecnicas: habilidadesTecnicas ?? [],
        habilidadesBlandas: habilidadesBlandas ?? [],
        perfil,
        codigo,
      },
      include: { usuario: true },
    });

    return estudiante;
  }

  static async obtenerTodos() {
    return prisma.estudiante.findMany({
      include: {
        usuario: true,
        postulaciones: true,
        practicas: true,
      },
    });
  }

  static async obtenerPorId(id: number) {
    if (!id || typeof id !== "number") {
      throw new Error("ID de estudiante inválido");
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: {
        usuario: true,
        postulaciones: {
          include: {
            vacante: {
              include: {
                empresa: { include: { usuario: true } }
              }
            }
          }
        },
        practicas: {
          include: {
            vacante: {
              include: {
                empresa: { include: { usuario: true } }
              }
            }
          }
        },
      },
    });

    if (!estudiante) throw new Error("Estudiante no encontrado");

    return estudiante;
  }

  static async obtenerPorUsuarioId(usuarioId: number) {
    const estudiante = await prisma.estudiante.findUnique({
      where: { usuarioId },
      include: {
        usuario: true,
        postulaciones: true,
        practicas: true,
      },
    });

    if (!estudiante) throw new Error('Estudiante no encontrado');
    return estudiante;
  }

  static async actualizar(id: number, data: any) {
    const { nombre, email, habilidadesTecnicas, habilidadesBlandas, perfil, codigo, cedula } = data;

    const existe = await prisma.estudiante.findUnique({ where: { id } });
    if (!existe) throw new Error("Estudiante no encontrado");

    if (email) {
      const usuarioConEmail = await prisma.usuario.findFirst({
        where: {
          email,
          id: { not: existe.usuarioId },
        },
      });

      if (usuarioConEmail) throw new Error("El email ya está en uso");
    }

    const estudianteActualizado = await prisma.estudiante.update({
      where: { id },
      data: {
        ...(habilidadesTecnicas && { habilidadesTecnicas }),
        ...(habilidadesBlandas && { habilidadesBlandas }),
        ...(perfil && { perfil }),
        ...(codigo && { codigo }),
        ...(cedula && { cedula }),

        usuario: {
          update: {
            ...(nombre && { nombre }),
            ...(email && { email }),
          },
        },
      },
      include: { usuario: true },
    });

    return estudianteActualizado;
  }

  static async buscar(filtros: Prisma.EstudianteWhereInput = {}) {
    return prisma.estudiante.findMany({
      where: filtros,
      orderBy: { id: "asc" },
      include: {
        usuario: true,
        postulaciones: true,
        practicas: true,
      },
    });
  }

  
  static async eliminar(id: number) {
    const existe = await prisma.estudiante.findUnique({
      where: { id },
      include: { usuario: true }
    });

    if (!existe) throw new Error("Estudiante no encontrado");

    await prisma.estudiante.delete({ where: { id } });

    await prisma.usuario.delete({
      where: { id: existe.usuarioId },
    });

    return { message: "Estudiante eliminado correctamente" };
  }

  static async subirHojaDeVida(id: number, archivoUrl: string) {
  const estudiante = await prisma.estudiante.findUnique({
    where: { id }
  });

  if (!estudiante) throw new Error("Estudiante no encontrado");

  const actualizado = await prisma.estudiante.update({
    where: { id },
    data: {
      hojaDeVidaUrl: archivoUrl
    }
  });

  return actualizado;
}
}

export const estudianteService = EstudianteService;
