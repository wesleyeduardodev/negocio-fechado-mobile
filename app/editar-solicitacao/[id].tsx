import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { solicitacaoService } from '@/src/services/solicitacaoService';
import { arquivoService } from '@/src/services/arquivoService';
import { Urgencia, URGENCIA_LABELS, AtualizarSolicitacaoRequest } from '@/src/types/solicitacao';
import { FotosPicker } from '@/src/components/FotosPicker';

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

export default function EditarSolicitacaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [urgencia, setUrgencia] = useState<Urgencia | null>(null);
  const [showUrgenciaModal, setShowUrgenciaModal] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [uploadingFotos, setUploadingFotos] = useState(false);

  const urgenciaOptions: Urgencia[] = ['URGENTE', 'ESTA_SEMANA', 'PROXIMAS_SEMANAS', 'APENAS_ORCANDO'];

  const { data: solicitacao, isLoading: isLoadingSolicitacao } = useQuery({
    queryKey: ['solicitacao', id],
    queryFn: () => solicitacaoService.buscarPorId(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (solicitacao && !isInitialized) {
      setTitulo(solicitacao.titulo);
      setDescricao(solicitacao.descricao);
      setUrgencia(solicitacao.urgencia);
      setFotos(solicitacao.fotos || []);
      setIsInitialized(true);
    }
  }, [solicitacao, isInitialized]);

  const atualizarMutation = useMutation({
    mutationFn: (data: AtualizarSolicitacaoRequest) => solicitacaoService.atualizar(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacao', id] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      Alert.alert('Sucesso', 'Solicitacao atualizada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao atualizar solicitacao';
      Alert.alert('Erro', message);
    },
  });

  const handleSubmit = async () => {
    if (!titulo.trim() || titulo.trim().length < 5) {
      Alert.alert('Erro', 'Titulo deve ter no minimo 5 caracteres');
      return;
    }
    if (!descricao.trim() || descricao.trim().length < 20) {
      Alert.alert('Erro', 'Descricao deve ter no minimo 20 caracteres');
      return;
    }
    if (!urgencia) {
      Alert.alert('Erro', 'Selecione quando precisa do servico');
      return;
    }

    try {
      setUploadingFotos(true);

      // Separar fotos existentes (https://) e novas (file://)
      const fotosExistentes = fotos.filter(f => f.startsWith('http'));
      const fotosNovas = fotos.filter(f => !f.startsWith('http'));

      // PASSO 1: Primeiro atualizar com as fotos existentes (isso deleta as removidas do servidor)
      await solicitacaoService.atualizar(Number(id), {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        urgencia,
        fotos: fotosExistentes,
      });

      // PASSO 2: Depois fazer upload das novas fotos (agora tem espaço)
      if (fotosNovas.length > 0) {
        await arquivoService.uploadFotosSolicitacao(Number(id), fotosNovas);
      }

      // Invalidar queries e mostrar sucesso
      queryClient.invalidateQueries({ queryKey: ['solicitacao', id] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      Alert.alert('Sucesso', 'Solicitacao atualizada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      const message = error?.response?.data?.message || 'Falha ao atualizar solicitacao';
      Alert.alert('Erro', message);
    } finally {
      setUploadingFotos(false);
    }
  };

  const getIconName = (icone: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[icone] || 'ellipse';
  };

  if (isLoadingSolicitacao) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Solicitacao</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!solicitacao) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Solicitacao</Text>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Solicitacao</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.categoriaInfo}>
            <View style={styles.categoriaIcon}>
              <Ionicons
                name={getIconName(solicitacao.categoriaIcone)}
                size={24}
                color="#3b82f6"
              />
            </View>
            <View>
              <Text style={styles.categoriaLabel}>Categoria</Text>
              <Text style={styles.categoriaNome}>{solicitacao.categoriaNome}</Text>
            </View>
          </View>

          <View style={styles.locationInfo}>
            <Ionicons name="location" size={18} color="#3b82f6" />
            <Text style={styles.locationText}>
              {solicitacao.bairro}, {solicitacao.cidadeNome} - {solicitacao.uf}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titulo *</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ex: Consertar vazamento na cozinha"
              placeholderTextColor="#9ca3af"
              maxLength={100}
            />
            <Text style={styles.charCount}>{titulo.length}/100</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descricao *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva o problema ou servico que precisa..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{descricao.length}/2000</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quando precisa? *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowUrgenciaModal(true)}
            >
              <Text style={urgencia ? styles.selectText : styles.selectPlaceholder}>
                {urgencia ? URGENCIA_LABELS[urgencia] : 'Selecione o prazo'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <FotosPicker
            fotos={fotos}
            onFotosChange={setFotos}
            maxFotos={5}
            disabled={atualizarMutation.isPending || uploadingFotos}
          />

          <TouchableOpacity
            style={[styles.submitButton, (atualizarMutation.isPending || uploadingFotos) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={atualizarMutation.isPending || uploadingFotos}
          >
            {atualizarMutation.isPending || uploadingFotos ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.submitButtonText}>
                  {uploadingFotos ? 'Enviando fotos...' : 'Salvando...'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Salvar Alteracoes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showUrgenciaModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quando precisa?</Text>
              <TouchableOpacity onPress={() => setShowUrgenciaModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {urgenciaOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.modalItem,
                    urgencia === option && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setUrgencia(option);
                    setShowUrgenciaModal(false);
                  }}
                >
                  <View style={styles.urgenciaRow}>
                    <Ionicons
                      name={option === 'URGENTE' ? 'flash' : 'time-outline'}
                      size={20}
                      color={option === 'URGENTE' ? '#ef4444' : '#3b82f6'}
                    />
                    <Text
                      style={[
                        styles.modalItemText,
                        urgencia === option && styles.modalItemTextSelected,
                      ]}
                    >
                      {URGENCIA_LABELS[option]}
                    </Text>
                  </View>
                  {urgencia === option && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  categoriaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  categoriaIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriaLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoriaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemSelected: {
    backgroundColor: '#eff6ff',
  },
  urgenciaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalItemTextSelected: {
    color: '#3b82f6',
    fontWeight: '500',
  },
});
