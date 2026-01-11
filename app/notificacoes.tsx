import { useCallback } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

import { notificacaoService } from '@/src/services/notificacaoService';
import { Notificacao, TipoNotificacao } from '@/src/types/notificacao';

const TIPO_CONFIG: Record<TipoNotificacao, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  NOVA_SOLICITACAO: { icon: 'document-text', color: '#3b82f6' },
  NOVO_INTERESSE: { icon: 'person-add', color: '#10b981' },
  INTERESSE_ACEITO: { icon: 'checkmark-circle', color: '#22c55e' },
  SERVICO_CONCLUIDO: { icon: 'checkbox', color: '#6366f1' },
  NOVA_AVALIACAO: { icon: 'star', color: '#f59e0b' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `ha ${diffMinutes} min`;
  if (diffHours < 24) return `ha ${diffHours}h`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `ha ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR');
}

export default function NotificacoesScreen() {
  const queryClient = useQueryClient();

  const { data: notificacoes, isLoading, refetch } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: notificacaoService.listar,
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const marcarLidaMutation = useMutation({
    mutationFn: notificacaoService.marcarComoLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes-count'] });
    },
  });

  const marcarTodasMutation = useMutation({
    mutationFn: notificacaoService.marcarTodasComoLidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes-count'] });
    },
  });

  const handleNotificacaoPress = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarLidaMutation.mutate(notificacao.id);
    }

    if (notificacao.referenciaId) {
      switch (notificacao.tipo) {
        case 'NOVA_SOLICITACAO':
          router.push(`/solicitacao/${notificacao.referenciaId}?modo=profissional`);
          break;
        case 'NOVO_INTERESSE':
        case 'SERVICO_CONCLUIDO':
        case 'NOVA_AVALIACAO':
          router.push(`/solicitacao/${notificacao.referenciaId}`);
          break;
        case 'INTERESSE_ACEITO':
          router.push('/(tabs)');
          break;
      }
    }
  };

  const temNaoLidas = notificacoes?.some((n) => !n.lida);

  const renderNotificacao = ({ item }: { item: Notificacao }) => {
    const config = TIPO_CONFIG[item.tipo];

    return (
      <TouchableOpacity
        style={[styles.notificacaoItem, !item.lida && styles.notificacaoNaoLida]}
        onPress={() => handleNotificacaoPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        <View style={styles.notificacaoContent}>
          <Text style={[styles.notificacaoTitulo, !item.lida && styles.notificacaoTituloNaoLida]}>
            {item.titulo}
          </Text>
          <Text style={styles.notificacaoCorpo} numberOfLines={2}>
            {item.corpo}
          </Text>
          <Text style={styles.notificacaoTempo}>{formatTimeAgo(item.criadoEm)}</Text>
        </View>
        {!item.lida && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificacoes</Text>
        {temNaoLidas ? (
          <TouchableOpacity
            style={styles.marcarTodasButton}
            onPress={() => marcarTodasMutation.mutate()}
            disabled={marcarTodasMutation.isPending}
          >
            <Text style={styles.marcarTodasText}>Marcar lidas</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : notificacoes && notificacoes.length > 0 ? (
        <FlatList
          data={notificacoes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificacao}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} colors={['#3b82f6']} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Nenhuma notificacao</Text>
          <Text style={styles.emptyText}>
            Voce sera notificado sobre novas solicitacoes e interesses
          </Text>
        </View>
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
  marcarTodasButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  marcarTodasText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    paddingVertical: 8,
  },
  notificacaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  notificacaoNaoLida: {
    backgroundColor: '#eff6ff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificacaoContent: {
    flex: 1,
  },
  notificacaoTitulo: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  notificacaoTituloNaoLida: {
    fontWeight: '600',
    color: '#111827',
  },
  notificacaoCorpo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificacaoTempo: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
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
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
