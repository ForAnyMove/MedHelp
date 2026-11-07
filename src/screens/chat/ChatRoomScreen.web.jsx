import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Channel, MessageList, MessageComposer, Window } from 'stream-chat-react';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from 'react-i18next';
import 'stream-chat-react/dist/css/index.css';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { chatClient } = useStreamContext();
  const { colors, sizes } = useTheme();
  const styles = getStyles(sizes, colors);
  const { t } = useTranslation();
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    if (!chatClient || !id) return;

    const fetchChannel = async () => {
      try {
        const c = chatClient.channel('messaging', id);
        await c.watch();
        setChannel(c);
      } catch (err) {
        console.error('Error fetching channel:', err);
      }
    };

    fetchChannel();
  }, [id, chatClient]);

  if (!channel) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.n500, ...sizes.typography.bodyMedium }}>{t('chat.loading')}</Text>
      </View>
    );
  }

  const otherMember = Object.values(channel.state.members).find(m => m.user_id !== chatClient.userID)?.user;
  const avatarUrl = otherMember?.image || otherMember?.avatar_url || otherMember?.avatar;
  const name = otherMember?.name || channel.data?.name || t('actions.chat');
  const online = otherMember?.online;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <style>{`
        .str-chat__message--me .str-chat__message-simple__text-inner {
          background-color: #26C6DA !important;
          color: white !important;
          border-radius: 20px !important;
          border-bottom-right-radius: 0 !important;
          padding: 12px 16px !important;
        }
        .str-chat__message--other .str-chat__message-simple__text-inner {
          background-color: white !important;
          color: #0f172a !important;
          border-radius: 20px !important;
          border-bottom-left-radius: 0 !important;
          padding: 12px 16px !important;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05) !important;
          border: none !important;
        }
        .str-chat__date-separator-date {
          background-color: #E0F7FA !important;
          color: #00838F !important;
          border-radius: 12px !important;
          padding: 4px 12px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        }
        .str-chat__date-separator-line {
          display: none !important;
        }
        .str-chat__message-simple__avatar-wrapper {
          display: none !important;
        }
        .str-chat__message-simple {
          padding-left: 0px !important;
        }
      `}</style>
      <View style={[styles.header, {
        paddingHorizontal: sizes.spacing.m,
        paddingVertical: sizes.spacing.s,
        borderBottomColor: colors.n200,
        backgroundColor: colors.white,
        height: sizes.scale(68),
      }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(chat)/list');
            }
          }}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.n900} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: sizes.spacing.s }}>
          <div style={{
            width: sizes.scale(42),
            height: sizes.scale(42),
            borderRadius: sizes.borderRadius.full,
            backgroundColor: colors.p100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: sizes.spacing.s,
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            ) : (
              <span style={{ color: colors.p500, fontWeight: '700', fontSize: sizes.scale(16) }}>
                {(name || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[{ color: colors.n900 }, sizes.typography.h4]}>
                {name}
              </Text>
              {otherMember?.isVerified && (
                <Icon name="BadgeCheck" size={sizes.scale(16)} color={colors.p300} style={{ marginLeft: sizes.scale(4) }} />
              )}
            </View>
            <Text style={{ color: online ? colors.success : colors.n500, ...sizes.typography.caption, marginTop: sizes.scale(2) }}>
              {online ? t('chat.online') : t('chat.offline', 'Не в сети')}
            </Text>
          </View>
        </View>
      </View>

      <div className="str-chat str-chat--theme-light" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: `calc(100vh - ${sizes.scale(68)}px)` }}>
        <Channel channel={channel}>
          <Window>
            <MessageList />
            <MessageComposer />
          </Window>
        </Channel>
      </div>
    </View>
  );
}

const getStyles = (sizes, colors) => ({
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
    padding: sizes.scale(4),
  },
});
