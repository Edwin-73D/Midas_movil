import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '../../modules/shared/theme/ThemeContext';
import { presupuestoEvents } from '../../modules/presupuesto/presupuestoEvents';
import { CLAVE_AHORROS } from '../../modules/presupuesto/PresupuestoRepository';
import { usePresupuestoViewModel } from '../../modules/presupuesto/PresupuestoViewModel';
import {
  CustomBudgetManager,
  type CategoriaItem,
} from '../../modules/presupuesto/ui/CustomBudgetManager';

type Metodo = '50-30-20' | '60-20-20' | 'personalizado';

export default function PresupuestoScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const {
    categorias,
    generarPresupuestoDesdeMontos,
    cargarCategorias,
    frecuencia,
    actualizarFrecuencia,
  } = usePresupuestoViewModel();

  const [metodo,            setMetodo]           = useState<Metodo>('50-30-20');
  const [showCustomManager, setShowCustomManager] = useState(false);
  // HU-01: la categoría fija de ahorros existe siempre; no cuenta como
  // "presupuesto configurado" por sí sola.
  const categoriaAhorros = categorias.find((c: any) => c.clave === CLAVE_AHORROS);
  const tienePresupuesto = categorias.some((c: any) => c.clave !== CLAVE_AHORROS);

  useEffect(() => {
    cargarCategorias();
    return presupuestoEvents.subscribe(cargarCategorias);
  }, []);

  const total = categorias.reduce((acc, cat: any) => acc + cat.monto_esperado, 0);

  const templateCats503020 = [
    { nombre: t('budget.categories.needs'), monto: 0 },
    { nombre: t('budget.categories.wants'), monto: 0 },
  ];

  const metodoHints: Record<Metodo, string> = {
    '50-30-20':      t('budget.hint503020'),
    '60-20-20':      t('budget.hint602020'),
    'personalizado': t('budget.hintCustom'),
  };

  // Entrada fija de Ahorros que siempre acompaña a las categorías del manager.
  const ahorrosManagerItem: CategoriaItem = {
    nombre: t('budget.categories.savings'),
    monto: categoriaAhorros?.monto_esperado ?? 0,
    clave: CLAVE_AHORROS,
    fija: true,
  };

  // Categorías iniciales que se pasan al manager: si ya existe presupuesto
  // (edición), siempre se usan las categorías reales guardadas, sin importar
  // el método con el que se haya creado. Las categorías por defecto solo
  // aplican la primera vez que se crea el presupuesto.
  const categoriasRealesParaManager: CategoriaItem[] = categorias.map((c: any) => ({
    nombre: c.nombre,
    monto: c.monto_esperado,
    clave: c.clave ?? undefined,
    fija: c.clave === CLAVE_AHORROS,
  }));

  const categoriasParaManager: CategoriaItem[] =
    tienePresupuesto || metodo === 'personalizado'
      ? categoriasRealesParaManager
      : [...templateCats503020, ahorrosManagerItem];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('budget.monthlyTitle')}</Text>

        {/* ── Selector de plantilla (solo si no hay presupuesto) ──────── */}
        {!tienePresupuesto && (
          <>
            <View style={styles.methodGroup}>
              {(
                [
                  { key: '50-30-20',      label: '50 / 30 / 20' },
                  { key: '60-20-20',      label: '60 / 20 / 20' },
                  { key: 'personalizado', label: t('budget.custom') },
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
            <Text style={styles.hint}>{metodoHints[metodo]}</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => setShowCustomManager(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.generateText}>{t('budget.configureTitle')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Con presupuesto: mostrar categorías + botón editar al final ─ */}
        {tienePresupuesto && (
          <>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>{t('budget.totalBudget').toUpperCase()}</Text>
              <Text style={styles.totalAmount}>
                ${Math.round(total).toLocaleString('es-CO')}
              </Text>
            </View>

            {categorias.map((cat: any) => (
              <CategoriaCard key={cat.ID} categoria={cat} />
            ))}

            <TouchableOpacity
              style={[styles.generateButton, { marginTop: 8 }]}
              onPress={() => setShowCustomManager(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.generateText}>{t('budget.editBudget')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Manager de presupuesto ───────────────────────────────────────── */}
      <CustomBudgetManager
        visible={showCustomManager}
        categoriasIniciales={categoriasParaManager}
        frecuenciaInicial={frecuencia}
        onClose={() => setShowCustomManager(false)}
        onConfirm={async (cats, nuevaFrecuencia) => {
          await generarPresupuestoDesdeMontos(cats);
          if (nuevaFrecuencia !== frecuencia) {
            await actualizarFrecuencia(nuevaFrecuencia);
          }
          setShowCustomManager(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Tarjeta de categoría ─────────────────────────────────────────────────────

function resolveCategoryColor(nombre: string, fallbackIndex: number, c: MidasPalette): string {
  const map: Record<string, string> = {
    needs:            c.needsColor,
    wants:            c.wantsColor,
    savings:          c.savingsColor,
    'savings & debt': c.savingsColor,
  };
  const key = nombre.toLowerCase();
  if (map[key]) return map[key];
  const PALETTE = [c.gold, '#3498DB', c.danger, '#1ABC9C', '#9B59B6', '#F39C12', '#16A085'];
  return PALETTE[fallbackIndex % PALETTE.length];
}

function CategoriaCard({ categoria }: { categoria: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cardStyles = useThemedStyles(makeCardStyles);
  const restante = categoria.monto_esperado - categoria.monto_real;
  const progreso =
    categoria.monto_esperado > 0
      ? Math.min(categoria.monto_real / categoria.monto_esperado, 1)
      : 0;
  const color = resolveCategoryColor(categoria.nombre, categoria.ID ?? 0, colors);

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
          {t('budget.spent')}: ${Math.round(categoria.monto_real).toLocaleString()}
        </Text>
        {(() => {
          const isOver = restante < 0 && categoria.clave !== CLAVE_AHORROS;
          return (
            <Text style={[cardStyles.left, isOver && cardStyles.leftOver]}>
              {isOver
                ? `${t('budget.exceeded')}: $${Math.round(Math.abs(restante)).toLocaleString()}`
                : `${t('budget.remaining')}: $${Math.round(Math.max(restante, 0)).toLocaleString()}`}
            </Text>
          );
        })()}
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    container: {
      flexGrow: 1,
      padding: 20,
      paddingBottom: 100,
      gap: 12,
    },
    title: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 4,
    },
    methodGroup: {
      gap: 8,
    },
    methodBtn: {
      backgroundColor: c.cardBackground,
      padding: 13,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    methodBtnActive: {
      backgroundColor: c.gold,
      borderColor: c.gold,
    },
    methodBtnText: {
      color: c.textSecondary,
      fontWeight: '600',
      fontSize: 14,
    },
    methodBtnTextActive: {
      color: c.onGold,
    },
    hint: {
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      marginTop: -4,
    },
    generateButton: {
      backgroundColor: c.gold,
      padding: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    generateText: {
      color: c.onGold,
      fontWeight: '700',
      fontSize: 15,
    },
    totalContainer: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    totalLabel: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    totalAmount: {
      color: c.gold,
      fontSize: 30,
      fontWeight: '700',
    },
  });

const makeCardStyles = (c: MidasPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.cardBackground,
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
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
    },
    cardPercent: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    cardAmount: {
      color: c.textSecondary,
      fontSize: 13,
    },
    barBackground: {
      height: 6,
      backgroundColor: c.border,
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
      color: c.textSecondary,
      fontSize: 12,
    },
    left: {
      color: c.textSecondary,
      fontSize: 12,
    },
    leftOver: {
      color: c.danger,
    },
  });
