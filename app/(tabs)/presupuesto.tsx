import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categoriasMock = [
  {
    id: 1,
    nombre: "Needs",
    porcentaje: 50,
    monto_esperado: 2125,
    monto_real: 1200,
  },
  {
    id: 2,
    nombre: "Wants",
    porcentaje: 30,
    monto_esperado: 1275,
    monto_real: 400,
  },
  {
    id: 3,
    nombre: "Savings & Debt",
    porcentaje: 20,
    monto_esperado: 850,
    monto_real: 850,
  },
];

export default function PresupuestoScreen() {
  const total = categoriasMock.reduce(
    (acc, cat) => acc + cat.monto_esperado,
    0
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Monthly Split</Text>

      <Text style={styles.subtitle}>
        Based on your income, here is how your budget is allocated according to the 50/30/20 rule.
      </Text>

      {/* TOTAL */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalAmount}>${total.toLocaleString()}</Text>
      </View>

      {/* LISTA */}
      {categoriasMock.map((cat) => (
        <CategoriaCard key={cat.id} categoria={cat} />
      ))}
      </ScrollView>
</SafeAreaView>
  );
}

const CategoriaCard = ({ categoria }: any) => {
  const restante = categoria.monto_esperado - categoria.monto_real;

  const progreso =
    categoria.monto_esperado > 0
      ? categoria.monto_real / categoria.monto_esperado
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{categoria.nombre}</Text>
        <Text style={styles.cardPercent}>{categoria.porcentaje}%</Text>
      </View>

      <Text style={styles.cardAmount}>
        ${categoria.monto_esperado.toLocaleString()}
      </Text>

      {/* Barra */}
      <View style={styles.barBackground}>
        <View
          style={[styles.barFill, { width: `${progreso * 100}%` }]}
        />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.spent}>
          Spent: ${categoria.monto_real}
        </Text>
        <Text style={styles.left}>
          Left: ${restante}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1B0F",
    padding: 20,
  },

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: "#aaa",
    marginBottom: 20,
  },

  totalContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  totalLabel: {
    color: "#aaa",
  },

  totalAmount: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#2A2618",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  cardPercent: {
    color: "white",
    fontWeight: "bold",
  },

  cardAmount: {
    color: "#ccc",
    marginVertical: 5,
  },

  barBackground: {
    height: 8,
    backgroundColor: "#444",
    borderRadius: 5,
    marginVertical: 10,
  },

  barFill: {
    height: 8,
    backgroundColor: "#FFD700",
    borderRadius: 5,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  spent: {
    color: "#aaa",
  },

  left: {
    color: "#aaa",
  },
});