import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Channel, MessageList, useMessageContext, useMessageInputContext, WithComponents, MessageInput } from 'stream-chat-expo';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from 'react-i18next';

// Custom Date Header
const CustomDateHeader = ({ dateString }) => {
  const { colors, sizes } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.p100,
      borderRadius: sizes.scale(12),
      paddingHorizontal: sizes.spacing.m,
      paddingVertical: sizes.spacing.xs,
      alignSelf: 'center',
      marginVertical: sizes.spacing.m,
    }}>
      <Text style={{ color: colors.p700, ...sizes.typography.caption }}>{dateString}</Text>
    </View>
  );
};

// Custom Message
const CustomMessage = () => {
  const { message, isMyMessage } = useMessageContext();
  const { colors, sizes } = useTheme();

  if (message.type === 'system') {
    return (
      <Text style={{ alignSelf: 'center', color: colors.n500, ...sizes.typography.caption, marginVertical: sizes.spacing.m }}>
        {message.text}
      </Text>
    );
  }

  const isMy = isMyMessage(message);

  return (
    <View style={{ marginVertical: sizes.spacing.s, marginHorizontal: sizes.spacing.m, alignItems: isMy ? 'flex-end' : 'flex-start' }}>
      <View style={{
        backgroundColor: isMy ? /* TODO: color */ '#26C6DA' : colors.white,
        borderRadius: sizes.scale(20),
        borderBottomRightRadius: isMy ? 0 : sizes.scale(20),
        borderBottomLeftRadius: isMy ? sizes.scale(20) : 0,
        paddingHorizontal: sizes.spacing.m,
        paddingVertical: sizes.scale(12),
        maxWidth: '80%',
        shadowColor: /* TODO: color */ '#000',
        shadowOffset: { width: sizes.scale(0), height: sizes.scale(2) },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
      }}>
        {message.attachments && message.attachments.length > 0 && (
          <View style={{ marginBottom: message.text ? sizes.spacing.s : 0 }}>
            {message.attachments.map((att, i) => (
              att.type === 'image' && att.image_url ? (
                <Image key={i} source={{ uri: att.image_url }} style={{ width: sizes.scale(200), height: sizes.scale(200), borderRadius: sizes.scale(8) }} />
              ) : (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="file" size={sizes.scale(24)} color={isMy ? colors.white : colors.p500} />
                  <Text style={{ color: isMy ? colors.white : colors.n900, marginLeft: sizes.spacing.s, ...sizes.typography.bodyMedium }}>{att.title || 'File'}</Text>
                </View>
              )
            ))}
          </View>
        )}
        {!!message.text && (
          <Text style={{ color: isMy ? colors.white : colors.n900, ...sizes.typography.bodyMedium }}>
            {message.text}
          </Text>
        )}
      </View>
      <Text style={{ color: colors.n400, ...sizes.typography.caption, marginTop: sizes.scale(4) }}>
        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

// Custom Input
const CustomInput = () => {
  const { text, setText, sendMessage, pickFile } = useMessageInputContext();
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: sizes.spacing.m, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.n200 }}>
      <TouchableOpacity onPress={pickFile} style={{ width: sizes.scale(36), height: sizes.scale(36), borderRadius: sizes.scale(18), borderWidth: 1, borderColor: /* TODO: color */ '#26C6DA', alignItems: 'center', justifyContent: 'center', marginRight: sizes.spacing.s }}>
        <Icon name="plus" size={sizes.scale(20)} color={/* TODO: color */ '#26C6DA'} />
      </TouchableOpacity>
      <TextInput
        style={{ flex: 1, backgroundColor: colors.bg, borderRadius: sizes.scale(20), paddingHorizontal: sizes.spacing.m, height: sizes.scale(40), color: colors.n900, ...sizes.typography.bodyMedium }}
        placeholder={t('chat.write_message') || "Write a message"}
        placeholderTextColor={colors.n400}
        value={text}
        onChangeText={setText}
      />
      <TouchableOpacity
        onPress={() => sendMessage()}
        style={{ marginLeft: sizes.spacing.s, width: sizes.scale(40), height: sizes.scale(40), alignItems: 'center', justifyContent: 'center' }}
        disabled={!text?.trim()}
      >
        <Icon name="send" size={sizes.scale(24)} color={text?.trim() ? /* TODO: color */ '#26C6DA' : colors.n300} />
      </TouchableOpacity>
    </View>
  );
};

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
      const c = chatClient.channel('messaging', id);
      await c.watch();
      setChannel(c);
    };

    fetchChannel();
  }, [id, chatClient]);

  if (!channel) return null;

  // Find the other member for the header
  const otherMembers = Object.values(channel.state.members).filter(
    (m) => m.user.id !== chatClient.userID
  );
  const otherUser = otherMembers.length > 0 ? otherMembers[0].user : null;
  const name = otherUser?.name || 'Unknown';
  const avatar = otherUser?.image;
  const online = otherUser?.online;

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
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>

        {/* User Info Header */}
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: sizes.spacing.s }}
          activeOpacity={0.7}
        >
          <View style={{
            width: sizes.scale(42),
            height: sizes.scale(42),
            borderRadius: sizes.scale(21),
            backgroundColor: colors.p100,
            overflow: 'hidden',
            marginRight: sizes.spacing.s,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text style={{ color: colors.p500, ...sizes.typography.h4 }}>
                {name[0]?.toUpperCase()}
              </Text>
            )}
          </View>
          <View>
            <Text style={{ color: colors.n900, ...sizes.typography.h4 }}>
              {name}
            </Text>
            <Text style={{ color: online ? colors.success : colors.p500, ...sizes.typography.caption, marginTop: sizes.scale(2) }}>
              {online ? t('chat.online') : t('chat.offline')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <WithComponents overrides={{ Message: CustomMessage, InputView: CustomInput, DateHeader: CustomDateHeader }}>
          <Channel channel={channel}>
            <MessageList />
            <MessageInput />
          </Channel>
        </WithComponents>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (sizes, colors) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: sizes.scale(4),
  },
});
