import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import { useReporte } from '../../hooks/useReporte';
import { exportarReportePDF } from '../../services/exportar-pdf.service';
import { AportesMetasSection } from '../components/AportesMetasSection';
import { ConsejoIACard } from '../components/ConsejoIACard';
import { GastosCategoriaSection } from '../components/GastosCategoriaSection';
import { InsightMayorGasto } from '../components/InsightMayorGasto';
import { PeriodSelector } from '../components/PeriodSelector';
import { PresupuestoVsRealSection } from '../components/PresupuestoVsRealSection';
import { ProductosSection } from '../components/ProductosSection';
import { ResumenCard } from '../components/ResumenCard';
import { TendenciaSection } from '../components/TendenciaSection';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { periodo, setPeriodo, data, consejo } = useReporte();
  const styles = useThemedStyles(makeStyles);
  const [exportando, setExportando] = useState(false);

  const handleExportar = async () => {
    setExportando(true);
    try {
      await exportarReportePDF(data, periodo);
    } finally {
      setExportando(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('reports.title')}</Text>
        <TouchableOpacity
          style={[styles.exportBtn, exportando && styles.exportBtnDisabled]}
          onPress={handleExportar}
          disabled={exportando}
          activeOpacity={0.85}
        >
          <Text style={styles.exportText}>{exportando ? t('reports.generating') : t('reports.export')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <PeriodSelector periodo={periodo} onChange={setPeriodo} />
        <ResumenCard resumen={data.resumen} />
        <ConsejoIACard consejo={consejo} esGeneral={periodo.tipo === 'general'} />
        <InsightMayorGasto gastosCategoria={data.gastosCategoria} periodo={periodo} />
        <GastosCategoriaSection gastos={data.gastosCategoria} />
        <PresupuestoVsRealSection comparativa={data.comparativa} />
        <TendenciaSection tendencia={data.tendencia} />
        <AportesMetasSection aportes={data.aportesMetas} />
        <ProductosSection productos={data.productos} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 4,
    },
    title: {
      color: c.textPrimary,
      fontSize: 26,
      fontWeight: '700',
    },
    exportBtn: {
      backgroundColor: c.gold,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    exportBtnDisabled: {
      opacity: 0.6,
    },
    exportText: {
      color: c.onGold,
      fontSize: 14,
      fontWeight: '700',
    },
    container: {
      padding: 20,
      paddingBottom: 110,
      gap: 20,
    },
  });
