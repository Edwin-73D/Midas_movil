class MetaRepository(private val dao: MetaDao) {

    val allMetas = dao.getAllMetas()
    val totalAhorrado = dao.getTotalAhorrado()
    val totalMetas = dao.getTotalMetas()

    suspend fun insert(meta: MetaEntity) {
        val porcentaje = (meta.monto / meta.metaTotal) * 100
        dao.insertMeta(meta.copy(porcentajeActual = porcentaje))
    }

    suspend fun updateMonto(id: Int, monto: Double) {
        dao.updateMonto(id, monto)
    }
}