import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MidasColors } from '@/constants/theme';
import { usePresupuestoViewModel } from '../../modules/presupuesto/PresupuestoViewModel';
import { CustomBudgetManager } from '../../modules/presupuesto/ui/CustomBudgetManager';

type Metodo = '50-30-20' | '60-20-20' | 'personalizado';

// Categorías iniciales que cada plantilla propone al abrir el manager
const TEMPLATE_CATS: Record<Metodo, { nombre: string; monto: number }[]> = {
  '50-30-20':      [
    { nombre: 'Needs',          monto: 0 },
    { nombre: 'Wants',          monto: 0 },
    { nombre: 'Savings & Debt', monto: 0 },
  ],
  '60-20-20':      [
    { nombre: 'Needs',          monto: 0 },
    { nombre: 'Wants',          monto: 0 },
    { nombre: 'Savings & Debt', monto: 0 },
  ],
  'personalizado': [],  // Se llena dinámicamente con las categorías actuales del DB
};

const METODO_HINTS: Record<Metodo, string> = {
  '50-30-20':
    'Plantilla: Necesidades, Deseos y Ahorro. Asigna el monto mensual a cada una.',
  '60-20-20':
    'Plantilla: Necesidades, Deseos y Ahorro. Ajusta los montos según tu situación.',
  'personalizado':
    'Define tus propias categorías y montos. Empieza desde cero o modifica las categorías actuales.',
};

export default function PresupuestoScreen() {
  const {
    categorias,
    generarPresupuestoDesdeMontos,
    cargarCategorias,
  } = usePresupuestoViewModel();

  const [metodo,            setMetodo]           = useState<Metodo>('50-30-20');
  const [showCustomManager, setShowCustomManager] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      cargarCategorias();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const total = categorias.reduce((acc, cat: any) => acc + cat.monto_esperado, 0);

  // Categorías iniciales que se pasan al manager según la plantilla activa
  const categoriasParaManager: { nombre: string; monto: number }[] =
    metodo === 'personalizado'
      ? categorias.map((c: any) => ({ nombre: c.nombre, monto: c.monto_esperado }))
      : TEMPLATE_CATS[metodo];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Tu presupuesto mensual</Text>

        {/* ── Selector de plantilla ────────────────────────────────────── */}
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
                <Text style={[styles.methodBtnText, active && styles.methodBtnTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.hint}>{METODO_HINTS[metodo]}</Text>

        {/* ── Botón configurar ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => setShowCustomManager(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.generateText}>Configurar presupuesto</Text>
        </TouchableOpacity>

        {/* ── Resumen total ────────────────────────────────────────────── */}
        {categorias.length > 0 && (
          <>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>TOTAL PRESUPUESTADO</Text>
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

      {/* ── Manager de presupuesto ───────────────────────────────────────── */}
      <CustomBudgetManager
        visible={showCustomManager}
        categoriasIniciales={categoriasParaManager}
        onClose={() => setShowCustomManager(false)}
        onConfirm={(cats) => {
          generarPresupuestoDesdeMontos(cats);
          setShowCustomManager(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Tarjeta de categoría ─────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  needs:            MidasColors.needsColor,
  wants:            MidasColors.wantsColor,
  savings:          MidasColors.savingsColor,
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

function CategoriaCard({ categoria }: { categoria: any }) {
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
        {categoria.porcentaje > 0 && (
          <Text style={cardStyles.cardPercent}>
            {Math.round(categoria.porcentaje * 10) / 10}%
          </Text>
        )}
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
        <Text style={[cardStyles.left, restante < 0 && cardStyles.leftOver]}>
          {restante >= 0
            ? `Restante: $${Math.round(restante).toLocaleString('es-CO')}`
            : `Excedido: $${Math.round(Math.abs(restante)).toLocaleString('es-CO')}`}
        </Text>
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
  generateButton: {
    backgroundColor: MidasColors.gold,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  generateText: {
    color: '#0F0F0F',
    fontWeight: '700',
    fontSize: 15,
  },
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
  leftOver: {
    color: '#E74C3C',
  },
});
