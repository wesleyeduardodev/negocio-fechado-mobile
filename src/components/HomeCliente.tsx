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
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthStore } from '@/src/stores/authStore';
import { categoriaService } from '@/src/services/categoriaService';
import { solicitacaoService } from '@/src/services/solicitacaoService';
import { Categoria } from '@/src/types/categoria';
import { SolicitacaoResumo, StatusSolicitacao } from '@/src/types/solicitacao';

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

const STATUS_CONFIG: Record<StatusSolicitacao, { label: string; color: string; bg: string }> = {
  ABERTA: { label: 'Aberta', color: '#059669', bg: '#d1fae5' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: '#d97706', bg: '#fef3c7' },
  CONCLUIDA: { label: 'Concluida', color: '#2563eb', bg: '#dbeafe' },
  CANCELADA: { label: 'Cancelada', color: '#dc2626', bg: '#fee2e2' },
};

export default function HomeCliente() {
  const { usuario } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: categorias, isLoading: isLoadingCategorias, refetch: refetchCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriaService.listar,
    staleTime: 1000 * 60 * 5,
  });

  const { data: solicitacoesData, isLoading: isLoadingSolicitacoes, refetch: refetchSolicitacoes } = useQuery({
    queryKey: ['solicitacoes'],
    queryFn: () => solicitacaoService.listar(0, 5),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['solicitacoes-stats'],
    queryFn: solicitacaoService.getStats,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useFocusEffect(
    useCallback(() => {
      refetchSolicitacoes();
      refetchStats();
    }, [refetchSolicitacoes, refetchStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategorias(), refetchSolicitacoes(), refetchStats()]);
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
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderCategoria = (categoria: Categoria) => {
    const colors = getIconColors(categoria.icone);
    return (
      <TouchableOpacity
        key={categoria.id}
        style={styles.categoriaCard}
        onPress={() => router.push({ pathname: '/criar-solicitacao', params: { categoriaId: categoria.id } })}
      >
        <View style={[styles.categoriaIcon, { backgroundColor: colors.bg }]}>
          <Ionicons name={getIconName(categoria.icone)} size={24} color={colors.icon} />
        </View>
        <Text style={styles.categoriaText} numberOfLines={1}>
          {categoria.nome}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSolicitacao = (solicitacao: SolicitacaoResumo) => {
    const statusConfig = STATUS_CONFIG[solicitacao.status];
    const iconColors = getIconColors(solicitacao.categoriaIcone);

    return (
      <TouchableOpacity
        key={solicitacao.id}
        style={styles.solicitacaoCard}
        onPress={() => router.push(`/solicitacao/${solicitacao.id}`)}
      >
        <View style={[styles.solicitacaoIcon, { backgroundColor: iconColors.bg }]}>
          <Ionicons name={getIconName(solicitacao.categoriaIcone)} size={20} color={iconColors.icon} />
        </View>
        <View style={styles.solicitacaoInfo}>
          <Text style={styles.solicitacaoTitulo} numberOfLines={1}>{solicitacao.titulo}</Text>
          <Text style={styles.solicitacaoCategoria}>{solicitacao.categoriaNome}</Text>
        </View>
        <View style={styles.solicitacaoRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
          <Text style={styles.solicitacaoData}>{formatDate(solicitacao.criadoEm)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.modeBadge}>
            <Ionicons name="person" size={14} color="#3b82f6" />
            <Text style={styles.modeBadgeText}>Modo Cliente</Text>
          </View>
          <Text style={styles.userName}>{usuario?.nome?.split(' ')[0] || 'Usuario'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={styles.banner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerIcon}>
              <Ionicons name="briefcase" size={32} color="#fff" />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Negocio Fechado</Text>
              <Text style={styles.bannerSubtitle}>
                Encontre profissionais de confianca na sua regiao
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.locationCard}>
          <Ionicons name="location" size={20} color="#3b82f6" />
          <Text style={styles.locationText}>
            {usuario?.bairro}, {usuario?.cidadeNome} - {usuario?.uf}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorias</Text>
          </View>

          {isLoadingCategorias ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : (
            <View style={styles.categoriasGrid}>
              {categorias?.slice(0, 8).map(renderCategoria)}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitleNoMargin}>Acoes Rapidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/criar-solicitacao')}>
              <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="add-circle-outline" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.actionText}>Nova Solicitacao</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="time-outline" size={28} color="#f59e0b" />
              </View>
              <Text style={styles.actionText}>Em Andamento</Text>
              <Text style={styles.actionCount}>{stats?.emAndamento || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="checkmark-circle-outline" size={28} color="#10b981" />
              </View>
              <Text style={styles.actionText}>Concluidas</Text>
              <Text style={styles.actionCount}>{stats?.concluidas || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="star-outline" size={28} color="#ec4899" />
              </View>
              <Text style={styles.actionText}>Avaliacoes</Text>
              <Text style={styles.actionCount}>0</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleNoMargin}>Minhas Solicitacoes</Text>
            {solicitacoesData && solicitacoesData.content.length > 0 && (
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingSolicitacoes ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : solicitacoesData && solicitacoesData.content.length > 0 ? (
            <View style={styles.solicitacoesList}>
              {solicitacoesData.content.map(renderSolicitacao)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Nenhuma solicitacao</Text>
              <Text style={styles.emptySubtitle}>
                Crie sua primeira solicitacao e encontre profissionais qualificados
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/criar-solicitacao')}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Criar Solicitacao</Text>
              </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  modeBadgeText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  banner: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionTitleNoMargin: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  categoriasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoriaCard: {
    width: '22%',
    alignItems: 'center',
  },
  categoriaIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoriaText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  actionCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
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
  },
  solicitacaoIcon: {
    width: 44,
    height: 44,
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
  solicitacaoRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
