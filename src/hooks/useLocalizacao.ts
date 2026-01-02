import { useQuery } from '@tanstack/react-query';

import { localizacaoService } from '@/src/services/localizacaoService';

export function useCidades(uf: string) {
  return useQuery({
    queryKey: ['cidades', uf],
    queryFn: () => localizacaoService.listarCidades(uf),
    enabled: !!uf,
  });
}
