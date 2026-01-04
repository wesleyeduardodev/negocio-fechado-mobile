export interface AvaliacaoRequest {
  nota: number;
  comentario: string;
}

export interface AvaliacaoResponse {
  id: number;
  nota: number;
  comentario: string;
  clienteNome: string;
  criadoEm: string;
  fotos: string[];
}
