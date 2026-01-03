import { useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { solicitacaoService } from '@/src/services/solicitacaoService';
import { orcamentoService } from '@/src/services/orcamentoService';

type SearchParams = {
  solicitacaoId: string;
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

export default function EnviarOrcamentoScreen() {
  const { solicitacaoId } = useLocalSearchParams<SearchParams>();
  const queryClient = useQueryClient();

  const [valor, setValor] = useState('');
  const [prazoEstimado, setPrazoEstimado] = useState('');
  const [mensagem, setMensagem] = useState('');

  const { data: solicitacao, isLoading: isLoadingSolicitacao } = useQuery({
    queryKey: ['solicitacao', solicitacaoId, true],
    queryFn: () => solicitacaoService.buscarDisponivelPorId(Number(solicitacaoId)),
    enabled: !!solicitacaoId,
  });

  const enviarMutation = useMutation({
    mutationFn: () => orcamentoService.enviar(Number(solicitacaoId), {
      valor: parseFloat(valor.replace(',', '.')),
      prazoEstimado: prazoEstimado.trim(),
      mensagem: mensagem.trim(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-disponiveis'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos-enviados'] });
      Alert.alert('Sucesso', 'Orcamento enviado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao enviar orcamento';
      Alert.alert('Erro', message);
    },
  });

  const handleSubmit = () => {
    const valorNumerico = parseFloat(valor.replace(',', '.'));

    if (!valor || isNaN(valorNumerico) || valorNumerico < 1) {
      Alert.alert('Erro', 'Informe um valor valido (minimo R$ 1,00)');
      return;
    }
    if (!prazoEstimado.trim()) {
      Alert.alert('Erro', 'Informe o prazo estimado');
      return;
    }
    if (!mensagem.trim() || mensagem.trim().length < 10) {
      Alert.alert('Erro', 'Mensagem deve ter no minimo 10 caracteres');
      return;
    }

    enviarMutation.mutate();
  };

  const getIconName = (icone: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[icone] || 'ellipse';
  };

  const formatCurrency = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (!numbers) {
      setValor('');
      return;
    }
    const value = parseInt(numbers, 10) / 100;
    setValor(value.toFixed(2).replace('.', ','));
  };

  if (isLoadingSolicitacao) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
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
          <Text style={styles.headerTitle}>Enviar Orcamento</Text>
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
        <Text style={styles.headerTitle}>Enviar Orcamento</Text>
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
          <View style={styles.solicitacaoCard}>
            <View style={styles.categoriaHeader}>
              <View style={styles.categoriaIcon}>
                <Ionicons
                  name={getIconName(solicitacao.categoriaIcone)}
                  size={20}
                  color="#10b981"
                />
              </View>
              <Text style={styles.categoriaNome}>{solicitacao.categoriaNome}</Text>
            </View>
            <Text style={styles.titulo}>{solicitacao.titulo}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.locationText}>
                {solicitacao.bairro}, {solicitacao.cidadeNome}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor do servico *</Text>
            <View style={styles.valorContainer}>
              <Text style={styles.valorPrefix}>R$</Text>
              <TextInput
                style={styles.valorInput}
                value={valor}
                onChangeText={formatCurrency}
                placeholder="0,00"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.hint}>Valor minimo: R$ 1,00</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prazo estimado *</Text>
            <TextInput
              style={styles.input}
              value={prazoEstimado}
              onChangeText={setPrazoEstimado}
              placeholder="Ex: 2 dias, 1 semana, Imediato"
              placeholderTextColor="#9ca3af"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mensagem ao cliente *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={mensagem}
              onChangeText={setMensagem}
              placeholder="Descreva o que esta incluso no servico, sua experiencia, diferenciais..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{mensagem.length}/1000</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, enviarMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={enviarMutation.isPending}
          >
            {enviarMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Enviar Orcamento</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Ao enviar o orcamento, voce se compromete a realizar o servico pelo valor e prazo informados.
          </Text>
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
    backgroundColor: '#10b981',
    borderRadius: 10,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  solicitacaoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  categoriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  categoriaIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriaNome: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6b7280',
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
  valorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  valorPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginRight: 8,
  },
  valorInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
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
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#6ee7b7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});
