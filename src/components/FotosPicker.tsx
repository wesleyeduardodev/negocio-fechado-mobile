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

interface FotosPickerProps {
  fotos: string[];
  onFotosChange: (fotos: string[]) => void;
  maxFotos?: number;
  disabled?: boolean;
}

export function FotosPicker({
  fotos,
  onFotosChange,
  maxFotos = 5,
  disabled = false,
}: FotosPickerProps) {
  const [loading, setLoading] = useState(false);

  const adicionarFotos = async () => {
    if (disabled) return;

    if (fotos.length >= maxFotos) {
      Alert.alert('Limite atingido', `Maximo de ${maxFotos} fotos`);
      return;
    }

    try {
      setLoading(true);
      const novasFotos = await arquivoService.selecionarFotos(
        maxFotos - fotos.length
      );

      if (novasFotos.length > 0) {
        onFotosChange([...fotos, ...novasFotos]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel selecionar as fotos');
    } finally {
      setLoading(false);
    }
  };

  const removerFoto = (index: number) => {
    if (disabled) return;

    const novasFotos = fotos.filter((_, i) => i !== index);
    onFotosChange(novasFotos);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Fotos ({fotos.length}/{maxFotos})
      </Text>

      <View style={styles.grid}>
        {fotos.map((uri, index) => (
          <View key={index} style={styles.fotoContainer}>
            <Image source={{ uri }} style={styles.foto} />
            {!disabled && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removerFoto(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {fotos.length < maxFotos && !disabled && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={adicionarFotos}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <>
                <Ionicons name="add" size={32} color="#666" />
                <Text style={styles.addText}>Adicionar</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hint}>
        Adicione fotos para ajudar o profissional a entender o servico
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fotoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  foto: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
});
