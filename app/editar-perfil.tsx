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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { useAuthStore } from '@/src/stores/authStore';
import { usuarioService } from '@/src/services/usuarioService';
import { localizacaoService, Cidade } from '@/src/services/localizacaoService';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];

export default function EditarPerfilScreen() {
  const { usuario, updateUsuario } = useAuthStore();

  const [nome, setNome] = useState(usuario?.nome || '');
  const [uf, setUf] = useState(usuario?.uf || '');
  const [cidadeIbgeId, setCidadeIbgeId] = useState(usuario?.cidadeIbgeId || 0);
  const [cidadeNome, setCidadeNome] = useState(usuario?.cidadeNome || '');
  const [bairro, setBairro] = useState(usuario?.bairro || '');

  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [isLoadingCidades, setIsLoadingCidades] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCidadeChange = (itemValue: number) => {
    setCidadeIbgeId(itemValue);
    const cidadeSelecionada = cidades.find((c) => c.id === itemValue);
    if (cidadeSelecionada) {
      setCidadeNome(cidadeSelecionada.nome);
    }
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
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={uf}
                onValueChange={(itemValue) => {
                  setUf(itemValue);
                  setCidadeIbgeId(0);
                  setCidadeNome('');
                }}
                style={styles.picker}
              >
                <Picker.Item label="Selecione o estado" value="" />
                {UFS.map((estado) => (
                  <Picker.Item key={estado} label={estado} value={estado} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cidade</Text>
            {isLoadingCidades ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={styles.loadingText}>Carregando cidades...</Text>
              </View>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={cidadeIbgeId}
                  onValueChange={handleCidadeChange}
                  style={styles.picker}
                  enabled={cidades.length > 0}
                >
                  <Picker.Item label="Selecione a cidade" value={0} />
                  {cidades.map((cidade) => (
                    <Picker.Item key={cidade.id} label={cidade.nome} value={cidade.id} />
                  ))}
                </Picker>
              </View>
            )}
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
});
