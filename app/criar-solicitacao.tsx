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

import { useAuthStore } from '@/src/stores/authStore';
import { categoriaService } from '@/src/services/categoriaService';
import { solicitacaoService } from '@/src/services/solicitacaoService';
import { arquivoService } from '@/src/services/arquivoService';
import { Categoria } from '@/src/types/categoria';
import { Urgencia, URGENCIA_LABELS } from '@/src/types/solicitacao';
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

export default function CriarSolicitacaoScreen() {
  const { usuario } = useAuthStore();
  const params = useLocalSearchParams<{ categoriaId?: string }>();
  const queryClient = useQueryClient();

  const initialCategoriaId = params.categoriaId ? Number(params.categoriaId) : null;
  const [categoriaId, setCategoriaId] = useState<number | null>(initialCategoriaId);
  const [categoriaNome, setCategoriaNome] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [urgencia, setUrgencia] = useState<Urgencia | null>(null);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showUrgenciaModal, setShowUrgenciaModal] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploadingFotos, setUploadingFotos] = useState(false);

  const urgenciaOptions: Urgencia[] = ['URGENTE', 'ESTA_SEMANA', 'PROXIMAS_SEMANAS', 'APENAS_ORCANDO'];

  const { data: categorias, isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriaService.listar,
    staleTime: 1000 * 60 * 5,
  });

  // Pre-select category name when categorias are loaded and we have an initial categoriaId
  useEffect(() => {
    if (categorias && initialCategoriaId && !categoriaNome) {
      const categoria = categorias.find(c => c.id === initialCategoriaId);
      if (categoria) {
        setCategoriaNome(categoria.nome);
      }
    }
  }, [categorias, initialCategoriaId, categoriaNome]);

  const criarMutation = useMutation({
    mutationFn: solicitacaoService.criar,
    onSuccess: async (data) => {
      if (fotos.length > 0) {
        try {
          setUploadingFotos(true);
          await arquivoService.uploadFotosSolicitacao(data.id, fotos);
        } catch (error) {
          console.error('Erro ao fazer upload das fotos:', error);
        } finally {
          setUploadingFotos(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-stats'] });
      Alert.alert('Sucesso', 'Solicitacao criada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao criar solicitacao';
      Alert.alert('Erro', message);
    },
  });

  const handleSelectCategoria = (categoria: Categoria) => {
    setCategoriaId(categoria.id);
    setCategoriaNome(categoria.nome);
    setShowCategoriaModal(false);
  };

  const handleSubmit = () => {
    if (!categoriaId) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }
    if (!titulo.trim() || titulo.trim().length < 5) {
      Alert.alert('Erro', 'Titulo deve ter no minimo 5 caracteres');
      return;
    }
    if (!descricao.trim() || descricao.trim().length < 10) {
      Alert.alert('Erro', 'Descricao deve ter no minimo 10 caracteres');
      return;
    }
    if (!urgencia) {
      Alert.alert('Erro', 'Selecione quando precisa do servico');
      return;
    }

    criarMutation.mutate({
      categoriaId,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      urgencia,
    });
  };

  const getIconName = (icone: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[icone] || 'ellipse';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Solicitacao</Text>
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
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={18} color="#3b82f6" />
            <Text style={styles.locationText}>
              {usuario?.bairro}, {usuario?.cidadeNome} - {usuario?.uf}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCategoriaModal(true)}
            >
              <Text style={categoriaId ? styles.selectText : styles.selectPlaceholder}>
                {categoriaNome || 'Selecione a categoria do servico'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
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
              maxLength={1000}
            />
            <Text style={styles.charCount}>{descricao.length}/1000</Text>
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
            disabled={criarMutation.isPending || uploadingFotos}
          />

          <View style={styles.fotosHint}>
            <Ionicons name="information-circle-outline" size={14} color="#6b7280" />
            <Text style={styles.fotosHintText}>
              Precisa enviar mais fotos ou videos? Voce podera usar o WhatsApp do profissional
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (criarMutation.isPending || uploadingFotos) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={criarMutation.isPending || uploadingFotos}
          >
            {criarMutation.isPending || uploadingFotos ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.submitButtonText}>
                  {uploadingFotos ? 'Enviando fotos...' : 'Criando...'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Criar Solicitacao</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCategoriaModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoriaModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {isLoadingCategorias ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Carregando categorias...</Text>
              </View>
            ) : categorias && categorias.length > 0 ? (
              <ScrollView>
                {categorias.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modalItem,
                      categoriaId === item.id && styles.modalItemSelected,
                    ]}
                    onPress={() => handleSelectCategoria(item)}
                  >
                    <View style={styles.categoriaRow}>
                      <View style={styles.categoriaIconSmall}>
                        <Ionicons name={getIconName(item.icone)} size={20} color="#3b82f6" />
                      </View>
                      <Text
                        style={[
                          styles.modalItemText,
                          categoriaId === item.id && styles.modalItemTextSelected,
                        ]}
                      >
                        {item.nome}
                      </Text>
                    </View>
                    {categoriaId === item.id && (
                      <Ionicons name="checkmark" size={20} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>Nenhuma categoria disponivel</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
  categoriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  urgenciaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoriaIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalItemTextSelected: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  fotosHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  fotosHintText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 16,
  },
});
