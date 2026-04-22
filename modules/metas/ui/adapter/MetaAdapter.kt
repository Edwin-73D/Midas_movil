class MetaAdapter : RecyclerView.Adapter<MetaAdapter.MetaViewHolder>() {

    private var lista = emptyList<MetaEntity>()

    fun setData(data: List<MetaEntity>) {
        lista = data
        notifyDataSetChanged()
    }

    class MetaViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val nombre: TextView = view.findViewById(R.id.tvNombre)
        val fecha: TextView = view.findViewById(R.id.tvFecha)
        val monto: TextView = view.findViewById(R.id.tvMonto)
        val porcentaje: TextView = view.findViewById(R.id.tvPorcentaje)
        val progress: ProgressBar = view.findViewById(R.id.progressBar)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MetaViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_goal, parent, false)
        return MetaViewHolder(view)
    }

    override fun onBindViewHolder(holder: MetaViewHolder, position: Int) {
        val meta = lista[position]

        holder.nombre.text = meta.nombre
        holder.fecha.text = "Due: ${meta.fechaFinalizar}"
        holder.monto.text = "$${meta.monto} / $${meta.metaTotal}"

        val porcentaje = meta.porcentajeActual.toInt()
        holder.porcentaje.text = "$porcentaje%"

        // Animación suave
        ObjectAnimator.ofInt(holder.progress, "progress", porcentaje).apply {
            duration = 600
            start()
        }
    }

    override fun getItemCount() = lista.size
}