import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MidasColors } from '@/constants/theme';
import { usePresupuestoViewModel } from '../../modules/presupuesto/PresupuestoViewModel';
import { CustomBudgetManager } from '../../modules/presupuesto/ui/CustomBudgetManager';

type Metodo = '50-30-20' | '60-20-20' | 'personalizado';

export default function PresupuestoScreen() {
  const {
    categorias,
    generarPresupuesto,
    generarPresupuestoPersonalizado,
    cargarCategorias,
  } = usePresupuestoViewModel();

  const [ingreso, setIngreso] = useState('');
  const [metodo,  setMetodo]  = useState<Metodo>('50-30-20');
  const [showCustomManager, setShowCustomManager] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      cargarCategorias();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const total = categorias.reduce((acc, cat: any) => acc + cat.monto_esperado, 0);
  const ingresoNum = parseFloat(ingreso);
  const ingresoValido = !isNaN(ingresoNum) && ingresoNum > 0;

  function handleGenerar() {
    if (!ingresoValido) return;

    if (metodo === 'personalizado') {
      // Abre el manager con las categorías actuales del DB como punto de partida
      setShowCustomManager(true);
    } else {
      generarPresupuesto(ingresoNum, metodo);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Tu división mensual</Text>

        {/* ── Campo de ingreso ────────────────────────────────────────── */}
        <TextInput
          placeholder="Ingresa tu ingreso mensual"
          placeholderTextColor={MidasColors.textSecondary}
          keyboardType="numeric"
          value={ingreso}
          onChangeText={setIngreso}
          style={styles.input}
        />

        {/* ── Selector de método ──────────────────────────────────────── */}
        <View style={styles.methodGroup}>
          {(
            [
              { key: '50-30-20',      label: '50 / 30 / 20' },
              { key: '60-20-20',      label: '60 / 20 / 20' },
              { key: 'personalizado', label: 'Personalizado' },
            ] as { key: Metodo; label: string }[]
          ).map(({ key, label }) => {
            const active = metodo === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.methodBtn, active && styles.methodBtnActive]}
                onPress={() => setMetodo(key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.methodBtnText,
                    active && styles.methodBtnTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Descripción contextual */}
        {metodo === 'personalizado' && (
          <Text style={styles.hint}>
            Define tus propias categorías y porcentajes. Puedes usar Needs, Wants y
            Savings como punto de partida.
          </Text>
        )}

        {/* ── Botón generar ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.generateButton, !ingresoValido && styles.generateButtonDisabled]}
          onPress={handleGenerar}
          activeOpacity={0.85}
          disabled={!ingresoValido}
        >
          <Text style={styles.generateText}>Generar presupuesto</Text>
        </TouchableOpacity>

        {/* ── Resumen total ────────────────────────────────────────────── */}
        {categorias.length > 0 && (
          <>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalAmount}>
                ${Math.round(total).toLocaleString('es-CO')}
              </Text>
            </View>

            {/* ── Tarjetas de categoría ─────────────────────────────── */}
            {categorias.map((cat: any) => (
              <CategoriaCard key={cat.ID} categoria={cat} />
            ))}
          </>
        )}
      </ScrollView>

      {/* ── Manager de presupuesto personalizado ───────────────────────── */}
      <CustomBudgetManager
        visible={showCustomManager}
        ingreso={ingresoNum || 0}
        categoriasIniciales={categorias.map((c: any) => ({
          nombre: c.nombre,
          porcentaje: c.porcentaje,
        }))}
        onClose={() => setShowCustomManager(false)}
        onConfirm={(cats) => {
          generarPresupuestoPersonalizado(ingresoNum, cats);
          setShowCustomManager(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Tarjeta de categoría ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  needs:          MidasColors.needsColor,
  wants:          MidasColors.wantsColor,
  savings:        MidasColors.savingsColor,
  'savings & debt': MidasColors.savingsColor,
};

function resolveCategoryColor(nombre: string, fallbackIndex: number): string {
  const key = nombre.toLowerCase();
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  const PALETTE = [
    MidasColors.gold, '#3498DB', '#E74C3C', '#1ABC9C',
    '#9B59B6', '#F39C12', '#16A085',
  ];
  return PALETTE[fallbackIndex % PALETTE.length];
}

function CategoriaCard({ categoria, index }: { categoria: any; index?: number }) {
  const restante = categoria.monto_esperado - categoria.monto_real;
  const progreso =
    categoria.monto_esperado > 0
      ? Math.min(categoria.monto_real / categoria.monto_esperado, 1)
      : 0;

  const color = resolveCategoryColor(categoria.nombre, categoria.ID ?? 0);

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.nameRow}>
          <View style={[cardStyles.dot, { backgroundColor: color }]} />
          <Text style={cardStyles.cardTitle}>{categoria.nombre}</Text>
        </View>
        <Text style={cardStyles.cardPercent}>{categoria.porcentaje}%</Text>
      </View>

      <Text style={cardStyles.cardAmount}>
        ${Math.round(categoria.monto_esperado).toLocaleString('es-CO')}
      </Text>

      <View style={cardStyles.barBackground}>
        <View
          style={[
            cardStyles.barFill,
            { width: `${progreso * 100}%` as any, backgroundColor: color },
          ]}
        />
      </View>

      <View style={cardStyles.cardFooter}>
        <Text style={cardStyles.spent}>
          Gastado: ${Math.round(categoria.monto_real).toLocaleString('es-CO')}
        </Text>
        <Text style={cardStyles.left}>
          Restante: ${Math.round(restante).toLocaleString('es-CO')}
        </Text>
      </View>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: MidasColors.appBackground,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
    gap: 12,
  },
  title: {
    color: MidasColors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    backgroundColor: MidasColors.cardBackground,
    color: MidasColors.textPrimary,
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  // ── Selector de método ─────────────────────────────────────────────────
  methodGroup: {
    gap: 8,
  },
  methodBtn: {
    backgroundColor: MidasColors.cardBackground,
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  methodBtnActive: {
    backgroundColor: MidasColors.gold,
    borderColor: MidasColors.gold,
  },
  methodBtnText: {
    color: MidasColors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  methodBtnTextActive: {
    color: '#0F0F0F',
  },
  hint: {
    color: MidasColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  // ── Botón generar ──────────────────────────────────────────────────────
  generateButton: {
    backgroundColor: MidasColors.gold,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  generateButtonDisabled: {
    opacity: 0.4,
  },
  generateText: {
    color: '#0F0F0F',
    fontWeight: '700',
    fontSize: 15,
  },
  // ── Total ──────────────────────────────────────────────────────────────
  totalContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    color: MidasColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    color: MidasColors.gold,
    fontSize: 30,
    fontWeight: '700',
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: MidasColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardTitle: {
    color: MidasColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  cardPercent: {
    color: MidasColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  cardAmount: {
    color: MidasColors.textSecondary,
    fontSize: 13,
  },
  barBackground: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spent: {
    color: MidasColors.textSecondary,
    fontSize: 12,
  },
  left: {
    color: MidasColors.textSecondary,
    fontSize: 12,
  },
});
