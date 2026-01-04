import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
  Modal,
  Dimensions,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

import { solicitacaoService } from '@/src/services/solicitacaoService';
import { interesseService } from '@/src/services/interesseService';
import { StatusSolicitacao, SolicitacaoDetalhe, SolicitacaoParaProfissional, URGENCIA_LABELS, Urgencia } from '@/src/types/solicitacao';
import { Interesse, StatusInteresse } from '@/src/types/interesse';

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

export default function SolicitacaoDetalheScreen() {
  const { id, modo } = useLocalSearchParams<SearchParams>();
  const queryClient = useQueryClient();
  const isProfissionalMode = modo === 'profissional';
  const [interesseEnviado, setInteresseEnviado] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const photoListRef = useRef<FlatList>(null);

  // Query para modo cliente
  const {
    data: solicitacaoCliente,
    isLoading: isLoadingCliente,
    error: errorCliente,
    refetch: refetchCliente
  } = useQuery({
    queryKey: ['solicitacao', id],
    queryFn: () => solicitacaoService.buscarPorId(Number(id)),
    enabled: !!id && !isProfissionalMode,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // Query para modo profissional
  const {
    data: solicitacaoProfissional,
    isLoading: isLoadingProfissional,
    error: errorProfissional,
    refetch: refetchProfissional
  } = useQuery({
    queryKey: ['solicitacao-profissional', id],
    queryFn: () => solicitacaoService.buscarDisponivelPorId(Number(id)),
    enabled: !!id && isProfissionalMode,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // Query para listar interessados (modo cliente)
  const { data: interessados, isLoading: isLoadingInteressados, refetch: refetchInteressados } = useQuery({
    queryKey: ['interessados', id],
    queryFn: () => interesseService.listarPorSolicitacao(Number(id)),
    enabled: !!id && !isProfissionalMode,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useFocusEffect(
    useCallback(() => {
      if (isProfissionalMode) {
        refetchProfissional();
      } else {
        refetchCliente();
        refetchInteressados();
      }
    }, [refetchCliente, refetchProfissional, refetchInteressados, isProfissionalMode])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isProfissionalMode) {
        await refetchProfissional();
      } else {
        await Promise.all([refetchCliente(), refetchInteressados()]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [isProfissionalMode, refetchProfissional, refetchCliente, refetchInteressados]);

  const interesseMutation = useMutation({
    mutationFn: interesseService.criar,
    onSuccess: () => {
      setInteresseEnviado(true);
      queryClient.invalidateQueries({ queryKey: ['solicitacao-profissional', id] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao registrar interesse';
      Alert.alert('Erro', message);
    },
  });

  const contratarMutation = useMutation({
    mutationFn: interesseService.marcarComoContratado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacao', id] });
      queryClient.invalidateQueries({ queryKey: ['interessados', id] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-stats'] });
      Alert.alert('Sucesso', 'Profissional contratado! A solicitacao esta agora em andamento.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao contratar profissional';
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

  const concluirMutation = useMutation({
    mutationFn: () => solicitacaoService.concluir(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacao', id] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-stats'] });
      Alert.alert('Sucesso', 'Servico concluido! Agora voce pode avaliar o profissional.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao concluir';
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

  const handleConcluir = () => {
    Alert.alert(
      'Concluir Servico',
      'O servico foi realizado? Ao concluir, voce podera avaliar o profissional.',
      [
        { text: 'Nao', style: 'cancel' },
        { text: 'Sim, concluir', onPress: () => concluirMutation.mutate() },
      ]
    );
  };

  const handleAvaliar = () => {
    router.push(`/avaliar/${id}`);
  };

  const handleTenhoInteresse = () => {
    if (!solicitacaoProfissional) return;

    Alert.alert(
      'Demonstrar Interesse',
      `Deseja demonstrar interesse nesta solicitacao de ${solicitacaoProfissional.clienteNome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, tenho interesse',
          onPress: () => {
            interesseMutation.mutate({ solicitacaoId: Number(id) });
          }
        },
      ]
    );
  };

  const openWhatsAppProfissional = () => {
    if (!solicitacaoProfissional) return;

    const mensagem = `Ola ${solicitacaoProfissional.clienteNome}! Vi sua solicitacao "${solicitacaoProfissional.titulo}" no app Negocio Fechado e tenho interesse em fazer o servico. Podemos conversar sobre os detalhes?`;
    const whatsappUrl = `https://wa.me/55${solicitacaoProfissional.clienteCelular}?text=${encodeURIComponent(mensagem)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir o WhatsApp');
    });
  };

  const handleWhatsAppCliente = (interesse: Interesse) => {
    const solicitacao = solicitacaoCliente;
    if (!solicitacao) return;

    const mensagem = `Ola ${interesse.profissionalNome}! Vi que voce tem interesse na minha solicitacao "${solicitacao.titulo}" no app Negocio Fechado. Vamos conversar sobre o servico?`;
    const whatsappUrl = `https://wa.me/55${interesse.profissionalCelular}?text=${encodeURIComponent(mensagem)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir o WhatsApp');
    });
  };

  const handleContratar = (interesse: Interesse) => {
    Alert.alert(
      'Contratar Profissional',
      `Deseja marcar ${interesse.profissionalNome} como contratado para este servico?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Contratar', onPress: () => contratarMutation.mutate(interesse.id) },
      ]
    );
  };

  const handleLigar = (celular: string) => {
    const phoneUrl = `tel:+55${celular}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel abrir o discador');
    });
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

  const isLoading = isProfissionalMode ? isLoadingProfissional : isLoadingCliente;
  const error = isProfissionalMode ? errorProfissional : errorCliente;
  const solicitacao = isProfissionalMode ? solicitacaoProfissional : solicitacaoCliente;

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

  // Para modo cliente, precisamos do status
  const statusConfig = !isProfissionalMode && 'status' in solicitacao
    ? STATUS_CONFIG[solicitacao.status as StatusSolicitacao]
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isProfissionalMode ? 'Solicitacao Disponivel' : 'Detalhes'}
        </Text>
        {!isProfissionalMode && (solicitacaoCliente as SolicitacaoDetalhe)?.status === 'ABERTA' ? (
          <TouchableOpacity
            onPress={() => router.push(`/editar-solicitacao/${id}`)}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {statusConfig && (
          <View style={styles.statusCard}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            <Text style={styles.dateText}>Criada em {formatDate(solicitacao.criadoEm)}</Text>
          </View>
        )}

        {isProfissionalMode && (
          <View style={styles.clienteCard}>
            <View style={styles.clienteAvatar}>
              <Text style={styles.clienteAvatarText}>
                {(solicitacao as SolicitacaoParaProfissional).clienteNome.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.clienteNome}>{(solicitacao as SolicitacaoParaProfissional).clienteNome}</Text>
              <Text style={styles.clienteLabel}>Cliente</Text>
            </View>
          </View>
        )}

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
          {solicitacao.urgencia && (
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons
                name={solicitacao.urgencia === 'URGENTE' ? 'flash' : 'time-outline'}
                size={20}
                color={solicitacao.urgencia === 'URGENTE' ? '#ef4444' : '#6b7280'}
              />
              <Text style={[
                styles.infoText,
                solicitacao.urgencia === 'URGENTE' && { color: '#ef4444', fontWeight: '600' }
              ]}>
                {URGENCIA_LABELS[solicitacao.urgencia as Urgencia]}
              </Text>
            </View>
          )}
        </View>

        {/* Fotos da Solicitacao */}
        {solicitacao.fotos && solicitacao.fotos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fotos ({solicitacao.fotos.length})</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fotosContainer}
            >
              {solicitacao.fotos.map((foto, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedPhotoIndex(index)}
                  style={styles.fotoWrapper}
                >
                  <Image source={{ uri: foto, cache: 'reload' }} style={styles.fotoThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Modo Cliente - Lista de Interessados */}
        {!isProfissionalMode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Interessados {interessados && interessados.length > 0 ? `(${interessados.length})` : ''}
            </Text>
            {isLoadingInteressados ? (
              <View style={styles.loadingInteressados}>
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : !interessados || interessados.length === 0 ? (
              <View style={styles.emptyInteressados}>
                <Ionicons name="people-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyText}>Nenhum profissional interessado ainda</Text>
                <Text style={styles.emptySubtext}>
                  Profissionais da regiao poderao demonstrar interesse
                </Text>
              </View>
            ) : (
              <View style={styles.interessadosList}>
                {interessados.map((interesse) => (
                  <View key={interesse.id} style={styles.interessadoItem}>
                    <View style={styles.interessadoHeader}>
                      <TouchableOpacity
                        style={styles.interessadoProfissional}
                        onPress={() => router.push(`/profissional/${interesse.profissionalId}`)}
                      >
                        {interesse.profissionalFotoUrl ? (
                          <Image
                            source={{ uri: interesse.profissionalFotoUrl }}
                            style={styles.profissionalAvatarImage}
                          />
                        ) : (
                          <View style={styles.profissionalAvatar}>
                            <Text style={styles.profissionalAvatarText}>
                              {interesse.profissionalNome.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <View style={styles.profissionalNomeRow}>
                            <Text style={styles.profissionalNome}>{interesse.profissionalNome}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                          </View>
                          <View style={styles.profissionalIndicadores}>
                            {interesse.profissionalTotalAvaliacoes > 0 && (
                              <View style={styles.indicadorItem}>
                                <Ionicons name="star" size={12} color="#f59e0b" />
                                <Text style={styles.indicadorText}>
                                  {interesse.profissionalMediaAvaliacao.toFixed(1)} ({interesse.profissionalTotalAvaliacoes})
                                </Text>
                              </View>
                            )}
                            {interesse.profissionalQuantidadeFotos > 0 && (
                              <View style={styles.indicadorItem}>
                                <Ionicons name="camera" size={12} color="#6b7280" />
                                <Text style={styles.indicadorText}>
                                  {interesse.profissionalQuantidadeFotos} fotos
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.interesseData}>
                            Interesse em {formatDate(interesse.criadoEm)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {interesse.status === 'CONTRATADO' && (
                        <View style={styles.contratadoBadge}>
                          <Text style={styles.contratadoText}>Contratado</Text>
                        </View>
                      )}
                    </View>
                    {interesse.profissionalBio && (
                      <Text style={styles.profissionalBio} numberOfLines={2}>
                        {interesse.profissionalBio}
                      </Text>
                    )}
                    <View style={styles.contatoActions}>
                      <TouchableOpacity
                        style={styles.ligarButton}
                        onPress={() => handleLigar(interesse.profissionalCelular)}
                      >
                        <Ionicons name="call" size={18} color="#fff" />
                        <Text style={styles.ligarButtonText}>Ligar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={() => handleWhatsAppCliente(interesse)}
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                        <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                    {interesse.status !== 'CONTRATADO' && (solicitacaoCliente as SolicitacaoDetalhe)?.status === 'ABERTA' && (
                      <TouchableOpacity
                        style={styles.contratarButton}
                        onPress={() => handleContratar(interesse)}
                        disabled={contratarMutation.isPending}
                      >
                        {contratarMutation.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            <Text style={styles.contratarButtonText}>Contratar este profissional</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Modo Profissional - Botao Tenho Interesse */}
        {isProfissionalMode ? (
          <View style={styles.profissionalActions}>
            {interesseEnviado ? (
              <>
                <View style={styles.interesseEnviadoCard}>
                  <Ionicons name="checkmark-circle" size={32} color="#059669" />
                  <Text style={styles.interesseEnviadoText}>Interesse registrado!</Text>
                  <Text style={styles.interesseEnviadoSubtext}>
                    O cliente foi notificado. Continue a conversa pelo WhatsApp.
                  </Text>
                </View>
                <TouchableOpacity style={styles.whatsappButtonLarge} onPress={openWhatsAppProfissional}>
                  <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                  <Text style={styles.whatsappButtonLargeText}>Abrir WhatsApp</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.interesseButton}
                  onPress={handleTenhoInteresse}
                  disabled={interesseMutation.isPending}
                >
                  {interesseMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="hand-right" size={20} color="#fff" />
                      <Text style={styles.interesseButtonText}>Tenho Interesse</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={styles.interesseHint}>
                  Ao demonstrar interesse, o WhatsApp sera aberto para voce conversar diretamente com o cliente
                </Text>
              </>
            )}
          </View>
        ) : (
          <>
            {(solicitacaoCliente as SolicitacaoDetalhe)?.status === 'CONCLUIDA' && (
              <TouchableOpacity
                style={styles.avaliarButton}
                onPress={handleAvaliar}
              >
                <Ionicons name="star" size={20} color="#fff" />
                <Text style={styles.avaliarButtonText}>Avaliar Profissional</Text>
              </TouchableOpacity>
            )}
            {(solicitacaoCliente as SolicitacaoDetalhe)?.status === 'EM_ANDAMENTO' && (
              <TouchableOpacity
                style={styles.concluirButton}
                onPress={handleConcluir}
                disabled={concluirMutation.isPending}
              >
                {concluirMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.concluirButtonText}>Concluir Servico</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {(solicitacaoCliente as SolicitacaoDetalhe)?.status === 'ABERTA' && (
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
          </>
        )}
      </ScrollView>

      {/* Modal para visualizar foto em tela cheia */}
      <Modal
        visible={selectedPhotoIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhotoIndex(null)}
        statusBarTranslucent
      >
        <View style={styles.photoModal}>
          {/* Header com botão fechar */}
          <View style={styles.photoModalHeader}>
            <TouchableOpacity
              style={styles.photoModalButton}
              onPress={() => setSelectedPhotoIndex(null)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 44 }} />
          </View>

          {selectedPhotoIndex !== null && solicitacao?.fotos && (
            <>
              <FlatList
                ref={photoListRef}
                data={solicitacao.fotos}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={selectedPhotoIndex}
                getItemLayout={(_, index) => ({
                  length: SCREEN_WIDTH,
                  offset: SCREEN_WIDTH * index,
                  index,
                })}
                onMomentumScrollEnd={(e) => {
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setSelectedPhotoIndex(newIndex);
                }}
                renderItem={({ item: foto }) => (
                  <View style={styles.photoSlide}>
                    <ScrollView
                      contentContainerStyle={styles.zoomContainer}
                      maximumZoomScale={4}
                      minimumZoomScale={1}
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                      centerContent
                      bouncesZoom
                    >
                      <Image
                        source={{ uri: foto, cache: 'reload' }}
                        style={styles.photoModalImage}
                        resizeMode="contain"
                      />
                    </ScrollView>
                  </View>
                )}
                keyExtractor={(_, index) => index.toString()}
              />

              {/* Indicador de posição */}
              <View style={styles.photoIndicator}>
                <Text style={styles.photoIndicatorText}>
                  {selectedPhotoIndex + 1} / {solicitacao.fotos.length}
                </Text>
              </View>
            </>
          )}
        </View>
      </Modal>
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
  clienteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  clienteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clienteAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  clienteLabel: {
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
  emptyInteressados: {
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
  loadingInteressados: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  interessadosList: {
    gap: 12,
  },
  interessadoItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  interessadoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  interessadoProfissional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
  profissionalAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profissionalNomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profissionalNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  profissionalIndicadores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  indicadorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  indicadorText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  interesseData: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  contratadoBadge: {
    backgroundColor: '#d1fae5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  contratadoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  profissionalBio: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  contatoActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
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
  contratarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#059669',
    gap: 6,
  },
  contratarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  avaliarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  avaliarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  concluirButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  concluirButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  interesseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25d366',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  interesseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  interesseHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  interesseEnviadoCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  interesseEnviadoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginTop: 8,
  },
  interesseEnviadoSubtext: {
    fontSize: 13,
    color: '#047857',
    textAlign: 'center',
    marginTop: 4,
  },
  whatsappButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25d366',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  whatsappButtonLargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotosContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  fotoWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  fotoThumb: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  photoModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  photoModalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  photoModalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  photoIndicator: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  photoIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
