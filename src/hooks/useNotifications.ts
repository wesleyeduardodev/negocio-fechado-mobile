import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { notificacaoService } from '@/src/services/notificacaoService';
import { useAuthStore } from '@/src/stores/authStore';
import { TipoNotificacao } from '@/src/types/notificacao';

const isExpoGo = Constants.appOwnership === 'expo';

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isExpoGo) {
      console.log('Push notifications desabilitado no Expo Go (SDK 53+)');
      return;
    }

    let Notifications: typeof import('expo-notifications');

    const setup = async () => {
      Notifications = await import('expo-notifications');

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      await registerForPushNotifications(Notifications);

      notificationListener.current = Notifications.addNotificationReceivedListener(() => {
        queryClient.invalidateQueries({ queryKey: ['notificacoes-count'] });
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response);
      });
    };

    setup();

    return () => {
      if (notificationListener.current && Notifications) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current && Notifications) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated]);

  const registerForPushNotifications = async (Notifications: typeof import('expo-notifications')) => {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      if (!projectId) {
        console.log('EXPO_PUBLIC_PROJECT_ID not configured');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

      const token = tokenData.data;
      setExpoPushToken(token);

      await notificacaoService.registrarToken({
        token,
        plataforma: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.log('Push notifications not available:', error);
    }
  };

  const handleNotificationResponse = (response: any) => {
    const data = response.notification.request.content.data as {
      tipo?: TipoNotificacao;
      referenciaId?: number;
    };

    if (!data.tipo || !data.referenciaId) return;

    queryClient.invalidateQueries({ queryKey: ['notificacoes-count'] });

    switch (data.tipo) {
      case 'NOVA_SOLICITACAO':
        router.push(`/solicitacao/${data.referenciaId}?modo=profissional`);
        break;
      case 'NOVO_INTERESSE':
        router.push(`/solicitacao/${data.referenciaId}`);
        break;
      case 'INTERESSE_ACEITO':
        router.push('/(tabs)');
        break;
      case 'SERVICO_CONCLUIDO':
      case 'NOVA_AVALIACAO':
        router.push(`/solicitacao/${data.referenciaId}`);
        break;
    }
  };

  return { expoPushToken };
}
