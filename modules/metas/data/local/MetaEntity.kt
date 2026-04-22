import androidx.room.*
import java.util.*

@Entity(tableName = "Meta")
data class MetaEntity(

    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "ID")
    val id: Int = 0,

    @ColumnInfo(name = "nombre")
    val nombre: String,

    @ColumnInfo(name = "meta_total")
    val metaTotal: Double,

    @ColumnInfo(name = "monto")
    val monto: Double = 0.0,

    @ColumnInfo(name = "porcentaje_actual")
    val porcentajeActual: Double = 0.0,

    @ColumnInfo(name = "descripcion")
    val descripcion: String? = null,

    @ColumnInfo(name = "fecha_finalizar")
    val fechaFinalizar: String
)