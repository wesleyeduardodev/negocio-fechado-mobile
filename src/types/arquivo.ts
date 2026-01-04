export interface Arquivo {
  id: number;
  url: string;
  nomeOriginal: string;
  tamanho: number;
  largura: number | null;
  altura: number | null;
  ordem: number;
}
