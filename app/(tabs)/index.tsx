import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/src/stores/authStore';
import HomeCliente from '@/src/components/HomeCliente';
import HomeProfissional from '@/src/components/HomeProfissional';

export default function HomeScreen() {
  const { modoAtual } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      {modoAtual === 'profissional' ? <HomeProfissional /> : <HomeCliente />}
    </SafeAreaView>
  );
}
