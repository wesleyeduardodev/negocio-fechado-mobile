import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

import { orcamentoService } from '@/src/services/orcamentoService';
import { OrcamentoEnviado, StatusOrcamento } from '@/src/types/orcamento';

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

const STATUS_CONFIG: Record<StatusOrcamento, { label: string; color: string; bg: string }> = {
  PENDENTE: { label: 'Pendente', color: '#d97706', bg: '#fef3c7' },
  ACEITO: { label: 'Aceito', color: '#059669', bg: '#d1fae5' },
  RECUSADO: { label: 'Recusado', color: '#dc2626', bg: '#fee2e2' },
  EXPIRADO: { label: 'Expirado', color: '#6b7280', bg: '#f3f4f6' },
};

export default function MeusOrcamentosScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['orcamentos-enviados'],
    queryFn: ({ pageParam = 0 }) => orcamentoService.listarEnviados(pageParam, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.number + 1;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const orcamentos = data?.pages.flatMap((page) => page.content) ?? [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const getIconName = (icone: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[icone] || 'ellipse';
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderOrcamento = ({ item }: { item: OrcamentoEnviado }) => {
    const statusConfig = STATUS_CONFIG[item.status];

    return (
      <TouchableOpacity
        style={styles.orcamentoCard}
        onPress={() => router.push(`/solicitacao/${item.solicitacaoId}?modo=profissional`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoriaInfo}>
            <View style={styles.categoriaIcon}>
              <Ionicons name={getIconName(item.categoriaIcone)} size={18} color="#10b981" />
            </View>
            <Text style={styles.categoriaNome}>{item.categoriaNome}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.solicitacaoTitulo} numberOfLines={2}>
          {item.solicitacaoTitulo}
        </Text>

        <View style={styles.clienteRow}>
          <Ionicons name="person-outline" size={14} color="#6b7280" />
          <Text style={styles.clienteNome}>{item.clienteNome}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.valorContainer}>
            <Text style={styles.valorLabel}>Seu orcamento:</Text>
            <Text style={styles.valorText}>{formatCurrency(item.valor)}</Text>
          </View>
          <Text style={styles.dataText}>{formatDate(item.criadoEm)}</Text>
        </View>

        <View style={styles.prazoRow}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.prazoText}>Prazo: {item.prazoEstimado}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#10b981" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>Nenhum orcamento enviado</Text>
        <Text style={styles.emptySubtitle}>
          Quando voce enviar orcamentos para solicitacoes, eles aparecerao aqui
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Orcamentos</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={orcamentos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrcamento}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#10b981']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  orcamentoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoriaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoriaIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriaNome: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  solicitacaoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  clienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  clienteNome: {
    fontSize: 13,
    color: '#6b7280',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  valorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valorLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  valorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  dataText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  prazoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  prazoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  loadingMore: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
