export const obtenerCronogramasPorPrograma = async (req, res) => {
  try {
    const { programaId } = req.params;

    const cronogramas = await prisma.cronograma.findMany({
      where: { programaId: Number(programaId) },
      include: {
        director: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { creadoEn: "desc" },
    });

    res.json({
      success: true,
      total: cronogramas.length,
      cronogramas,
    });
  } catch (error) {
    console.error("Error al obtener cronogramas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los cronogramas",
    });
  }
};