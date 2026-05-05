import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Channel, MessageList, MessageInput } from 'stream-chat-expo';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from 'react-i18next';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { chatClient } = useStreamContext();
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    if (!chatClient || !id) return;

    const fetchChannel = async () => {
      const c = chatClient.channel('messaging', id);
      await c.watch();
      setChannel(c);
    };

    fetchChannel();
  }, [id, chatClient]);

  if (!channel) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, {
        paddingHorizontal: sizes.spacing.m,
        paddingVertical: sizes.spacing.s,
        borderBottomColor: colors.n200,
        backgroundColor: colors.white,
        height: sizes.scale(68),
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={sizes.scale(24)} color={colors.n900} />
        </TouchableOpacity>
        <Text style={[{ color: colors.n900 }, sizes.typography.h3]}>
          {channel.data?.name || t('actions.chat')}
        </Text>
        <View style={{ width: sizes.scale(24) }} />
      </View>

      <Channel channel={channel}>
        <MessageList />
        <MessageInput />
      </Channel>
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
