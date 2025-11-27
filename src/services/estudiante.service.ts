import { EstadoPractica, Rol, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { prisma } from '../config/db.js';


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

  // Método para procesar archivo Excel/CSV
  async procesarArchivoEstudiantes(archivoBuffer: Buffer, nombreArchivo: string): Promise<{
    exitosos: number;
    errores: string[]
  }> {
    const estudiantes: EstudianteExcel[] = [];
    const errores: string[] = [];

    try {
      // Obtener extensión del nombre del archivo
      const extension = nombreArchivo.toLowerCase();

      console.log('Procesando archivo:', nombreArchivo);
      console.log('Extensión detectada:', extension);

      if (extension.endsWith('.xlsx') || extension.endsWith('.xls')) {
        // Procesar Excel
        const workbook = XLSX.read(archivoBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const datos = XLSX.utils.sheet_to_json(worksheet);

        console.log('Filas encontradas en Excel:', datos.length);

        datos.forEach((fila: any, index) => {
          try {
            const estudiante = this.validarFilaEstudiante(fila, index + 2);
            if (estudiante) {
              estudiantes.push(estudiante);
            }
          } catch (error: any) {
            errores.push(`Fila ${index + 2}: ${error.message}`);
          }
        });

      } else if (extension.endsWith('.csv')) {
        // Procesar CSV
        console.log('Procesando como CSV...');
        await new Promise((resolve, reject) => {
          const stream = Readable.from(archivoBuffer.toString());
          let filaCount = 0;

          stream
            .pipe(csv())
            .on('data', (fila: any) => {
              filaCount++;
              try {
                const estudiante = this.validarFilaEstudiante(fila);
                if (estudiante) {
                  estudiantes.push(estudiante);
                }
              } catch (error: any) {
                errores.push(`Fila ${filaCount + 1}: ${error.message}`);
              }
            })
            .on('end', () => {
              console.log('CSV procesado, filas:', filaCount);
              resolve(filaCount);
            })
            .on('error', reject);
        });
      } else {
        throw new Error(`Formato de archivo no soportado: ${nombreArchivo}. Use .xlsx, .xls o .csv`);
      }


      // Procesar estudiantes válidos
      const resultados = await this.guardarEstudiantes(estudiantes);
      errores.push(...resultados.errores);

      return {
        exitosos: resultados.exitosos,
        errores
      };

    } catch (error: any) {
      throw new Error(`Error procesando archivo: ${error.message}`);
    }
  }

  private validarFilaEstudiante(fila: any, numeroFila?: number): EstudianteExcel | null {
    const nombre = fila['nombre'] || fila['Nombre'] || fila['NOMBRE'];
    const email = fila['email'] || fila['Email'] || fila['EMAIL'] || fila['correo'];
    const empresa = fila['empresa'] || fila['Empresa'] || fila['EMPRESA'];
    const estado = fila['estado'] || fila['Estado'] || fila['ESTADO'] || fila['estado_proceso'];

    // Obtener como string directamente para evitar problemas
    const codigo = fila['codigo']?.toString() || fila['Codigo']?.toString() || fila['CODIGO']?.toString() || fila['código']?.toString();
    const telefono = fila['telefono']?.toString() || fila['Telefono']?.toString() || fila['TELEFONO']?.toString();

    const programa = fila['programa'] || fila['Programa'] || fila['PROGRAMA'];
    const semestre = fila['semestre'] ? parseInt(fila['semestre']) : undefined;

    if (!nombre || !email || !empresa || !estado) {
      throw new Error(`Campos requeridos faltantes: nombre, email, empresa, estado`);
    }

    if (!this.esEmailValido(email)) {
      throw new Error(`Email inválido: ${email}`);
    }

    const estadoProceso = this.mapearEstadoPractica(estado);
    if (!estadoProceso) {
      throw new Error(`Estado de práctica inválido: ${estado}. Valores válidos: EN_PROCESO, FINALIZADA, CANCELADA`);
    }

    return {
      nombre,
      email,
      codigo: codigo,
      telefono: telefono,
      programaAcademico: programa,
      semestre: semestre,
      empresa,
      estadoProceso
    };
  }


  private async guardarEstudiantes(estudiantes: EstudianteExcel[]): Promise<{
    exitosos: number;
    errores: string[]
  }> {
    const errores: string[] = [];
    let exitosos = 0;

    for (const datosEst of estudiantes) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Buscar empresa
          let empresaId: number | undefined;
          let empresaAsignada: string | undefined;

          const empresaExistente = await tx.empresa.findFirst({
            where: {
              usuario: {
                nombre: {
                  contains: datosEst.empresa,
                  mode: 'insensitive'
                }
              }
            }
          });

          if (empresaExistente) {
            empresaId = empresaExistente.id;
          } else {
            empresaAsignada = datosEst.empresa;
          }

          // 2. Buscar usuario existente por email
          const usuarioExistente = await tx.usuario.findUnique({
            where: { email: datosEst.email }
          });

          // CONVERTIR números a strings - CORRECCIÓN CLAVE
          const codigoStr = datosEst.codigo ? datosEst.codigo.toString() : null;
          const telefonoStr = datosEst.telefono ? datosEst.telefono.toString() : null;

          if (usuarioExistente) {
            // Actualizar estudiante existente
            await tx.estudiante.update({
              where: { usuarioId: usuarioExistente.id },
              data: {
                empresaId,
                empresaAsignada,
                estadoProceso: datosEst.estadoProceso,
                codigo: codigoStr, // Campo correcto: codigo
                telefono: telefonoStr,
                programaAcademico: datosEst.programaAcademico,
                semestre: datosEst.semestre
              }
            });
          } else {
            // Crear nuevo usuario y estudiante
            const nuevoUsuario = await tx.usuario.create({
              data: {
                nombre: datosEst.nombre,
                email: datosEst.email,
                rol: Rol.ESTUDIANTE
              }
            });

            await tx.estudiante.create({
              data: {
                usuarioId: nuevoUsuario.id,
                empresaId,
                empresaAsignada,
                estadoProceso: datosEst.estadoProceso,
                codigo: codigoStr,
                telefono: telefonoStr,
                programaAcademico: datosEst.programaAcademico,
                semestre: datosEst.semestre
              }
            });
          }

          exitosos++;
        });
      } catch (error: any) {
        errores.push(`Error guardando ${datosEst.email}: ${error.message}`);
      }
    }

    return { exitosos, errores };
  }
  async listarEstudiantesEnPractica() {
    return await prisma.estudiante.findMany({
      where: {
        estadoProceso: {
          in: [EstadoPractica.EN_PROCESO, EstadoPractica.FINALIZADA]
        }
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            creadoEn: true
          }
        },
        empresa: {
          include: {
            usuario: {
              select: {
                nombre: true,
                email: true
              }
            }
          }
        },
        practicas: {
          include: {
            vacante: {
              include: {
                empresa: {
                  include: {
                    usuario: {
                      select: {
                        nombre: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        usuario: {
          nombre: 'asc'
        }
      }
    });
  }

  private esEmailValido(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private mapearEstadoPractica(estado: string): EstadoPractica | null {
    const estados: { [key: string]: EstadoPractica } = {
      'EN_PROCESO': EstadoPractica.EN_PROCESO,
      'EN PROCESO': EstadoPractica.EN_PROCESO,
      'FINALIZADA': EstadoPractica.FINALIZADA,
      'FINALIZADO': EstadoPractica.FINALIZADA,
      'CANCELADA': EstadoPractica.CANCELADA,
      'CANCELADO': EstadoPractica.CANCELADA,
      'ACTIVA': EstadoPractica.EN_PROCESO,
      'ACTIVO': EstadoPractica.EN_PROCESO
    };
    return estados[estado.toUpperCase()] || null;
  }
}
export class EstudianteService {
  static getById: any;
  static getAll(arg0: { skip: number; take: number; }) {
    throw new Error('Method not implemented.');
  }

  // Método findMany para buscar estudiantes con filtros
  static async findMany(filtros: Prisma.EstudianteWhereInput) {
    return prisma.estudiante.findMany({
      where: filtros,
      include: {
        usuario: true,
        postulaciones: true,
        practicas: true,
      },
    });
  }

  static async findManyWithPagination({
    filtros,
    skip,
    take,
  }: {
    filtros: Prisma.EstudianteWhereInput;
    skip: number;
    take: number;
  }) {
    const [data, total] = await Promise.all([
      prisma.estudiante.findMany({
        where: filtros,
        include: {
          usuario: true,
          postulaciones: true,
          practicas: true,
        },
        skip,
        take,
      }),
      prisma.estudiante.count({ where: filtros }),
    ]);

    return { data, total };
  }

  static create(arg0: { usuario: { create: { nombre: any; email: any; rol: string; }; }; codigo: any; cedula: any; perfilCompleto: boolean; activo: boolean; }) {
    throw new Error('Method not implemented.');
  }
  static async crear(data: {
    nombre: string;
    email: string;
    codigo: string;
    documento: string;
  }) {
    const { nombre, email, codigo, documento } = data;

    // Validación: email ya existe
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email },
    });
    if (usuarioExiste) throw new Error("El correo ya está registrado");

    // Validación: documento ya existe
    const documentoExiste = await prisma.estudiante.findUnique({
      where: { documento },
    });
    if (documentoExiste) throw new Error("El documento ya está registrado");

    // Validación: código ya existe
    const codigoExiste = await prisma.estudiante.findUnique({
      where: { codigo },
    });
    if (codigoExiste) throw new Error("El código ya está registrado");


    const estudiante = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const usuario = await tx.usuario.create({
        data: {
          nombre,
          email,
          rol: "ESTUDIANTE",
          password: null, // no se necesita en este caso
        },
      });

      // Crear estudiante
      const estudiante = await tx.estudiante.create({
        data: {
          usuarioId: usuario.id,
          codigo: codigo ?? null,
          documento: documento ?? null,
          habilidadesTecnicas: [],
          habilidadesBlandas: [],
          perfil: null,
        },
        include: { usuario: true },
      });

      return estudiante;
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

    if (!id || typeof id !== 'number') {
      console.error('obtenerPorId llamado SIN id o con id inválido');
      throw new Error('ID de estudiante es requerido y debe ser un número');
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: {
        usuario: true,
        postulaciones: {
          include: {
            vacante: {
              include: {
                empresa: {
                  include: {
                    usuario: true
                  }
                }
              }
            }
          }
        },
        practicas: {
          include: {
            vacante: {
              include: {
                empresa: {
                  include: {
                    usuario: true
                  }
                }
              }
            }
          }
        },
      },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

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

  static async actualizar(
    id: number,
    data: Prisma.EstudianteUpdateInput,
    tx: Prisma.TransactionClient = prisma
  ) {
    // Verificar si existe el estudiante
    const existe = await tx.estudiante.findUnique({ where: { id } });
    if (!existe) throw new Error("Estudiante no encontrado");

    // Validar email si viene dentro de usuario.update
    const emailEnUpdate = (data.usuario as any)?.update?.email;

    if (emailEnUpdate) {
      const usuarioConEmail = await tx.usuario.findFirst({
        where: {
          email: emailEnUpdate,
          id: { not: existe.usuarioId }
        }
      });

      if (usuarioConEmail) {
        throw new Error("El email ya está en uso por otro usuario");
      }
    }
    // Ejecutar el update directo con Prisma
    const estudianteActualizado = await tx.estudiante.update({
      where: { id },
      data,
      include: {
        usuario: true,
        postulaciones: true,
        practicas: true,
      },
    });

    return estudianteActualizado;
  }

  static async subirHojaDeVida(id: number, hojaDeVidaUrl: string) {
    const existe = await prisma.estudiante.findUnique({ where: { id } });
    if (!existe) throw new Error('Estudiante no encontrado');

    const estudianteActualizado = await prisma.estudiante.update({
      where: { id },
      data: {
        hojaDeVidaUrl,
        perfilCompleto: true
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

    if (!existe) throw new Error('Estudiante no encontrado');

    await prisma.estudiante.delete({
      where: { id }
    });

    await prisma.usuario.delete({
      where: { id: existe.usuarioId }
    });

    return { message: 'Estudiante eliminado correctamente' };
  }

  static async cargarMasivo(estudiantes: {
    nombre: string;
    email: string;
    codigo: string;
    documento: string;
    activo?: boolean;
  }[]) {
    const resultados: any[] = [];

    for (const row of estudiantes) {
      const { nombre, email, codigo, documento, activo = true } = row;

      // validar mínimos
      if (!nombre || !email || !codigo || !documento) {
        resultados.push({
          email,
          error: "Faltan campos obligatorios (nombre, email, codigo o documento)",
        });
        continue;
      }

      try {
        const usuarioExistente = await prisma.usuario.findUnique({
          where: { email },
          include: { estudiante: true }
        });

        // CASO 1: crear nuevo estudiante
        if (!usuarioExistente) {
          // Validar combinaciones antes de crear
          const documentoUsado = await prisma.estudiante.findFirst({
            where: { documento }
          });

          if (documentoUsado) {
            resultados.push({
              email,
              error: "El documento ya existe para otro estudiante",
            });
            continue;
          }

          const codigoUsado = await prisma.estudiante.findFirst({
            where: { codigo }
          });

          if (codigoUsado) {
            resultados.push({
              email,
              error: "El código ya existe para otro estudiante",
            });
            continue;
          }

          const result = await prisma.$transaction(async (tx) => {
            const usuario = await tx.usuario.create({
              data: {
                nombre,
                email,
                rol: "ESTUDIANTE",
                password: null,
              },
            });

            const estudiante = await tx.estudiante.create({
              data: {
                usuarioId: usuario.id,
                codigo,
                documento,
                activo,
                perfil: null,
                habilidadesTecnicas: [],
                habilidadesBlandas: [],
              },
            });

            return estudiante;
          });

          resultados.push({ email, status: "CREADO", estudiante: result });
          continue;
        }

        // CASO 2: actualizar estudiante ya existente
        const estudianteId = usuarioExistente.estudiante?.id;

        if (!estudianteId) {
          resultados.push({
            email,
            error: "El usuario existe pero no tiene estudiante asociado",
          });
          continue;
        }

        // Validar combinaciones con otros estudiantes
        const codigoExistente = await prisma.estudiante.findFirst({
          where: { codigo, id: { not: estudianteId } },
        });
        if (codigoExistente) {
          resultados.push({ email, error: "El código ya existe en otro estudiante" });
          continue;
        }

        const documentoExistente = await prisma.estudiante.findFirst({
          where: { documento, id: { not: estudianteId } },
        });
        if (documentoExistente) {
          resultados.push({ email, error: "El documento ya existe en otro estudiante" });
          continue;
        }

        const estudianteActualizado = await prisma.estudiante.update({
          where: { id: estudianteId },
          data: {
            codigo,
            documento,
            activo,
          },
        });

        resultados.push({ email, status: "ACTUALIZADO", estudiante: estudianteActualizado });

      } catch (err: any) {
        resultados.push({
          email,
          error: err.message || "Error inesperado",
        });
      }
    }
    return resultados;
  }
}
