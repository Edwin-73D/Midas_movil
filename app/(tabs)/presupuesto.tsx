import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePresupuestoViewModel } from "../../modules/presupuesto/PresupuestoViewModel";

export default function PresupuestoScreen() {

  const { categorias, generarPresupuesto } = usePresupuestoViewModel();

  const [ingreso, setIngreso] = useState("");
  const [metodo, setMetodo] = useState("50-30-20");

  const total = categorias.reduce(
    (acc, cat) => acc + cat.monto_esperado,
    0
  );

  return (
    
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1E1B0F" }}>
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Monthly Split</Text>

      <TextInput
        placeholder="Ingresa tu ingreso mensual"
        keyboardType="numeric"
        value={ingreso}
        onChangeText={setIngreso}
        style={styles.input}
      />

      <View style={styles.buttonContainer}>

  <TouchableOpacity
    style={[
      styles.button,
      metodo === "50-30-20" && styles.buttonActive
    ]}
    onPress={() => setMetodo("50-30-20")}
  >
    <Text style={styles.buttonText}>50 / 30 / 20</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.button,
      metodo === "60-20-20" && styles.buttonActive
    ]}
    onPress={() => setMetodo("60-20-20")}
  >
    <Text style={styles.buttonText}>60 / 20 / 20</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.generateButton}
    onPress={() => {
      const valor = parseFloat(ingreso);
      if (isNaN(valor)) return;
      generarPresupuesto(valor, metodo);
    }}
  >
    <Text style={styles.generateText}>Generar presupuesto</Text>
  </TouchableOpacity>

</View>

      <Text style={styles.subtitle}>
        Based on your income, here is how your budget is allocated according to the 50/30/20 rule.
      </Text>

      {/* TOTAL */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalAmount}>${total.toLocaleString()}</Text>
      </View>

      {/* LISTA */}
      {categorias.map((cat) => (
  <CategoriaCard key={cat.ID} categoria={cat} />
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
    backgroundColor: "#222222",
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

  input: {
    backgroundColor: "#1E1B0F",
    color: "white",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  buttonContainer: {
    marginVertical: 15,
  },

  button: {
    backgroundColor: "#1E1B0F",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10, // reemplaza gap (más compatible)
  },

  buttonActive: {
    backgroundColor: "#FFD700",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

  generateButton: {
    backgroundColor: "#FFD700",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  generateText: {
    color: "#1E1B0F",
    fontWeight: "bold",
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