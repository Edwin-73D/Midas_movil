import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { MidasColors } from '@/constants/theme';
import { useAuth } from '@/modules/auth/context/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días,';
  if (hour < 18) return 'Buenas tardes,';
  return 'Buenas noches,';
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Overlay: cierra el modal al tocar fuera */}
      <Pressable style={styles.overlay} onPress={onCancel} />

      {/* Diálogo centrado */}
      <View style={styles.dialogWrapper} pointerEvents="box-none">
        <View style={styles.dialog}>
          {/* Ícono decorativo */}
          <View style={styles.dialogIconWrap}>
            <Ionicons
              name="log-out-outline"
              size={28}
              color={MidasColors.gold}
            />
          </View>

          <Text style={styles.dialogTitle}>Cerrar sesión</Text>
          <Text style={styles.dialogMessage}>
            ¿Quieres salir de la sesión?
          </Text>

          <View style={styles.dialogButtons}>
            {/* No */}
            <TouchableOpacity
              style={styles.btnNo}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.btnNoLabel}>No</Text>
            </TouchableOpacity>

            {/* Sí */}
            <TouchableOpacity
              style={styles.btnSi}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSiLabel}>Sí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

export function HomeHeader() {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const username = user?.username ?? 'Usuario';
  const initial  = getInitial(username);
  const greeting = getGreeting();

  function handleConfirmLogout() {
    setShowLogout(false);
    logout();
    // El guard en AuthContext redirige automáticamente a /login
  }

  return (
    <>
      <View style={styles.row}>
        {/* Sección izquierda: avatar + saludo */}
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{username}</Text>
          </View>
        </View>

        {/* Botón logout (derecha) */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogout(true)}
          activeOpacity={0.7}
          hitSlop={10}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color={MidasColors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Modal de confirmación */}
      <LogoutModal
        visible={showLogout}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Header ────────────────────────────────────────────────────────────────
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
    backgroundColor: MidasColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#0F0F0F',
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    color: MidasColors.textSecondary,
    fontSize: 13,
  },
  name: {
    color: MidasColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MidasColors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  // ── Modal overlay ─────────────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  dialogWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  // ── Diálogo ───────────────────────────────────────────────────────────────
  dialog: {
    backgroundColor: MidasColors.cardBackground,
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
    backgroundColor: MidasColors.gold + '18',
    borderWidth: 1,
    borderColor: MidasColors.gold + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dialogTitle: {
    color: MidasColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  dialogMessage: {
    color: MidasColors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
  },
  // ── Botones ───────────────────────────────────────────────────────────────
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
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  btnNoLabel: {
    color: MidasColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  btnSi: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: MidasColors.gold,
  },
  btnSiLabel: {
    color: '#0F0F0F',
    fontSize: 15,
    fontWeight: '700',
  },
});
