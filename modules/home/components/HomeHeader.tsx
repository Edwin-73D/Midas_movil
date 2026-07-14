import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { type MidasPalette } from '@/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useTheme, useThemedStyles } from '@/modules/shared/theme/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'greeting.morning';
  if (hour >= 12 && hour < 18) return 'greeting.afternoon';
  return 'greeting.evening';
}

function getInitial(username: string): string {
  return username.charAt(0).toUpperCase();
}

// ─── Modal de confirmación de logout ─────────────────────────────────────────

function LogoutModal({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onCancel} />

      <View style={styles.dialogWrapper} pointerEvents="box-none">
        <View style={styles.dialog}>
          <View style={styles.dialogIconWrap}>
            <Ionicons name="log-out-outline" size={28} color={colors.gold} />
          </View>

          <Text style={styles.dialogTitle}>{t('settings.confirmTitle')}</Text>
          <Text style={styles.dialogMessage}>{t('settings.confirmMessage')}</Text>

          <View style={styles.dialogButtons}>
            <TouchableOpacity style={styles.btnNo} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.btnNoLabel}>{t('common.no')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSi} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={styles.btnSiLabel}>{t('common.yes')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

export function HomeHeader() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { colors, scheme, toggle } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [showLogout, setShowLogout] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<View>(null);

  const username = user?.username ?? 'Usuario';
  const initial = getInitial(username);
  const greeting = t(getGreetingKey());

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setMenuPos({ top: y + h + 4, right: SCREEN_WIDTH - (x + w) });
    });
  };
  const closeMenu = () => setMenuPos(null);

  function handleConfirmLogout() {
    setShowLogout(false);
    logout();
  }

  return (
    <>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{username}</Text>
          </View>
        </View>

        {/* Menú de ajustes (HU-10) */}
        <TouchableOpacity
          ref={triggerRef}
          style={styles.menuButton}
          onPress={openMenu}
          activeOpacity={0.7}
          hitSlop={10}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Dropdown de ajustes */}
      <Modal
        visible={menuPos != null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu} />
        {menuPos && (
          <View style={[styles.menu, { top: menuPos.top, right: menuPos.right }]}>
            <View style={styles.menuRow}>
              <Ionicons name="moon-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.menuRowText}>{t('settings.darkMode')}</Text>
              <Switch
                value={scheme === 'dark'}
                onValueChange={toggle}
                trackColor={{ false: colors.border, true: colors.gold }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.menuSeparator} />

            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => {
                closeMenu();
                setShowLogout(true);
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuRowText, { color: colors.danger }]}>{t('settings.signOut')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      <LogoutModal
        visible={showLogout}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const makeStyles = (c: MidasPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.gold,
      justifyContent: 'center',
      alignItems: 'center',
    },
    initial: {
      color: c.onGold,
      fontSize: 18,
      fontWeight: '700',
    },
    greeting: {
      color: c.textSecondary,
      fontSize: 13,
    },
    name: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    menuButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    // ── Dropdown de ajustes ───────────────────────────────────────────────
    menuOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    menu: {
      position: 'absolute',
      minWidth: 210,
      backgroundColor: c.cardBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    menuRowText: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    menuSeparator: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: 8,
    },
    // ── Modal overlay / diálogo logout ────────────────────────────────────
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    dialogWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    dialog: {
      backgroundColor: c.cardBackground,
      borderRadius: 20,
      paddingHorizontal: 28,
      paddingTop: 28,
      paddingBottom: 24,
      width: '100%',
      alignItems: 'center',
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 16,
    },
    dialogIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.gold + '18',
      borderWidth: 1,
      borderColor: c.gold + '40',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    dialogTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    dialogMessage: {
      color: c.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 6,
    },
    dialogButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
      marginTop: 4,
    },
    btnNo: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: c.inputBackground,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnNoLabel: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    btnSi: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: c.gold,
    },
    btnSiLabel: {
      color: c.onGold,
      fontSize: 15,
      fontWeight: '700',
    },
  });
