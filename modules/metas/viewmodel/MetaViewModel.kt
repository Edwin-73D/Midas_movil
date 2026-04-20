import android.app.Application
import androidx.lifecycle.*
import kotlinx.coroutines.launch

class MetaViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: MetaRepository
    val metas: LiveData<List<MetaEntity>>
    val totalAhorrado: LiveData<Double?>
    val totalMetas: LiveData<Int>

    init {
        val dao = AppDatabase.getDatabase(application).metaDao()
        repository = MetaRepository(dao)

        metas = repository.allMetas
        totalAhorrado = repository.totalAhorrado
        totalMetas = repository.totalMetas
    }

    fun insert(meta: MetaEntity) = viewModelScope.launch {
        repository.insert(meta)
    }

    fun updateMonto(id: Int, monto: Double) = viewModelScope.launch {
        repository.updateMonto(id, monto)
    }
}