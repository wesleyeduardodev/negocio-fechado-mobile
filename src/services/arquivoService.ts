import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from './api';
import { Arquivo } from '@/types/arquivo';

const MAX_DIMENSION = 1920;
const COMPRESS_QUALITY = 0.8;

export const arquivoService = {
  async selecionarFotos(maxQuantidade: number = 5): Promise<string[]> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Permissao para acessar galeria negada');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: maxQuantidade,
      quality: 1,
    });

    if (result.canceled) {
      return [];
    }

    return result.assets.map((asset) => asset.uri);
  },

  async selecionarFoto(): Promise<string | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Permissao para acessar galeria negada');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  },

  async comprimirImagem(uri: string): Promise<string> {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      {
        compress: COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipulated.uri;
  },

  async uploadFotosSolicitacao(
    solicitacaoId: number,
    uris: string[]
  ): Promise<Arquivo[]> {
    const formData = new FormData();

    for (let i = 0; i < uris.length; i++) {
      const compressedUri = await this.comprimirImagem(uris[i]);

      formData.append('fotos', {
        uri: compressedUri,
        type: 'image/jpeg',
        name: `foto_${i + 1}.jpg`,
      } as unknown as Blob);
    }

    const response = await api.post<Arquivo[]>(
      `/arquivos/solicitacoes/${solicitacaoId}/fotos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  async listarFotosSolicitacao(solicitacaoId: number): Promise<Arquivo[]> {
    const response = await api.get<Arquivo[]>(
      `/arquivos/solicitacoes/${solicitacaoId}/fotos`
    );
    return response.data;
  },

  async deletarFotoSolicitacao(
    solicitacaoId: number,
    fotoId: number
  ): Promise<void> {
    await api.delete(`/arquivos/solicitacoes/${solicitacaoId}/fotos/${fotoId}`);
  },

  async uploadFotosAvaliacao(
    avaliacaoId: number,
    uris: string[]
  ): Promise<Arquivo[]> {
    const formData = new FormData();

    for (let i = 0; i < uris.length; i++) {
      const compressedUri = await this.comprimirImagem(uris[i]);

      formData.append('fotos', {
        uri: compressedUri,
        type: 'image/jpeg',
        name: `foto_${i + 1}.jpg`,
      } as unknown as Blob);
    }

    const response = await api.post<Arquivo[]>(
      `/arquivos/avaliacoes/${avaliacaoId}/fotos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  async listarFotosAvaliacao(avaliacaoId: number): Promise<Arquivo[]> {
    const response = await api.get<Arquivo[]>(
      `/arquivos/avaliacoes/${avaliacaoId}/fotos`
    );
    return response.data;
  },

  async deletarFotoAvaliacao(
    avaliacaoId: number,
    fotoId: number
  ): Promise<void> {
    await api.delete(`/arquivos/avaliacoes/${avaliacaoId}/fotos/${fotoId}`);
  },

  async uploadAvatar(uri: string): Promise<string> {
    const compressedUri = await this.comprimirImagem(uri);

    const formData = new FormData();
    formData.append('foto', {
      uri: compressedUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as unknown as Blob);

    const response = await api.post('/usuarios/me/foto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.fotoUrl;
  },

  async removerAvatar(): Promise<void> {
    await api.delete('/usuarios/me/foto');
  },

  // Portfolio do profissional
  async uploadFotosPerfil(uris: string[]): Promise<Arquivo[]> {
    const formData = new FormData();

    for (let i = 0; i < uris.length; i++) {
      const compressedUri = await this.comprimirImagem(uris[i]);

      formData.append('fotos', {
        uri: compressedUri,
        type: 'image/jpeg',
        name: `portfolio_${i + 1}.jpg`,
      } as unknown as Blob);
    }

    const response = await api.post<Arquivo[]>(
      '/arquivos/perfil/fotos',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  async listarFotosMeuPerfil(): Promise<Arquivo[]> {
    const response = await api.get<Arquivo[]>('/arquivos/perfil/fotos');
    return response.data;
  },

  async listarFotosPerfil(profissionalId: number): Promise<Arquivo[]> {
    const response = await api.get<Arquivo[]>(
      `/arquivos/profissionais/${profissionalId}/fotos`
    );
    return response.data;
  },

  async deletarFotoPerfil(fotoId: number): Promise<void> {
    await api.delete(`/arquivos/perfil/fotos/${fotoId}`);
  },
};
