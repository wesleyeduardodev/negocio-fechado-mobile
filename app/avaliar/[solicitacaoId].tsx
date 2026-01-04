import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { avaliacaoService } from '@/src/services/avaliacaoService';
import { arquivoService } from '@/src/services/arquivoService';

export default function AvaliarScreen() {
  const { solicitacaoId } = useLocalSearchParams<{ solicitacaoId: string }>();
  const queryClient = useQueryClient();

  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const MAX_FOTOS = 5;

  const avaliarMutation = useMutation({
    mutationFn: async () => {
      const avaliacao = await avaliacaoService.criar(Number(solicitacaoId), { nota, comentario });

      if (fotos.length > 0) {
        setUploading(true);
        try {
          await arquivoService.uploadFotosAvaliacao(avaliacao.id, fotos);
        } finally {
          setUploading(false);
        }
      }

      return avaliacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacao', solicitacaoId] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      Alert.alert('Sucesso', 'Avaliacao enviada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao enviar avaliacao';
      Alert.alert('Erro', message);
    },
  });

  const handleSelecionarFotos = async () => {
    try {
      const maxRestantes = MAX_FOTOS - fotos.length;
      if (maxRestantes <= 0) {
        Alert.alert('Limite atingido', `Maximo de ${MAX_FOTOS} fotos permitidas`);
        return;
      }

      const uris = await arquivoService.selecionarFotos(maxRestantes);
      if (uris.length > 0) {
        setFotos((prev) => [...prev, ...uris]);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao selecionar fotos');
    }
  };

  const handleRemoverFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (nota === 0) {
      Alert.alert('Erro', 'Selecione uma nota de 1 a 5 estrelas');
      return;
    }
    avaliarMutation.mutate();
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setNota(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= nota ? 'star' : 'star-outline'}
              size={40}
              color={star <= nota ? '#f59e0b' : '#d1d5db'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getNotaLabel = () => {
    switch (nota) {
      case 1: return 'Muito ruim';
      case 2: return 'Ruim';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return 'Toque nas estrelas para avaliar';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avaliar Servico</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Como foi o servico?</Text>
            <Text style={styles.subtitle}>
              Sua avaliacao ajuda outros clientes e o profissional a melhorar
            </Text>

            {renderStars()}
            <Text style={styles.notaLabel}>{getNotaLabel()}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Conte sua experiencia (opcional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Descreva como foi o servico, pontualidade, qualidade do trabalho..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={comentario}
              onChangeText={setComentario}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Fotos (opcional)</Text>
            <Text style={styles.fotosHint}>
              Adicione fotos do servico realizado (max {MAX_FOTOS})
            </Text>

            {fotos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fotosContainer}
              >
                {fotos.map((uri, index) => (
                  <View key={index} style={styles.fotoWrapper}>
                    <Image source={{ uri }} style={styles.fotoThumb} />
                    <TouchableOpacity
                      style={styles.fotoRemoveButton}
                      onPress={() => handleRemoverFoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {fotos.length < MAX_FOTOS && (
              <TouchableOpacity
                style={styles.addFotoButton}
                onPress={handleSelecionarFotos}
              >
                <Ionicons name="camera-outline" size={24} color="#3b82f6" />
                <Text style={styles.addFotoText}>
                  {fotos.length === 0 ? 'Adicionar fotos' : 'Adicionar mais fotos'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              nota === 0 && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={avaliarMutation.isPending || nota === 0}
          >
            {avaliarMutation.isPending ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.submitButtonText}>
                  {uploading ? 'Enviando fotos...' : 'Enviando...'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Enviar Avaliacao</Text>
              </>
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
  keyboardView: {
    flex: 1,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  notaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 120,
    backgroundColor: '#f9fafb',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fotosHint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  fotosContainer: {
    gap: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  fotoWrapper: {
    position: 'relative',
  },
  fotoThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  fotoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addFotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 8,
  },
  addFotoText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3b82f6',
  },
});
