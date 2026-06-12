import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MidasColors } from '@/constants/theme';
import { etiquetaPeriodo, type Periodo } from '../../domain/report.model';

interface Props {
  periodo: Periodo;
  onChange: (p: Periodo) => void;
}

export function PeriodSelector({ periodo, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const esGeneral = periodo.tipo === 'general';

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && date) {
      onChange({ tipo: 'mes', anio: date.getFullYear(), mes: date.getMonth() + 1 });
    }
  };

  // Fecha base que alimenta el picker: el mes seleccionado o el actual.
  const pickerValue =
    periodo.tipo === 'mes' ? new Date(periodo.anio, periodo.mes - 1, 1) : new Date();

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, esGeneral && styles.btnActive]}
        onPress={() => onChange({ tipo: 'general' })}
        activeOpacity={0.8}
      >
        <Text style={[styles.btnText, esGeneral && styles.btnTextActive]}>General</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, !esGeneral && styles.btnActive]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.btnText, !esGeneral && styles.btnTextActive]}>
          {esGeneral ? 'Elegir mes ▾' : `${etiquetaPeriodo(periodo)} ▾`}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: MidasColors.cardBackground,
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  btnActive: {
    backgroundColor: MidasColors.gold,
    borderColor: MidasColors.gold,
  },
  btnText: {
    color: MidasColors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  btnTextActive: {
    color: '#0F0F0F',
  },
});
