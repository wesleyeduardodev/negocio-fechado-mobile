import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore, ModoApp } from '@/src/stores/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isProfissional: boolean;
}

export default function DrawerMenu({ isOpen, onClose, isProfissional }: DrawerMenuProps) {
  const insets = useSafeAreaInsets();
  const { usuario, logout, modoAtual, setModo } = useAuthStore();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleModoChange = (value: boolean) => {
    const novoModo: ModoApp = value ? 'profissional' : 'cliente';

    if (novoModo === 'profissional' && !isProfissional) {
      Alert.alert(
        'Criar Perfil Profissional',
        'Voce ainda nao tem um perfil profissional. Deseja criar agora?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Criar Perfil',
            onPress: () => {
              onClose();
              router.push('/tornar-se-profissional');
            }
          },
        ]
      );
      return;
    }

    setModo(novoModo);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            onClose();
            logout();
          }
        },
      ]
    );
  };

  const navigateTo = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const menuItemsCliente = [
    {
      icon: 'home-outline' as const,
      label: 'Inicio',
      onPress: () => onClose(),
    },
    {
      icon: 'document-text-outline' as const,
      label: 'Minhas Solicitacoes',
      onPress: () => onClose(),
    },
    {
      icon: 'person-outline' as const,
      label: 'Editar Perfil',
      onPress: () => navigateTo('/editar-perfil'),
    },
  ];

  const menuItemsProfissional = [
    {
      icon: 'briefcase-outline' as const,
      label: 'Meu Perfil Profissional',
      onPress: () => navigateTo('/meu-perfil-profissional'),
    },
    {
      icon: 'chatbubbles-outline' as const,
      label: 'Meus Orcamentos',
      onPress: () => navigateTo('/meus-orcamentos'),
    },
  ];

  const menuItemsGeral = [
    {
      icon: 'notifications-outline' as const,
      label: 'Notificacoes',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline' as const,
      label: 'Ajuda e Suporte',
      onPress: () => {},
    },
    {
      icon: 'document-text-outline' as const,
      label: 'Termos de Uso',
      onPress: () => {},
    },
  ];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.overlay, { opacity }]}>
          <Pressable style={styles.overlayPressable} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX }],
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
            <Text style={styles.userName}>{usuario?.nome || 'Usuario'}</Text>
            <Text style={styles.userPhone}>{usuario?.celular}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#6b7280" />
              <Text style={styles.locationText}>
                {usuario?.bairro}, {usuario?.cidadeNome}
              </Text>
            </View>
          </View>

          <View style={styles.modeSection}>
            <View style={styles.modeRow}>
              <View style={styles.modeInfo}>
                <Ionicons
                  name={modoAtual === 'profissional' ? 'briefcase' : 'person'}
                  size={20}
                  color={modoAtual === 'profissional' ? '#10b981' : '#3b82f6'}
                />
                <Text style={styles.modeLabel}>
                  Modo {modoAtual === 'profissional' ? 'Profissional' : 'Cliente'}
                </Text>
              </View>
              <Switch
                value={modoAtual === 'profissional'}
                onValueChange={handleModoChange}
                trackColor={{ false: '#dbeafe', true: '#d1fae5' }}
                thumbColor={modoAtual === 'profissional' ? '#10b981' : '#3b82f6'}
              />
            </View>
            {!isProfissional && (
              <TouchableOpacity
                style={styles.becomeProfessionalButton}
                onPress={() => {
                  onClose();
                  router.push('/tornar-se-profissional');
                }}
              >
                <Text style={styles.becomeProfessionalText}>Quero ser profissional</Text>
                <Ionicons name="arrow-forward" size={16} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.menuSection}>
            {menuItemsCliente.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={22} color="#374151" />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isProfissional && modoAtual === 'profissional' && (
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Area Profissional</Text>
              {menuItemsProfissional.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon} size={22} color="#10b981" />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Configuracoes</Text>
            {menuItemsGeral.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={22} color="#6b7280" />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              <Text style={styles.logoutText}>Sair da Conta</Text>
            </TouchableOpacity>
            <Text style={styles.version}>Versao 1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayPressable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6b7280',
  },
  modeSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  becomeProfessionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
  },
  becomeProfessionalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  menuSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  menuItemLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
  },
});
