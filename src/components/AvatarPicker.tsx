import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { arquivoService } from '@/src/services/arquivoService';

interface AvatarPickerProps {
  fotoUrl: string | null;
  onFotoChange: (url: string | null) => void;
  size?: number;
  disabled?: boolean;
}

export function AvatarPicker({
  fotoUrl,
  onFotoChange,
  size = 120,
  disabled = false,
}: AvatarPickerProps) {
  const [loading, setLoading] = useState(false);

  const selecionarFoto = async () => {
    if (disabled) return;

    try {
      setLoading(true);
      const uri = await arquivoService.selecionarFoto();

      if (uri) {
        const novaUrl = await arquivoService.uploadAvatar(uri);
        onFotoChange(novaUrl);
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel atualizar a foto');
    } finally {
      setLoading(false);
    }
  };

  const removerFoto = async () => {
    if (disabled) return;

    Alert.alert('Remover foto', 'Deseja remover sua foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await arquivoService.removerAvatar();
            onFotoChange(null);
          } catch (error) {
            Alert.alert('Erro', 'Nao foi possivel remover a foto');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.avatarContainer, { width: size, height: size }]}
        onPress={selecionarFoto}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : fotoUrl ? (
          <Image
            source={{ uri: fotoUrl }}
            style={[styles.avatar, { width: size, height: size }]}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <Ionicons name="person" size={size * 0.5} color="#CCC" />
          </View>
        )}

        {!disabled && !loading && (
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>

      {fotoUrl && !disabled && (
        <TouchableOpacity onPress={removerFoto} disabled={loading}>
          <Text style={styles.removerText}>Remover foto</Text>
        </TouchableOpacity>
      )}

      {!fotoUrl && !disabled && (
        <Text style={styles.hint}>Toque para adicionar foto</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 60,
  },
  placeholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  removerText: {
    marginTop: 8,
    color: '#FF4444',
    fontSize: 14,
  },
  hint: {
    marginTop: 8,
    color: '#888',
    fontSize: 14,
  },
});
