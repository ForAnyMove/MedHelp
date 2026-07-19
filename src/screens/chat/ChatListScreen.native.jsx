import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChannelList } from 'stream-chat-expo';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from 'react-i18next';
import { useChatNotifications } from '../../context/ChatNotificationContext';

const CustomListItem = ({ channel, onSelect }) => {
  const { sizes, colors } = useTheme();
  const { chatClient } = useStreamContext();

  // Find the other member
  const otherMembers = Object.values(channel.state.members).filter(
    (m) => m.user.id !== chatClient.userID
  );
  const otherUser = otherMembers.length > 0 ? otherMembers[0].user : null;
  const name = otherUser?.name || 'Unknown';
  const avatar = otherUser?.image;

  // Last message text
  const lastMessage = channel.state.messages[channel.state.messages.length - 1];
  let lastMessageText = lastMessage?.text || '';
  if (lastMessage?.attachments?.length > 0) {
    lastMessageText = 'Attachment';
  }

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: sizes.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.n100,
        backgroundColor: colors.white,
      }}
      onPress={() => onSelect(channel)}
    >
      <View style={{
        width: sizes.scale(48),
        height: sizes.scale(48),
        borderRadius: sizes.scale(24),
        backgroundColor: colors.n200,
        overflow: 'hidden',
        marginRight: sizes.spacing.m,
      }}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Icon name="person" size={sizes.scale(24)} color={colors.n500} style={{ alignSelf: 'center', marginTop: sizes.scale(12) }} />
        )}
      </View>
      <View style={{ flex: 1, paddingBottom: sizes.spacing.s }}>
        <Text style={{ ...sizes.typography.bodyLarge, color: colors.n900, fontFamily: 'Manrope_600SemiBold' }}>
          {name}
        </Text>
        <Text style={{ ...sizes.typography.bodyMedium, color: colors.n500, marginTop: sizes.scale(4) }} numberOfLines={1}>
          {lastMessageText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ChatListScreen() {
  const { sizes, colors } = useTheme();
  const router = useRouter();
  const { chatClient } = useStreamContext();
  const { t } = useTranslation();
  const { pendingChannelId, setPendingChannelId, refreshUnreadCounts } = useChatNotifications();
  const [searchQuery, setSearchQuery] = useState('');

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

  // Memoize filters for local search
  const filters = useMemo(() => {
    if (!isConnected) return null;
    const baseFilter = { members: { $in: [chatClient.userID] } };

    if (searchQuery.trim()) {
      return {
        $and: [
          baseFilter,
          { name: { $autocomplete: searchQuery.trim() } }
        ]
      };
    }
    return baseFilter;
  }, [isConnected, chatClient?.userID, searchQuery]);

  const sort = useMemo(() => [{ last_message_at: -1 }], []);
  const options = useMemo(() => ({ state: true, presence: true, limit: 10 }), []);

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
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
        <Text style={[{ color: colors.n900, marginLeft: sizes.spacing.s }, sizes.typography.h3]}>
          {t('chat.messages') || 'Messages'}
        </Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{
          backgroundColor: colors.p300,
          borderRadius: sizes.scale(16),
          marginHorizontal: sizes.spacing.m,
          marginBottom: sizes.spacing.m,
          padding: sizes.spacing.m,
          paddingVertical: sizes.scale(12),
          overflow: 'hidden',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.white,
            borderRadius: sizes.scale(12),
            paddingHorizontal: sizes.spacing.m,
            height: sizes.scale(44),
          }}>
            <Icon name="search" size={sizes.scale(20)} color={colors.p500} />
            <TextInput
              style={{ flex: 1, marginLeft: sizes.spacing.s, color: colors.n900, ...sizes.typography.bodyMedium }}
              placeholder={t('chat.search_by_name') || "Search by name"}
              placeholderTextColor={colors.n400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={{
          flex: 1,
          backgroundColor: colors.white,
          borderTopLeftRadius: sizes.scale(24),
          borderTopRightRadius: sizes.scale(24),
          marginHorizontal: sizes.spacing.m,
          shadowColor: /* TODO: color */ '#000',
          shadowOffset: { width: sizes.scale(0), height: sizes.scale(4) },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 3,
          overflow: 'hidden',
        }}>
          <ChannelList
            filters={filters}
            sort={sort}
            options={options}
            onSelect={onChannelSelect}
            Preview={CustomListItem}
          />
        </View>
      </View>
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
  },
  backButton: {
    padding: sizes.scale(8),
  },
});
