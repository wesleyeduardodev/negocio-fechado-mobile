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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuthStore } from '@/src/stores/authStore';
import { usuarioService } from '@/src/services/usuarioService';
import { localizacaoService, Cidade } from '@/src/services/localizacaoService';

const UFS = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapa' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceara' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espirito Santo' },
  { sigla: 'GO', nome: 'Goias' },
  { sigla: 'MA', nome: 'Maranhao' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Para' },
  { sigla: 'PB', nome: 'Paraiba' },
  { sigla: 'PR', nome: 'Parana' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piaui' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondonia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'Sao Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

export default function EditarPerfilScreen() {
  const { usuario, updateUsuario } = useAuthStore();

  const [nome, setNome] = useState('');
  const [uf, setUf] = useState('');
  const [cidadeIbgeId, setCidadeIbgeId] = useState(0);
  const [cidadeNome, setCidadeNome] = useState('');
  const [bairro, setBairro] = useState('');

  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [isLoadingCidades, setIsLoadingCidades] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showUfModal, setShowUfModal] = useState(false);
  const [showCidadeModal, setShowCidadeModal] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setUf(usuario.uf || '');
      setCidadeIbgeId(usuario.cidadeIbgeId || 0);
      setCidadeNome(usuario.cidadeNome || '');
      setBairro(usuario.bairro || '');
    }
  }, [usuario]);

  useEffect(() => {
    if (uf) {
      loadCidades(uf);
    }
  }, [uf]);

  const loadCidades = async (selectedUf: string) => {
    setIsLoadingCidades(true);
    try {
      const cidadesData = await localizacaoService.listarCidadesPorUf(selectedUf);
      setCidades(cidadesData);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar as cidades');
    } finally {
      setIsLoadingCidades(false);
    }
  };

  const handleSelectUf = (selectedUf: string) => {
    if (selectedUf !== uf) {
      setUf(selectedUf);
      setCidadeIbgeId(0);
      setCidadeNome('');
    }
    setShowUfModal(false);
  };

  const handleSelectCidade = (cidade: Cidade) => {
    setCidadeIbgeId(cidade.id);
    setCidadeNome(cidade.nome);
    setShowCidadeModal(false);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Informe seu nome');
      return;
    }
    if (!uf) {
      Alert.alert('Erro', 'Selecione o estado');
      return;
    }
    if (!cidadeIbgeId) {
      Alert.alert('Erro', 'Selecione a cidade');
      return;
    }
    if (!bairro.trim()) {
      Alert.alert('Erro', 'Informe o bairro');
      return;
    }

    setIsSaving(true);
    try {
      const response = await usuarioService.atualizar({
        nome: nome.trim(),
        uf,
        cidadeIbgeId,
        cidadeNome,
        bairro: bairro.trim(),
      });

      await updateUsuario({
        nome: response.nome,
        uf: response.uf,
        cidadeIbgeId: response.cidadeIbgeId,
        cidadeNome: response.cidadeNome,
        bairro: response.bairro,
        fotoUrl: response.fotoUrl,
      });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao atualizar perfil';
      Alert.alert('Erro', message);
    } finally {
      setIsSaving(false);
    }
  };

  const getUfNome = (sigla: string) => {
    const estado = UFS.find((u) => u.sigla === sigla);
    return estado ? `${estado.nome} (${estado.sigla})` : sigla;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estado</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowUfModal(true)}
            >
              <Text style={uf ? styles.selectText : styles.selectPlaceholder}>
                {uf ? getUfNome(uf) : 'Selecione o estado'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cidade</Text>
            <TouchableOpacity
              style={[styles.selectButton, !uf && styles.selectDisabled]}
              onPress={() => uf && setShowCidadeModal(true)}
              disabled={!uf}
            >
              {isLoadingCidades ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={styles.loadingText}>Carregando...</Text>
                </View>
              ) : (
                <>
                  <Text style={cidadeNome ? styles.selectText : styles.selectPlaceholder}>
                    {cidadeNome || 'Selecione a cidade'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bairro</Text>
            <TextInput
              style={styles.input}
              value={bairro}
              onChangeText={setBairro}
              placeholder="Seu bairro"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alteracoes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de UF */}
      <Modal visible={showUfModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Estado</Text>
              <TouchableOpacity onPress={() => setShowUfModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={UFS}
              keyExtractor={(item) => item.sigla}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    uf === item.sigla && styles.modalItemSelected,
                  ]}
                  onPress={() => handleSelectUf(item.sigla)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      uf === item.sigla && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.nome} ({item.sigla})
                  </Text>
                  {uf === item.sigla && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Cidade */}
      <Modal visible={showCidadeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Cidade</Text>
              <TouchableOpacity onPress={() => setShowCidadeModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cidades}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    cidadeIbgeId === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => handleSelectCidade(item)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      cidadeIbgeId === item.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.nome}
                  </Text>
                  {cidadeIbgeId === item.id && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhuma cidade encontrada</Text>
              }
            />
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
  selectDisabled: {
    backgroundColor: '#f3f4f6',
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveButtonText: {
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
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalItemTextSelected: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#6b7280',
  },
});
