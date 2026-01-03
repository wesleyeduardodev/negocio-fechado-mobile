import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { solicitacaoService } from '@/src/services/solicitacaoService';
import { orcamentoService } from '@/src/services/orcamentoService';
import { StatusSolicitacao } from '@/src/types/solicitacao';
import { OrcamentoResumo, StatusOrcamento } from '@/src/types/orcamento';

type SearchParams = {
  id: string;
  modo?: 'profissional';
};

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

const STATUS_ORCAMENTO_CONFIG: Record<StatusOrcamento, { label: string; color: string; bg: string }> = {
  PENDENTE: { label: 'Pendente', color: '#d97706', bg: '#fef3c7' },
  ACEITO: { label: 'Aceito', color: '#059669', bg: '#d1fae5' },
  RECUSADO: { label: 'Recusado', color: '#dc2626', bg: '#fee2e2' },
  EXPIRADO: { label: 'Expirado', color: '#6b7280', bg: '#f3f4f6' },
};

export default function SolicitacaoDetalheScreen() {
  const { id, modo } = useLocalSearchParams<SearchParams>();
  const queryClient = useQueryClient();
  const isProfissionalMode = modo === 'profissional';

  const { data: solicitacao, isLoading, error, refetch: refetchSolicitacao } = useQuery({
    queryKey: ['solicitacao', id, isProfissionalMode],
    queryFn: () => isProfissionalMode
      ? solicitacaoService.buscarDisponivelPorId(Number(id))
      : solicitacaoService.buscarPorId(Number(id)),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: orcamentos, isLoading: isLoadingOrcamentos, refetch: refetchOrcamentos } = useQuery({
    queryKey: ['orcamentos', id],
    queryFn: () => orcamentoService.listarPorSolicitacao(Number(id)),
    enabled: !!id && !isProfissionalMode,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Refetch ao voltar para a tela
  useFocusEffect(
    useCallback(() => {
      refetchSolicitacao();
      if (!isProfissionalMode) {
        refetchOrcamentos();
      }
    }, [refetchSolicitacao, refetchOrcamentos, isProfissionalMode])
  );

  const aceitarMutation = useMutation({
    mutationFn: (orcamentoId: number) => orcamentoService.aceitar(orcamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacao', id] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos', id] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-stats'] });
      Alert.alert('Sucesso', 'Orcamento aceito! A solicitacao esta agora em andamento.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao aceitar orcamento';
      Alert.alert('Erro', message);
    },
  });

  const recusarMutation = useMutation({
    mutationFn: (orcamentoId: number) => orcamentoService.recusar(orcamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos', id] });
      Alert.alert('Sucesso', 'Orcamento recusado.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao recusar orcamento';
      Alert.alert('Erro', message);
    },
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

  const handleAceitarOrcamento = (orcamento: OrcamentoResumo) => {
    Alert.alert(
      'Aceitar Orcamento',
      `Aceitar orcamento de ${orcamento.profissionalNome} no valor de ${formatCurrency(orcamento.valor)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceitar', onPress: () => aceitarMutation.mutate(orcamento.id) },
      ]
    );
  };

  const handleRecusarOrcamento = (orcamento: OrcamentoResumo) => {
    Alert.alert(
      'Recusar Orcamento',
      `Recusar orcamento de ${orcamento.profissionalNome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Recusar', style: 'destructive', onPress: () => recusarMutation.mutate(orcamento.id) },
      ]
    );
  };

  const handleEnviarOrcamento = () => {
    router.push(`/enviar-orcamento?solicitacaoId=${id}`);
  };

  const handleLigar = (celular: string) => {
    const phoneUrl = `tel:+55${celular}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir o discador');
    });
  };

  const handleWhatsApp = (celular: string, profissionalNome: string) => {
    const mensagem = `Ola ${profissionalNome}, aceite seu orcamento para "${solicitacao?.titulo}" no app Negocio Fechado!`;
    const whatsappUrl = `https://wa.me/55${celular}?text=${encodeURIComponent(mensagem)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir o WhatsApp');
    });
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
        <Text style={styles.headerTitle}>
          {isProfissionalMode ? 'Solicitacao Disponivel' : 'Detalhes'}
        </Text>
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

        {!isProfissionalMode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Orcamentos {orcamentos && orcamentos.length > 0 ? `(${orcamentos.length})` : ''}
            </Text>
            {isLoadingOrcamentos ? (
              <View style={styles.loadingOrcamentos}>
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : !orcamentos || orcamentos.length === 0 ? (
              <View style={styles.emptyOrcamentos}>
                <Ionicons name="document-text-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyText}>Nenhum orcamento recebido</Text>
                <Text style={styles.emptySubtext}>
                  Profissionais da regiao poderao enviar orcamentos
                </Text>
              </View>
            ) : (
              <View style={styles.orcamentosList}>
                {orcamentos.map((orcamento) => {
                  const statusConfig = STATUS_ORCAMENTO_CONFIG[orcamento.status];
                  return (
                    <View key={orcamento.id} style={styles.orcamentoItem}>
                      <View style={styles.orcamentoHeader}>
                        <View style={styles.orcamentoProfissional}>
                          <View style={styles.profissionalAvatar}>
                            <Text style={styles.profissionalAvatarText}>
                              {orcamento.profissionalNome.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.profissionalNome}>{orcamento.profissionalNome}</Text>
                            <Text style={styles.orcamentoData}>
                              {formatDate(orcamento.criadoEm)}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.orcamentoStatusBadge, { backgroundColor: statusConfig.bg }]}>
                          <Text style={[styles.orcamentoStatusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.orcamentoValorRow}>
                        <Text style={styles.orcamentoValorLabel}>Valor:</Text>
                        <Text style={styles.orcamentoValor}>{formatCurrency(orcamento.valor)}</Text>
                      </View>
                      <View style={styles.orcamentoPrazoRow}>
                        <Text style={styles.orcamentoPrazoLabel}>Prazo:</Text>
                        <Text style={styles.orcamentoPrazo}>{orcamento.prazoEstimado}</Text>
                      </View>
                      <Text style={styles.orcamentoMensagem}>{orcamento.mensagem}</Text>
                      {orcamento.status === 'ACEITO' && orcamento.profissionalCelular && (
                        <View style={styles.contatoActions}>
                          <TouchableOpacity
                            style={styles.ligarButton}
                            onPress={() => handleLigar(orcamento.profissionalCelular!)}
                          >
                            <Ionicons name="call" size={18} color="#fff" />
                            <Text style={styles.ligarButtonText}>Ligar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.whatsappButton}
                            onPress={() => handleWhatsApp(orcamento.profissionalCelular!, orcamento.profissionalNome)}
                          >
                            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                            <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {orcamento.status === 'PENDENTE' && solicitacao.status === 'ABERTA' && (
                        <View style={styles.orcamentoActions}>
                          <TouchableOpacity
                            style={styles.recusarButton}
                            onPress={() => handleRecusarOrcamento(orcamento)}
                            disabled={recusarMutation.isPending}
                          >
                            <Text style={styles.recusarButtonText}>Recusar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.aceitarButton}
                            onPress={() => handleAceitarOrcamento(orcamento)}
                            disabled={aceitarMutation.isPending}
                          >
                            <Text style={styles.aceitarButtonText}>Aceitar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {isProfissionalMode && solicitacao.fotos && solicitacao.fotos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fotos ({solicitacao.fotos.length})</Text>
            <Text style={styles.fotosInfo}>
              O cliente anexou {solicitacao.fotos.length} foto(s) a esta solicitacao
            </Text>
          </View>
        )}

        {isProfissionalMode ? (
          <View style={styles.profissionalActions}>
            <TouchableOpacity style={styles.enviarOrcamentoButton} onPress={handleEnviarOrcamento}>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.enviarOrcamentoText}>Enviar Orcamento</Text>
            </TouchableOpacity>
            <Text style={styles.orcamentoHint}>
              Envie uma proposta de valor para este servico
            </Text>
          </View>
        ) : (
          solicitacao.status === 'ABERTA' && (
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
          )
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
  profissionalActions: {
    alignItems: 'center',
  },
  enviarOrcamentoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  enviarOrcamentoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  orcamentoHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  fotosInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadingOrcamentos: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  orcamentosList: {
    gap: 12,
  },
  orcamentoItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orcamentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orcamentoProfissional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profissionalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profissionalAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  profissionalNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  orcamentoData: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  orcamentoStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  orcamentoStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orcamentoValorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orcamentoValorLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 6,
  },
  orcamentoValor: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  orcamentoPrazoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orcamentoPrazoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 6,
  },
  orcamentoPrazo: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  orcamentoMensagem: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  orcamentoActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  recusarButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  recusarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  aceitarButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  aceitarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  contatoActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  ligarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    gap: 6,
  },
  ligarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#25d366',
    gap: 6,
  },
  whatsappButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
