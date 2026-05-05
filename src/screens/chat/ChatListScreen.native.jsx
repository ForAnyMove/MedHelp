import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChannelList } from 'stream-chat-expo';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from 'react-i18next';
import { useChatNotifications } from '../../context/ChatNotificationContext';

export default function ChatListScreen() {
  const router = useRouter();
  const { chatClient } = useStreamContext();
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const { pendingChannelId, setPendingChannelId, refreshUnreadCounts } = useChatNotifications();

  React.useEffect(() => {
    if (pendingChannelId) {
      router.push({
        pathname: '/(chat)/room/[id]',
        params: { id: pendingChannelId }
      });
      setPendingChannelId(null);
    }
  }, [pendingChannelId]);

  const onChannelSelect = (channel) => {
    // refresh counts on open
    refreshUnreadCounts();
    router.push({
      pathname: '/(chat)/room/[id]',
      params: { id: channel.id }
    });
  };

  const isConnected = chatClient && !!chatClient.userID;
  const filters = isConnected ? { members: { $in: [chatClient.userID] } } : null;
  const sort = [{ last_message_at: -1 }];
  const options = { state: true, presence: true, limit: 10 };

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color={colors.p500} />
         <Text style={{ marginTop: sizes.scale(16), color: colors.n500 }}>{t('chat.connecting') || 'Connecting to chat...'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { 
        paddingHorizontal: sizes.spacing.m, 
        paddingVertical: sizes.spacing.s,
        borderBottomColor: colors.n200 
      }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={sizes.scale(24)} color={colors.n900} />
        </TouchableOpacity>
        <Text style={[{ color: colors.n900 }, sizes.typography.h3]}>{t('chat.messages') || 'Messages'}</Text>
        <View style={{ width: sizes.scale(24) }} />
      </View>

      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        onSelect={onChannelSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
});
