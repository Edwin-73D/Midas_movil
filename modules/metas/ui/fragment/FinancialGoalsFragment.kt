class FinancialGoalsFragment : Fragment() {

    private lateinit var viewModel: MetaViewModel
    private lateinit var adapter: MetaAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_financial_goals, container, false)

        val recycler = view.findViewById<RecyclerView>(R.id.recyclerGoals)
        val tvTotal = view.findViewById<TextView>(R.id.tvTotal)
        val tvCount = view.findViewById<TextView>(R.id.tvCount)
        val btnAdd = view.findViewById<Button>(R.id.btnAddGoal)

        adapter = MetaAdapter()
        recycler.adapter = adapter
        recycler.layoutManager = LinearLayoutManager(requireContext())

        viewModel = ViewModelProvider(this)[MetaViewModel::class.java]

        viewModel.metas.observe(viewLifecycleOwner) {
            adapter.setData(it)
        }

        viewModel.totalAhorrado.observe(viewLifecycleOwner) {
            tvTotal.text = "Total: $${it ?: 0}"
        }

        viewModel.totalMetas.observe(viewLifecycleOwner) {
            tvCount.text = "$it metas"
        }

        btnAdd.setOnClickListener {
            // EJEMPLO: insertar meta dummy
            viewModel.insert(
                MetaEntity(
                    nombre = "Nueva Meta",
                    metaTotal = 1000.0,
                    monto = 100.0,
                    descripcion = "Demo",
                    fechaFinalizar = "2026-12-31"
                )
            )
        }

        return view
    }
}