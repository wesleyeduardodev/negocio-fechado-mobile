import { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

import { profissionalService } from '@/src/services/profissionalService';
import { avaliacaoService } from '@/src/services/avaliacaoService';
import { AvaliacaoResponse } from '@/src/types/avaliacao';

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

export default function PerfilProfissionalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const perfilId = Number(id);

  const { data: perfil, isLoading, isError, refetch } = useQuery({
    queryKey: ['profissional', perfilId],
    queryFn: () => profissionalService.buscarPorId(perfilId),
    enabled: !!perfilId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: avaliacoesData, refetch: refetchAvaliacoes } = useQuery({
    queryKey: ['avaliacoes-profissional', perfilId],
    queryFn: () => avaliacaoService.listarPorProfissional(perfilId, 0, 5),
    enabled: !!perfilId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const avaliacoes = avaliacoesData?.content ?? [];

  useFocusEffect(
    useCallback(() => {
      if (perfilId) {
        refetch();
        refetchAvaliacoes();
      }
    }, [refetch, refetchAvaliacoes, perfilId])
  );

  const getIconName = (icone: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[icone] || 'ellipse';
  };

  const getIconColors = (icone: string) => {
    return ICON_COLORS[icone] || { bg: '#f3f4f6', icon: '#6b7280' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atras`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana(s) atras`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mes(es) atras`;
    return `${Math.floor(diffDays / 365)} ano(s) atras`;
  };

  const renderStars = (nota: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= nota ? 'star' : 'star-outline'}
            size={14}
            color={star <= nota ? '#f59e0b' : '#d1d5db'}
          />
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !perfil) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#d1d5db" />
          <Text style={styles.errorText}>Profissional nao encontrado</Text>
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
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          {perfil.fotoUrl ? (
            <Image source={{ uri: perfil.fotoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#9ca3af" />
            </View>
          )}

          <Text style={styles.nome}>{perfil.nome}</Text>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#f59e0b" />
            <Text style={styles.ratingText}>
              {perfil.mediaAvaliacoes.toFixed(1)} ({perfil.totalAvaliacoes} avaliacoes)
            </Text>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#6b7280" />
            <Text style={styles.locationText}>
              {perfil.bairro}, {perfil.cidadeNome} - {perfil.uf}
            </Text>
          </View>

          <Text style={styles.memberSince}>
            Membro desde {formatDate(perfil.criadoEm)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{perfil.bio}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.categoriasList}>
            {perfil.categorias.map((categoria) => {
              const colors = getIconColors(categoria.icone);
              return (
                <View key={categoria.id} style={styles.categoriaChip}>
                  <View style={[styles.categoriaChipIcon, { backgroundColor: colors.bg }]}>
                    <Ionicons name={getIconName(categoria.icone)} size={16} color={colors.icon} />
                  </View>
                  <Text style={styles.categoriaChipText}>{categoria.nome}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avaliacoes</Text>
            {perfil.totalAvaliacoes > 0 && (
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>

          {avaliacoes.length === 0 ? (
            <View style={styles.emptyAvaliacoes}>
              <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyAvaliacoesText}>
                Este profissional ainda nao possui avaliacoes
              </Text>
            </View>
          ) : (
            <View style={styles.avaliacoesList}>
              {avaliacoes.map((avaliacao: AvaliacaoResponse) => (
                <View key={avaliacao.id} style={styles.avaliacaoItem}>
                  <View style={styles.avaliacaoHeader}>
                    <View style={styles.avaliacaoClienteInfo}>
                      <View style={styles.avaliacaoAvatar}>
                        <Ionicons name="person" size={16} color="#9ca3af" />
                      </View>
                      <Text style={styles.avaliacaoClienteNome}>{avaliacao.clienteNome}</Text>
                    </View>
                    <Text style={styles.avaliacaoData}>{formatRelativeDate(avaliacao.criadoEm)}</Text>
                  </View>
                  {renderStars(avaliacao.nota)}
                  <Text style={styles.avaliacaoComentario}>{avaliacao.comentario}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorButton: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  nome: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  memberSince: {
    fontSize: 13,
    color: '#9ca3af',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  bioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  bioText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  categoriasList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoriaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  categoriaChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriaChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  emptyAvaliacoes: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyAvaliacoesText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  avaliacoesList: {
    gap: 12,
  },
  avaliacaoItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  avaliacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avaliacaoClienteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avaliacaoAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avaliacaoClienteNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  avaliacaoData: {
    fontSize: 12,
    color: '#9ca3af',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  avaliacaoComentario: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
