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
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { solicitacaoService } from '@/src/services/solicitacaoService';
import { StatusSolicitacao } from '@/src/types/solicitacao';

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

const STATUS_CONFIG: Record<StatusSolicitacao, { label: string; color: string; bg: string }> = {
  ABERTA: { label: 'Aberta', color: '#059669', bg: '#d1fae5' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: '#d97706', bg: '#fef3c7' },
  CONCLUIDA: { label: 'Concluida', color: '#2563eb', bg: '#dbeafe' },
  CANCELADA: { label: 'Cancelada', color: '#dc2626', bg: '#fee2e2' },
};

export default function SolicitacaoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: solicitacao, isLoading, error } = useQuery({
    queryKey: ['solicitacao', id],
    queryFn: () => solicitacaoService.buscarPorId(Number(id)),
    enabled: !!id,
  });

  const cancelarMutation = useMutation({
    mutationFn: () => solicitacaoService.cancelar(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacao', id] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-stats'] });
      Alert.alert('Sucesso', 'Solicitacao cancelada');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao cancelar';
      Alert.alert('Erro', message);
    },
  });

  const handleCancelar = () => {
    Alert.alert(
      'Cancelar Solicitacao',
      'Tem certeza que deseja cancelar esta solicitacao?',
      [
        { text: 'Nao', style: 'cancel' },
        { text: 'Sim, cancelar', style: 'destructive', onPress: () => cancelarMutation.mutate() },
      ]
    );
  };

  const getIconName = (icone: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[icone] || 'ellipse';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !solicitacao) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#d1d5db" />
          <Text style={styles.errorText}>Solicitacao nao encontrada</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[solicitacao.status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.dateText}>Criada em {formatDate(solicitacao.criadoEm)}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.categoriaHeader}>
            <View style={styles.categoriaIcon}>
              <Ionicons
                name={getIconName(solicitacao.categoriaIcone)}
                size={24}
                color="#3b82f6"
              />
            </View>
            <Text style={styles.categoriaNome}>{solicitacao.categoriaNome}</Text>
          </View>

          <Text style={styles.titulo}>{solicitacao.titulo}</Text>
          <Text style={styles.descricao}>{solicitacao.descricao}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <Text style={styles.infoText}>
              {solicitacao.bairro}, {solicitacao.cidadeNome} - {solicitacao.uf}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Orcamentos</Text>
          {solicitacao.totalOrcamentos === 0 ? (
            <View style={styles.emptyOrcamentos}>
              <Ionicons name="document-text-outline" size={40} color="#d1d5db" />
              <Text style={styles.emptyText}>Nenhum orcamento recebido</Text>
              <Text style={styles.emptySubtext}>
                Profissionais da regiao poderao enviar orcamentos
              </Text>
            </View>
          ) : (
            <Text style={styles.orcamentosCount}>
              {solicitacao.totalOrcamentos} orcamento(s) recebido(s)
            </Text>
          )}
        </View>

        {solicitacao.status === 'ABERTA' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelar}
            disabled={cancelarMutation.isPending}
          >
            {cancelarMutation.isPending ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                <Text style={styles.cancelButtonText}>Cancelar Solicitacao</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  errorButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  categoriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  categoriaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriaNome: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  descricao: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyOrcamentos: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  orcamentosCount: {
    fontSize: 15,
    color: '#374151',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
