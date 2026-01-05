import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { notificacaoService } from '@/src/services/notificacaoService';

interface NotificationBadgeProps {
  size?: number;
  color?: string;
}

export function NotificationBadge({ size = 24, color = '#374151' }: NotificationBadgeProps) {
  const { data: count } = useQuery({
    queryKey: ['notificacoes-count'],
    queryFn: notificacaoService.contarNaoLidas,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  const handlePress = () => {
    router.push('/notificacoes');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {count !== undefined && count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
