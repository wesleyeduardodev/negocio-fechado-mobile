import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthStore } from '@/src/stores/authStore';
import { solicitacaoService } from '@/src/services/solicitacaoService';
import { profissionalService } from '@/src/services/profissionalService';
import { interesseService } from '@/src/services/interesseService';
import { SolicitacaoParaProfissional } from '@/src/types/solicitacao';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  'flash': 'flash',
  'water': 'water',
  'color-palette': 'color-palette',
  'construct': 'construct',
  'hammer': 'hammer',
  'leaf': 'leaf',
  'sparkles': 'sparkles',
  'snow': 'snow',
  'settings': 'settings',
  'key': 'key',
  'layers': 'layers',
  'cut': 'cut',
};

const ICON_COLORS: Record<string, { bg: string; icon: string }> = {
  'flash': { bg: '#fef3c7', icon: '#f59e0b' },
  'water': { bg: '#dbeafe', icon: '#3b82f6' },
  'color-palette': { bg: '#fce7f3', icon: '#ec4899' },
  'construct': { bg: '#fed7aa', icon: '#ea580c' },
  'hammer': { bg: '#e0e7ff', icon: '#6366f1' },
  'leaf': { bg: '#d1fae5', icon: '#10b981' },
  'sparkles': { bg: '#cffafe', icon: '#06b6d4' },
  'snow': { bg: '#dbeafe', icon: '#0ea5e9' },
  'settings': { bg: '#f3e8ff', icon: '#a855f7' },
  'key': { bg: '#fef3c7', icon: '#eab308' },
  'layers': { bg: '#e0e7ff', icon: '#4f46e5' },
  'cut': { bg: '#fee2e2', icon: '#ef4444' },
};

interface HomeProfissionalProps {
  onOpenDrawer?: () => void;
}

export default function HomeProfissional({ onOpenDrawer }: HomeProfissionalProps) {
  const { usuario } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: meuPerfil, refetch: refetchPerfil } = useQuery({
    queryKey: ['meu-perfil-profissional'],
    queryFn: profissionalService.buscarMeuPerfil,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: solicitacoesDisponiveis, refetch: refetchDisponiveis, isLoading } = useQuery({
    queryKey: ['solicitacoes-disponiveis'],
    queryFn: () => solicitacaoService.listarDisponiveis(0, 10),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: statsProfissional, refetch: refetchStats } = useQuery({
    queryKey: ['profissional-stats'],
    queryFn: interesseService.getStats,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useFocusEffect(
    useCallback(() => {
      refetchDisponiveis();
      refetchPerfil();
      refetchStats();
    }, [refetchDisponiveis, refetchPerfil, refetchStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchDisponiveis(), refetchPerfil(), refetchStats()]);
    setRefreshing(false);
  };

  const getIconName = (icone: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[icone] || 'ellipse';
  };

  const getIconColors = (icone: string) => {
    return ICON_COLORS[icone] || { bg: '#f3f4f6', icon: '#6b7280' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `Ha ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderSolicitacao = (solicitacao: SolicitacaoParaProfissional) => {
    const iconColors = getIconColors(solicitacao.categoriaIcone);

    return (
      <TouchableOpacity
        key={solicitacao.id}
        style={styles.solicitacaoCard}
        onPress={() => router.push(`/solicitacao/${solicitacao.id}?modo=profissional`)}
      >
        <View style={[styles.solicitacaoIcon, { backgroundColor: iconColors.bg }]}>
          <Ionicons name={getIconName(solicitacao.categoriaIcone)} size={22} color={iconColors.icon} />
        </View>
        <View style={styles.solicitacaoInfo}>
          <Text style={styles.solicitacaoTitulo} numberOfLines={1}>{solicitacao.titulo}</Text>
          <Text style={styles.solicitacaoCategoria}>{solicitacao.categoriaNome}</Text>
          <View style={styles.clienteInfo}>
            <Ionicons name="person-outline" size={12} color="#6b7280" />
            <Text style={styles.clienteNome}>{solicitacao.clienteNome}</Text>
            <Text style={styles.bairroText}>- {solicitacao.bairro}</Text>
          </View>
        </View>
        <View style={styles.solicitacaoRight}>
          {solicitacao.quantidadeFotos > 0 && (
            <View style={styles.fotosIndicator}>
              <Ionicons name="image-outline" size={14} color="#6b7280" />
              <Text style={styles.fotosCount}>{solicitacao.quantidadeFotos}</Text>
            </View>
          )}
          <Text style={styles.solicitacaoData}>{formatDate(solicitacao.criadoEm)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const totalDisponiveis = solicitacoesDisponiveis?.totalElements || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onOpenDrawer}>
          <Ionicons name="menu" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {usuario?.nome?.split(' ')[0] || 'Usuario'} - Profissional
        </Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="document-text-outline" size={20} color="#10b981" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{totalDisponiveis}</Text>
              <Text style={styles.statLabel}>Disponiveis</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="chatbubbles-outline" size={20} color="#f59e0b" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{statsProfissional?.emNegociacao || 0}</Text>
              <Text style={styles.statLabel}>Em Negociacao</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="checkmark-done-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{statsProfissional?.contratados || 0}</Text>
              <Text style={styles.statLabel}>Contratados</Text>
            </View>
          </TouchableOpacity>
        </View>

        {!meuPerfil?.ativo && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Perfil inativo</Text>
              <Text style={styles.warningText}>
                Ative seu perfil para aparecer para clientes
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/meu-perfil-profissional')}>
              <Text style={styles.warningAction}>Ativar</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.perfilButton}
          onPress={() => router.push('/meu-perfil-profissional')}
        >
          <Ionicons name="settings-outline" size={20} color="#10b981" />
          <Text style={styles.perfilButtonText}>Gerenciar Perfil Profissional</Text>
          <Ionicons name="chevron-forward" size={20} color="#10b981" />
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Solicitacoes Disponiveis</Text>
            {totalDisponiveis > 5 && (
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          ) : solicitacoesDisponiveis && solicitacoesDisponiveis.content.length > 0 ? (
            <View style={styles.solicitacoesList}>
              {solicitacoesDisponiveis.content.map(renderSolicitacao)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={56} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Nenhuma solicitacao disponivel</Text>
              <Text style={styles.emptySubtitle}>
                Novas solicitacoes na sua regiao e categorias aparecerao aqui
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  warningText: {
    fontSize: 12,
    color: '#a16207',
    marginTop: 2,
  },
  warningAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
  },
  perfilButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  perfilButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  solicitacoesList: {
    gap: 12,
  },
  solicitacaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  solicitacaoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  solicitacaoInfo: {
    flex: 1,
  },
  solicitacaoTitulo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  solicitacaoCategoria: {
    fontSize: 13,
    color: '#6b7280',
  },
  clienteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  clienteNome: {
    fontSize: 12,
    color: '#6b7280',
  },
  bairroText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  solicitacaoRight: {
    alignItems: 'flex-end',
  },
  fotosIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  fotosCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  solicitacaoData: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
