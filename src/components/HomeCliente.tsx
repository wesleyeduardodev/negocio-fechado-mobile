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

interface HomeClienteProps {
  onOpenDrawer?: () => void;
}

export default function HomeCliente({ onOpenDrawer }: HomeClienteProps) {
  const { usuario } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAllCategorias, setShowAllCategorias] = useState(false);

  const { data: categorias, isLoading: isLoadingCategorias, refetch: refetchCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriaService.listar,
    staleTime: 1000 * 60 * 5,
  });

  const { data: solicitacoesData, isLoading: isLoadingSolicitacoes, refetch: refetchSolicitacoes } = useQuery({
    queryKey: ['solicitacoes'],
    queryFn: () => solicitacaoService.listar(0, 10),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useFocusEffect(
    useCallback(() => {
      refetchSolicitacoes();
    }, [refetchSolicitacoes])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategorias(), refetchSolicitacoes()]);
    setRefreshing(false);
  };

  const getIconName = (icone: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[icone] || 'ellipse';
  };

  const getIconColors = (icone: string) => {
    return ICON_COLORS[icone] || { bg: '#f3f4f6', icon: '#6b7280' };
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${diffHours}h atras`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atras`;
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
          <View style={styles.solicitacaoMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
            <Text style={styles.solicitacaoData}>{formatRelativeDate(solicitacao.criadoEm)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  const categoriasToShow = showAllCategorias ? categorias : categorias?.slice(0, 8);
  const hasMoreCategorias = categorias && categorias.length > 8;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onOpenDrawer}>
          <Ionicons name="menu" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {usuario?.nome?.split(' ')[0] || 'Usuario'} - Cliente
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            {hasMoreCategorias && (
              <TouchableOpacity onPress={() => setShowAllCategorias(!showAllCategorias)}>
                <Text style={styles.seeAllText}>
                  {showAllCategorias ? 'Ver menos' : 'Ver todas'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingCategorias ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : (
            <View style={styles.categoriasGrid}>
              {categoriasToShow?.map(renderCategoria)}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.novaSolicitacaoButton}
          onPress={() => router.push('/criar-solicitacao')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.novaSolicitacaoText}>Nova Solicitacao</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Minhas Solicitacoes</Text>
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
              <Ionicons name="document-text-outline" size={56} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Nenhuma solicitacao</Text>
              <Text style={styles.emptySubtitle}>
                Selecione uma categoria acima para criar sua primeira solicitacao
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
  novaSolicitacaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 24,
  },
  novaSolicitacaoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    marginBottom: 6,
  },
  solicitacaoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
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
