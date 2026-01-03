import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthStore } from '@/src/stores/authStore';
import { profissionalService } from '@/src/services/profissionalService';
import HomeCliente from '@/src/components/HomeCliente';
import HomeProfissional from '@/src/components/HomeProfissional';
import DrawerMenu from '@/src/components/DrawerMenu';

export default function HomeScreen() {
  const { modoAtual } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: isProfissional = false, refetch: refetchProfissional } = useQuery({
    queryKey: ['profissional-status'],
    queryFn: profissionalService.isProfissional,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useFocusEffect(
    useCallback(() => {
      refetchProfissional();
    }, [refetchProfissional])
  );

  const handleOpenDrawer = () => setDrawerOpen(true);
  const handleCloseDrawer = () => setDrawerOpen(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      {modoAtual === 'profissional' ? (
        <HomeProfissional onOpenDrawer={handleOpenDrawer} />
      ) : (
        <HomeCliente onOpenDrawer={handleOpenDrawer} />
      )}
      <DrawerMenu
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        isProfissional={isProfissional}
      />
    </SafeAreaView>
  );
}
