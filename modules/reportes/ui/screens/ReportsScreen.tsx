import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MidasColors } from '@/constants/theme';
import { useReporte } from '../../hooks/useReporte';
import { exportarReportePDF } from '../../services/exportar-pdf.service';
import { AportesMetasSection } from '../components/AportesMetasSection';
import { GastosCategoriaSection } from '../components/GastosCategoriaSection';
import { InsightMayorGasto } from '../components/InsightMayorGasto';
import { PeriodSelector } from '../components/PeriodSelector';
import { PresupuestoVsRealSection } from '../components/PresupuestoVsRealSection';
import { ProductosSection } from '../components/ProductosSection';
import { ResumenCard } from '../components/ResumenCard';
import { TendenciaSection } from '../components/TendenciaSection';

export default function ReportsScreen() {
  const { periodo, setPeriodo, data } = useReporte();
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
        <Text style={styles.title}>Reportes</Text>
        <TouchableOpacity
          style={[styles.exportBtn, exportando && styles.exportBtnDisabled]}
          onPress={handleExportar}
          disabled={exportando}
          activeOpacity={0.85}
        >
          <Text style={styles.exportText}>{exportando ? 'Generando…' : 'Exportar PDF'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <PeriodSelector periodo={periodo} onChange={setPeriodo} />
        <ResumenCard resumen={data.resumen} />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MidasColors.appBackground,
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
    color: MidasColors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  exportBtn: {
    backgroundColor: MidasColors.gold,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportText: {
    color: '#0F0F0F',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    padding: 20,
    paddingBottom: 110,
    gap: 20,
  },
});
