import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { type MidasPalette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';
import { MESES } from '../../domain/report.model';
import type { ConsejoState } from '../../hooks/useReporte';

interface Props {
  consejo: ConsejoState;
  esGeneral: boolean;
}

export function ConsejoIACard({ consejo, esGeneral }: Props) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { texto, cargando, mes, hayDatos } = consejo;
  const [modalVisible, setModalVisible] = useState(false);

  const sinDatos = !cargando && (!hayDatos || !texto);

  const subtitulo = esGeneral && mes
    ? t('reports.adviceBasedOn', {
        month: new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(
          new Date(mes.anio, mes.mes - 1, 1)
        ),
        year: mes.anio,
      })
    : null;

  const cardContent = (
    <View style={styles.card}>
      <View style={styles.header}>
        <IconSymbol name="sparkles" size={16} color={colors.gold} />
        <Text style={styles.title}>{t('reports.adviceTitle')}</Text>
        {!cargando && !sinDatos && (
          <Text style={styles.readMoreChip}>{t('reports.readMore')} ›</Text>
        )}
      </View>

      {cargando ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={styles.loadingText}>{t('reports.adviceLoading')}</Text>
        </View>
      ) : sinDatos ? (
        <Text style={styles.body}>{t('reports.adviceNoData')}</Text>
      ) : (
        <>
          <Text style={styles.body} numberOfLines={3} ellipsizeMode="tail">
            {texto}
          </Text>
          {subtitulo && <Text style={styles.subtitle}>{subtitulo}</Text>}
        </>
      )}
    </View>
  );

  if (cargando || sinDatos) {
    return cardContent;
  }

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        {cardContent}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <IconSymbol name="sparkles" size={16} color={colors.gold} />
              <Text style={styles.modalTitle}>{t('reports.adviceModalTitle')}</Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalBody}>{texto}</Text>
              {subtitulo && <Text style={styles.subtitle}>{subtitulo}</Text>}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.closeText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.insightBackground,
      borderRadius: 16,
      padding: 16,
      gap: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      color: c.gold,
      fontSize: 13,
      fontWeight: '700',
      flex: 1,
    },
    readMoreChip: {
      color: c.gold,
      fontSize: 12,
      fontWeight: '600',
    },
    body: {
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 22,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 12,
      fontStyle: 'italic',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    loadingText: {
      color: c.textSecondary,
      fontSize: 14,
    },
    // ── Modal ──────────────────────────────────────────────────────────────────
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalBox: {
      backgroundColor: c.cardBackground,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxHeight: '80%',
      gap: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modalTitle: {
      color: c.gold,
      fontSize: 16,
      fontWeight: '700',
    },
    modalScroll: {
      flexShrink: 1,
    },
    modalBody: {
      color: c.textPrimary,
      fontSize: 16,
      lineHeight: 24,
    },
    closeButton: {
      backgroundColor: c.gold,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    closeText: {
      color: c.onGold,
      fontSize: 15,
      fontWeight: '700',
    },
  });
