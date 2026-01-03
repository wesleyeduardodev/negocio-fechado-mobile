import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore, ModoApp } from '@/src/stores/authStore';
import { profissionalService } from '@/src/services/profissionalService';
import { solicitacaoService } from '@/src/services/solicitacaoService';

export default function PerfilScreen() {
  const { usuario, logout, modoAtual, setModo } = useAuthStore();

  const { data: isProfissional, isLoading: isLoadingProfissional } = useQuery({
    queryKey: ['profissional-status'],
    queryFn: profissionalService.isProfissional,
  });

  const { data: stats } = useQuery({
    queryKey: ['solicitacoes-stats'],
    queryFn: solicitacaoService.getStats,
  });

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleModoChange = (modo: ModoApp) => {
    if (modo === 'profissional' && !isProfissional) {
      Alert.alert(
        'Criar Perfil Profissional',
        'Voce ainda nao tem um perfil profissional. Deseja criar agora?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Criar Perfil', onPress: () => router.push('/tornar-se-profissional') },
        ]
      );
      return;
    }
    setModo(modo);
  };

  const menuItemsCliente = [
    {
      icon: 'person-outline',
      label: 'Editar Perfil',
      onPress: () => router.push('/editar-perfil'),
    },
    {
      icon: 'document-text-outline',
      label: 'Minhas Solicitacoes',
      onPress: () => {},
    },
    {
      icon: 'time-outline',
      label: 'Historico',
      onPress: () => {},
    },
  ];

  const menuItemsProfissional = [
    {
      icon: 'briefcase-outline',
      label: 'Meu Perfil Profissional',
      onPress: () => router.push('/meu-perfil-profissional'),
    },
    {
      icon: 'chatbubbles-outline',
      label: 'Meus Orcamentos',
      onPress: () => {},
    },
    {
      icon: 'bar-chart-outline',
      label: 'Estatisticas',
      onPress: () => {},
    },
  ];

  const menuItemsGeral = [
    {
      icon: 'notifications-outline',
      label: 'Notificacoes',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      label: 'Ajuda e Suporte',
      onPress: () => {},
    },
    {
      icon: 'document-text-outline',
      label: 'Termos de Uso',
      onPress: () => {},
    },
  ];

  const currentMenuItems = modoAtual === 'profissional' ? menuItemsProfissional : menuItemsCliente;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={modoAtual === 'profissional' ? ['#10b981', '#059669'] : ['#3b82f6', '#1d4ed8']}
          style={styles.profileCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>{usuario?.nome || 'Usuario'}</Text>
          <View style={styles.profileInfo}>
            <Ionicons name="call-outline" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.profileInfoText}>{usuario?.celular}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.profileInfoText}>
              {usuario?.bairro}, {usuario?.cidadeNome} - {usuario?.uf}
            </Text>
          </View>
        </LinearGradient>

        {isLoadingProfissional ? (
          <View style={styles.loadingModeContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        ) : (
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                modoAtual === 'cliente' && styles.modeButtonActive,
              ]}
              onPress={() => handleModoChange('cliente')}
            >
              <Ionicons
                name="person"
                size={18}
                color={modoAtual === 'cliente' ? '#3b82f6' : '#6b7280'}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  modoAtual === 'cliente' && styles.modeButtonTextActive,
                ]}
              >
                Cliente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                modoAtual === 'profissional' && styles.modeButtonActivePro,
                !isProfissional && styles.modeButtonDisabled,
              ]}
              onPress={() => handleModoChange('profissional')}
            >
              <Ionicons
                name="briefcase"
                size={18}
                color={modoAtual === 'profissional' ? '#10b981' : '#6b7280'}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  modoAtual === 'profissional' && styles.modeButtonTextActivePro,
                ]}
              >
                Profissional
              </Text>
              {!isProfissional && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NOVO</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {modoAtual === 'cliente' && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.total || 0}</Text>
              <Text style={styles.statLabel}>Solicitacoes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.concluidas || 0}</Text>
              <Text style={styles.statLabel}>Concluidas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Avaliacoes</Text>
            </View>
          </View>
        )}

        {modoAtual === 'profissional' && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Orcamentos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Finalizados</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0.0</Text>
              <Text style={styles.statLabel}>Avaliacao</Text>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>
            {modoAtual === 'profissional' ? 'Area Profissional' : 'Minha Conta'}
          </Text>
          {currentMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={[
                  styles.menuIconContainer,
                  modoAtual === 'profissional' && { backgroundColor: '#d1fae5' }
                ]}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={modoAtual === 'profissional' ? '#10b981' : '#3b82f6'}
                  />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Configuracoes</Text>
          {menuItemsGeral.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={22} color="#3b82f6" />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Versao 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  profileInfoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  loadingModeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#eff6ff',
  },
  modeButtonActivePro: {
    backgroundColor: '#d1fae5',
  },
  modeButtonDisabled: {
    opacity: 0.8,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#3b82f6',
  },
  modeButtonTextActivePro: {
    color: '#10b981',
  },
  newBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
  },
});
