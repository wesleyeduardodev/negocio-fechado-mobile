import { useState, useEffect, useCallback } from 'react';
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
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

import { categoriaService } from '@/src/services/categoriaService';
import { profissionalService } from '@/src/services/profissionalService';
import { arquivoService } from '@/src/services/arquivoService';
import { Categoria } from '@/src/types/categoria';
import { Arquivo } from '@/src/types/arquivo';

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

const ICON_COLORS: Record<string, { bg: string; icon: string }> = {
  'flash': { bg: '#fef3c7', icon: '#f59e0b' },
  'water': { bg: '#dbeafe', icon: '#3b82f6' },
  'color-palette': { bg: '#fce7f3', icon: '#ec4899' },
  'construct': { bg: '#fed7aa', icon: '#ea580c' },
  'hammer': { bg: '#e0e7ff', icon: '#6366f1' },
  'leaf': { bg: '#d1fae5', icon: '#10b981' },
  'sparkles': { bg: '#cffafe', icon: '#06b6d4' },
  'snow': { bg: '#dbeafe', icon: '#0ea5e9' },
  'settings': { bg: '#f3e8ff', icon: '#a855f7' },
  'key': { bg: '#fef3c7', icon: '#eab308' },
  'layers': { bg: '#e0e7ff', icon: '#4f46e5' },
  'cut': { bg: '#fee2e2', icon: '#ef4444' },
};

const MAX_PORTFOLIO_FOTOS = 10;

export default function MeuPerfilProfissionalScreen() {
  const queryClient = useQueryClient();
  const [selectedCategorias, setSelectedCategorias] = useState<Set<number>>(new Set());
  const [bio, setBio] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [uploadingFotos, setUploadingFotos] = useState(false);

  const { data: meuPerfil, isLoading: isLoadingPerfil, refetch: refetchPerfil } = useQuery({
    queryKey: ['meu-perfil-profissional'],
    queryFn: profissionalService.buscarMeuPerfil,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: categorias, isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriaService.listar,
    staleTime: 1000 * 60 * 5,
  });

  const { data: portfolioFotos, refetch: refetchPortfolio } = useQuery({
    queryKey: ['portfolio-fotos'],
    queryFn: arquivoService.listarFotosMeuPerfil,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useFocusEffect(
    useCallback(() => {
      refetchPerfil();
    }, [refetchPerfil])
  );

  useEffect(() => {
    if (meuPerfil) {
      setBio(meuPerfil.bio);
      setAtivo(meuPerfil.ativo);
      setSelectedCategorias(new Set(meuPerfil.categorias.map(c => c.id)));
    }
  }, [meuPerfil]);

  const atualizarMutation = useMutation({
    mutationFn: profissionalService.atualizar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meu-perfil-profissional'] });
      queryClient.invalidateQueries({ queryKey: ['profissional-status'] });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao atualizar perfil';
      Alert.alert('Erro', message);
    },
  });

  const toggleCategoria = (categoriaId: number) => {
    setSelectedCategorias((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoriaId)) {
        newSet.delete(categoriaId);
      } else {
        newSet.add(categoriaId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    if (selectedCategorias.size === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma categoria');
      return;
    }
    if (!bio.trim() || bio.trim().length < 20) {
      Alert.alert('Erro', 'A bio deve ter no minimo 20 caracteres');
      return;
    }

    atualizarMutation.mutate({
      bio: bio.trim(),
      categoriasIds: Array.from(selectedCategorias),
      ativo,
    });
  };

  const getIconName = (icone: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[icone] || 'ellipse';
  };

  const getIconColors = (icone: string) => {
    return ICON_COLORS[icone] || { bg: '#f3f4f6', icon: '#6b7280' };
  };

  const handleAdicionarFotos = async () => {
    try {
      const fotosAtuais = portfolioFotos?.length || 0;
      const maxRestantes = MAX_PORTFOLIO_FOTOS - fotosAtuais;

      if (maxRestantes <= 0) {
        Alert.alert('Limite atingido', `Maximo de ${MAX_PORTFOLIO_FOTOS} fotos no portfolio`);
        return;
      }

      const uris = await arquivoService.selecionarFotos(maxRestantes);
      if (uris.length === 0) return;

      setUploadingFotos(true);
      await arquivoService.uploadFotosPerfil(uris);
      await refetchPortfolio();
      Alert.alert('Sucesso', 'Fotos adicionadas ao portfolio!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao adicionar fotos');
    } finally {
      setUploadingFotos(false);
    }
  };

  const handleRemoverFoto = (foto: Arquivo) => {
    Alert.alert(
      'Remover foto',
      'Deseja remover esta foto do seu portfolio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await arquivoService.deletarFotoPerfil(foto.id);
              await refetchPortfolio();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao remover foto');
            }
          },
        },
      ]
    );
  };

  const renderCategoria = (categoria: Categoria) => {
    const isSelected = selectedCategorias.has(categoria.id);
    const colors = getIconColors(categoria.icone);

    return (
      <TouchableOpacity
        key={categoria.id}
        style={[styles.categoriaItem, isSelected && styles.categoriaItemSelected]}
        onPress={() => toggleCategoria(categoria.id)}
      >
        <View style={[styles.categoriaIcon, { backgroundColor: colors.bg }]}>
          <Ionicons name={getIconName(categoria.icone)} size={24} color={colors.icon} />
        </View>
        <Text style={[styles.categoriaText, isSelected && styles.categoriaTextSelected]}>
          {categoria.nome}
        </Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoadingPerfil) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil Profissional</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
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
        <Text style={styles.headerTitle}>Meu Perfil Profissional</Text>
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
          <View style={styles.statusCard}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Status do perfil</Text>
              <Text style={[styles.statusText, ativo ? styles.statusAtivo : styles.statusInativo]}>
                {ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
            <Switch
              value={ativo}
              onValueChange={setAtivo}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={ativo ? '#22c55e' : '#9ca3af'}
            />
          </View>

          {!ativo && (
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <Text style={styles.warningText}>
                Seu perfil esta inativo. Voce nao aparecera para clientes nem recebera novas solicitacoes.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suas especialidades *</Text>
            <Text style={styles.sectionSubtitle}>Escolha as categorias em que voce trabalha</Text>

            {isLoadingCategorias ? (
              <View style={styles.loadingContainerSmall}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : (
              <View style={styles.categoriasList}>
                {categorias?.map(renderCategoria)}
              </View>
            )}

            <Text style={styles.selectedCount}>
              {selectedCategorias.size} categoria(s) selecionada(s)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre voce *</Text>
            <Text style={styles.sectionSubtitle}>
              Conte sobre sua experiencia e o que voce oferece
            </Text>

            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Descreva sua experiencia..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length}/500 (minimo 20)</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio de trabalhos</Text>
            <Text style={styles.sectionSubtitle}>
              Mostre fotos dos seus trabalhos anteriores (max {MAX_PORTFOLIO_FOTOS})
            </Text>

            {portfolioFotos && portfolioFotos.length > 0 && (
              <View style={styles.portfolioGrid}>
                {portfolioFotos.map((foto) => (
                  <View key={foto.id} style={styles.portfolioItem}>
                    <Image source={{ uri: foto.url }} style={styles.portfolioImage} />
                    <TouchableOpacity
                      style={styles.portfolioRemoveButton}
                      onPress={() => handleRemoverFoto(foto)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {(!portfolioFotos || portfolioFotos.length < MAX_PORTFOLIO_FOTOS) && (
              <TouchableOpacity
                style={styles.addFotoButton}
                onPress={handleAdicionarFotos}
                disabled={uploadingFotos}
              >
                {uploadingFotos ? (
                  <ActivityIndicator color="#3b82f6" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color="#3b82f6" />
                    <Text style={styles.addFotoText}>
                      {portfolioFotos?.length ? 'Adicionar mais fotos' : 'Adicionar fotos'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.portfolioCount}>
              {portfolioFotos?.length || 0}/{MAX_PORTFOLIO_FOTOS} fotos
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, atualizarMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={atualizarMutation.isPending}
          >
            {atualizarMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Salvar alteracoes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => meuPerfil && router.push(`/profissional/${meuPerfil.id}`)}
          >
            <Ionicons name="eye-outline" size={20} color="#3b82f6" />
            <Text style={styles.viewProfileButtonText}>Ver meu perfil publico</Text>
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusAtivo: {
    color: '#22c55e',
  },
  statusInativo: {
    color: '#ef4444',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  loadingContainerSmall: {
    padding: 40,
    alignItems: 'center',
  },
  categoriasList: {
    gap: 10,
  },
  categoriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  categoriaItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  categoriaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoriaText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  categoriaTextSelected: {
    color: '#1d4ed8',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  selectedCount: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  bioInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    height: 150,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  viewProfileButtonText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '500',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  portfolioItem: {
    position: 'relative',
  },
  portfolioImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  portfolioRemoveButton: {
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
    paddingVertical: 20,
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
  portfolioCount: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
});
