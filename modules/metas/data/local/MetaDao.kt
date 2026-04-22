import androidx.lifecycle.LiveData
import androidx.room.*

@Dao
interface MetaDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMeta(meta: MetaEntity)

    @Query("SELECT * FROM Meta ORDER BY ID DESC")
    fun getAllMetas(): LiveData<List<MetaEntity>>

    @Query("""
        UPDATE Meta 
        SET monto = :monto,
            porcentaje_actual = (:monto * 100.0) / meta_total
        WHERE ID = :id
    """)
    suspend fun updateMonto(id: Int, monto: Double)

    @Query("SELECT SUM(monto) FROM Meta")
    fun getTotalAhorrado(): LiveData<Double?>

    @Query("SELECT COUNT(*) FROM Meta")
    fun getTotalMetas(): LiveData<Int>
}