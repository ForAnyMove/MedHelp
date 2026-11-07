import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Channel,
  MessageList,
  MessageComposer,
  Window,
  useChannelStateContext,
  useChatContext
} from 'stream-chat-react';
import { useStreamContext } from '../../context/Stream';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from 'react-i18next';
import { useChatNotifications } from '../../context/ChatNotificationContext';
import ReportModal from '../../components/common/ReportModal';
import 'stream-chat-react/dist/css/index.css';

const formatChannelTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (isToday) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
};

const getWebTypo = (typo) => ({
  fontFamily: typo.fontFamily,
  fontSize: `${typo.fontSize}px`,
  lineHeight: `${typo.lineHeight}px`,
  letterSpacing: typo.letterSpacing ? `${typo.letterSpacing}px` : 'normal',
});

const formatLastActive = (lastActiveDateString, t) => {
  if (!lastActiveDateString) return t('chat.last_active_recently');

  const activeDate = new Date(lastActiveDateString);
  const now = new Date();

  const diffMs = now - activeDate;
  const diffMinutes = Math.floor(diffMs / 60000);

  const isToday = activeDate.getDate() === now.getDate() &&
    activeDate.getMonth() === now.getMonth() &&
    activeDate.getFullYear() === now.getFullYear();

  if (diffMinutes < 60) {
    if (diffMinutes === 0) return t('chat.last_active_recently');
    return t('chat.last_active_minutes_ago', { count: diffMinutes });
  }

  const hours = activeDate.getHours().toString().padStart(2, '0');
  const minutes = activeDate.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (isToday) {
    return t('chat.last_active_today', { time: timeStr });
  }

  const dateStr = activeDate.toLocaleDateString();

  return t('chat.last_active_date', { date: dateStr, time: timeStr });
};

const CustomChannelHeader = ({ onBack, onHeaderClick, isPortrait, colors, sizes, t }) => {
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();

  const otherMember = Object.values(channel.state.members).find(m => m.user_id !== client.userID)?.user;

  const name = otherMember?.name || otherMember?.id || 'User';
  const online = otherMember?.online;
  const lastActive = otherMember?.last_active;

  const subtitle = online ? t('chat.online') : formatLastActive(lastActive, t);

  return (
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: colors.white, borderBottom: `1px solid ${colors.n200}`, height: sizes.scale(68), padding: `0 ${sizes.spacing.m}px`, width: '100%' }}>
      {isPortrait && (
        <TouchableOpacity onPress={onBack} style={{ marginRight: sizes.spacing.m }}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.n900} />
        </TouchableOpacity>
      )}

      <div
        onClick={onHeaderClick}
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, height: '100%' }}
      >
        {/* Avatar */}
        <div style={{
          width: sizes.scale(42),
          height: sizes.scale(42),
          borderRadius: sizes.borderRadius.full,
          backgroundColor: colors.p100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: sizes.spacing.s,
          overflow: 'hidden'
        }}>
          {(otherMember?.image || otherMember?.avatar_url || otherMember?.avatar) ? (
            <img src={otherMember.image || otherMember.avatar_url || otherMember.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          ) : (
            <span style={{ color: colors.p500, ...getWebTypo(sizes.typography.bodyLarge), fontWeight: '700' }}>
              {(name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Name & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ ...getWebTypo(sizes.typography.h4), color: colors.n900 }}>
              {name}
            </span>
            {otherMember?.isVerified && (
              <Icon name="BadgeCheck" size={sizes.scale(16)} color={colors.p300} style={{ marginLeft: sizes.scale(4) }} />
            )}
          </div>
          <span style={{ ...getWebTypo(sizes.typography.caption), color: online ? colors.success : colors.n500, marginTop: sizes.spacing.xs / 2 }}>
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function ChatListScreen() {
  const router = useRouter();
  const { sizes, colors } = useTheme();
  const styles = getStyles(sizes, colors);
  const { chatClient } = useStreamContext();
  const { t } = useTranslation();
  const { pendingChannelId, setPendingChannelId, refreshUnreadCounts } = useChatNotifications();

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [infoPanelView, setInfoPanelView] = useState('main'); // 'main' | 'media'
  const [mutedChannels, setMutedChannels] = useState({});
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [unreadMap, setUnreadMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => sub.remove();
  }, []);

  const isPortrait = dimensions.width < 768;
  const isConnected = chatClient && !!chatClient.userID;

  useEffect(() => {
    if (!isConnected) return;

    const fetchChannels = async () => {
      try {
        const filters = { members: { $in: [chatClient.userID] } };
        const sort = [{ last_message_at: -1 }];
        const result = await chatClient.queryChannels(filters, sort, {
          watch: true,
          state: true,
          presence: true,
        });
        setChannels(result);
      } catch (err) {
        console.error('Error fetching channels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();

    const handleEvent = (event) => {
      if (event.type === 'message.new' || event.type === 'notification.added_to_channel' || event.type === 'message.read') {
        fetchChannels();
        // Refresh local unread map
        setTimeout(() => {
          const map = {};
          channels.forEach(ch => { map[ch.id] = ch.countUnread(); });
          setUnreadMap({ ...map });
        }, 100);
      }
    };

    chatClient.on(handleEvent);
    return () => chatClient.off(handleEvent);
  }, [isConnected, chatClient?.userID]);

  // Auto-open channel from notification tap
  useEffect(() => {
    if (!pendingChannelId || !channels.length) return;
    const target = channels.find(ch => ch.id === pendingChannelId);
    if (target) {
      handleChannelSelect(target);
      setPendingChannelId(null);
    }
  }, [pendingChannelId, channels]);

  // Update local unread map whenever channels array changes
  useEffect(() => {
    const map = {};
    channels.forEach(ch => { map[ch.id] = ch.countUnread(); });
    setUnreadMap(map);
  }, [channels]);

  const handleChannelSelect = async (channel) => {
    setShowInfoPanel(false);
    setInfoPanelView('main');
    try {
      await channel.watch();
      setSelectedChannel(channel);
      try {
        const muteStatus = channel.muteStatus?.();
        if (muteStatus && typeof muteStatus.muted === 'boolean') {
          setMutedChannels(prev => ({ ...prev, [channel.id]: muteStatus.muted }));
        }
      } catch (_) {}
      // Mark as read and refresh unread counts
      try { await channel.markRead(); } catch (_) { }
      refreshUnreadCounts();
      setUnreadMap(prev => ({ ...prev, [channel.id]: 0 }));
    } catch (err) {
      setSelectedChannel(channel);
    }
  };

  const handleToggleMute = async (channel) => {
    if (!channel) return;
    const currentlyMuted = !!mutedChannels[channel.id];
    const nextMuted = !currentlyMuted;
    setMutedChannels(prev => ({ ...prev, [channel.id]: nextMuted }));
    try {
      if (nextMuted) {
        await channel.mute?.();
      } else {
        await channel.unmute?.();
      }
    } catch (e) {
      console.warn('Channel mute toggle fallback:', e);
    }
  };

  const filteredChannels = React.useMemo(() => {
    if (!searchQuery.trim()) return channels;
    return channels.filter(channel => {
      const otherMember = Object.values(channel.state.members).find(m => m.user_id !== chatClient?.userID)?.user;
      const name = otherMember?.name || otherMember?.id || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [channels, searchQuery, chatClient?.userID]);

  if (!isConnected || loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.p500} />
        <Text style={{ marginTop: sizes.spacing.m, color: colors.n500, ...sizes.typography.bodyMedium }}>{t('chat.connecting') || 'Connecting...'}</Text>
      </View>
    );
  }

  const showSidebar = !isPortrait || !selectedChannel;
  const showDetail = !isPortrait || !!selectedChannel;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <style>{`
        /* OUTGOING MESSAGE */
        .str-chat__message--me .str-chat__message-simple__text-inner {
          background-color: #26C6DA !important;
          color: white !important;
          border-radius: 20px !important;
          border-bottom-right-radius: 0 !important;
          padding: 12px 16px !important;
        }
        
        /* INCOMING MESSAGE */
        .str-chat__message--other .str-chat__message-simple__text-inner {
          background-color: white !important;
          color: #0f172a !important;
          border-radius: 20px !important;
          border-bottom-left-radius: 0 !important;
          padding: 12px 16px !important;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05) !important;
          border: none !important;
        }
        
        /* DATE SEPARATOR */
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

        /* HIDE AVATAR IN MESSAGE LIST */
        .str-chat__message-simple__avatar-wrapper {
          display: none !important;
        }
        .str-chat__message-simple {
          padding-left: 0px !important;
        }

        /* INPUT OVERRIDES */
        .str-chat__message-input {
          padding: 16px !important;
          background-color: white !important;
          border-top: 1px solid #e2e8f0 !important;
        }
        .str-chat__input-flat-wrapper {
          background-color: #f1f5f9 !important;
          border-radius: 20px !important;
          border: 1px solid transparent !important;
          padding-left: 8px !important;
        }
        .str-chat__input-flat-wrapper:focus-within {
          border-color: #cbd5e1 !important;
        }
        .str-chat__send-button svg {
          fill: #26C6DA !important;
        }
        
        /* HIDE FILE ATTACHMENT IN INPUT IF NOT WANTED, BUT KEEP PLUS */
        .str-chat__fileupload-wrapper svg {
          fill: #26C6DA !important;
        }
      `}</style>
      <div className="str-chat str-chat--theme-light" style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%' }}>

        {/* SIDEBAR */}
        {showSidebar && (
          <div style={{
            width: isPortrait ? '100%' : sizes.scale(350),
            borderRight: isPortrait ? 'none' : `1px solid ${colors.n200}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: colors.white
          }}>
            <View style={[styles.header, { borderBottomColor: colors.n200, borderBottomWidth: 1, paddingHorizontal: sizes.spacing.m, height: sizes.scale(68) }]}>
              <TouchableOpacity
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/home');
                  }
                }}
                style={styles.backButton}
              >
                <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
              </TouchableOpacity>
              <Text style={[{ color: colors.n900, marginLeft: sizes.spacing.s }, sizes.typography.h3]}>{t('chat.messages')}</Text>
              <div style={{ flex: 1 }} />
            </View>

            <div style={{
              backgroundColor: colors.p300,
              borderRadius: sizes.scale(20),
              margin: sizes.spacing.m,
              padding: sizes.spacing.m,
              paddingVertical: isPortrait ? sizes.scale(20) : sizes.scale(14),
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.white,
                borderRadius: sizes.scale(20),
                padding: `0 ${sizes.spacing.m}px`,
                height: sizes.scale(40),
              }}>
                <Icon name="search" size={sizes.scale(20)} color={colors.p500} />
                <input
                  type="text"
                  placeholder={t('chat.search_by_name') || "Search by name"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    marginLeft: sizes.spacing.s,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: colors.n900,
                    ...getWebTypo(sizes.typography.bodyMedium)
                  }}
                />
                {!!searchQuery && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: sizes.scale(4) }}>
                    <Icon name="x" size={sizes.scale(16)} color={colors.n500} />
                  </TouchableOpacity>
                )}
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: colors.white,
              borderTopLeftRadius: isPortrait ? sizes.scale(24) : 0,
              borderTopRightRadius: isPortrait ? sizes.scale(24) : 0,
              margin: isPortrait ? `0 ${sizes.spacing.m}px` : 0,
              boxShadow: isPortrait ? '0 4px 15px rgba(0,0,0,0.05)' : 'none'
            }}>
              {filteredChannels.length === 0 ? (
                <div style={{ padding: sizes.spacing.xl, textAlign: 'center', color: colors.n500, ...getWebTypo(sizes.typography.bodyMedium) }}>
                  {t('chat.no_chats')}
                </div>
              ) : (
                filteredChannels.map(channel => {
                  const isSelected = selectedChannel?.id === channel.id;
                  const lastMessage = channel.state.messages[channel.state.messages.length - 1];
                  const otherMember = Object.values(channel.state.members).find(m => m.user_id !== chatClient.userID)?.user;
                  const unreadCount = unreadMap[channel.id] || 0;
                  const hasUnread = unreadCount > 0 && !isSelected;
                  const lastMessageTime = formatChannelTime(lastMessage?.created_at || channel.data?.last_message_at);
                  const lastMessagePreview = lastMessage?.text
                    || (lastMessage?.attachments?.length ? `📎 ${t('chat.attachment', 'Вложение')}` : t('chat.no_messages'));

                  return (
                    <div
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel)}
                      style={{
                        padding: `${sizes.spacing.s}px ${sizes.spacing.m}px`,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? colors.p100 : colors.white,
                        borderBottom: `1px solid ${colors.n200}`,
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: sizes.scale(56),
                        height: sizes.scale(56),
                        borderRadius: sizes.borderRadius.full,
                        backgroundColor: colors.p100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: sizes.spacing.s,
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}>
                        {(otherMember?.image || otherMember?.avatar_url || otherMember?.avatar) ? (
                          <img src={otherMember.image || otherMember.avatar_url || otherMember.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        ) : (
                          <span style={{ color: colors.p500, ...getWebTypo(sizes.typography.h3), fontWeight: '700' }}>
                            {(otherMember?.name || otherMember?.id || 'U')[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Text area */}
                      <div style={{ flex: 1, minWidth: sizes.scale(0) }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sizes.spacing.xs / 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', flex: 1, marginRight: sizes.spacing.xs, overflow: 'hidden' }}>
                            <span style={{ ...getWebTypo(sizes.typography.bodyLarge), fontWeight: '700', color: colors.n900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {otherMember?.name || otherMember?.id || 'User'}
                            </span>
                            {otherMember?.isVerified && (
                              <Icon name="BadgeCheck" size={sizes.scale(16)} color={colors.p300} style={{ marginLeft: sizes.scale(4), flexShrink: 0 }} />
                            )}
                          </div>
                          {!!lastMessageTime && (
                            <span style={{ ...getWebTypo(sizes.typography.caption), color: hasUnread ? colors.p500 : colors.n400, fontWeight: hasUnread ? '600' : '400', flexShrink: 0 }}>
                              {lastMessageTime}
                            </span>
                          )}
                        </div>
                        <span style={{ ...getWebTypo(sizes.typography.bodyMedium), color: hasUnread ? colors.n900 : colors.n500, fontWeight: hasUnread ? '600' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {lastMessagePreview}
                        </span>
                      </div>

                      {/* Unread badge */}
                      {hasUnread && (
                        <div style={{
                          minWidth: sizes.scale(22),
                          height: sizes.scale(22),
                          borderRadius: sizes.scale(11),
                          backgroundColor: colors.p500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingLeft: sizes.spacing.xs,
                          paddingRight: sizes.spacing.xs,
                          marginLeft: sizes.spacing.xs,
                          flexShrink: 0,
                        }}>
                          <span style={{ color: colors.white, ...getWebTypo(sizes.typography.caption), fontWeight: '700' }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* DETAIL */}
        {showDetail && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: colors.white
          }}>
            {selectedChannel ? (
              <Channel channel={selectedChannel} key={selectedChannel.id}>
                <Window>
                  <CustomChannelHeader
                    onBack={() => setSelectedChannel(null)}
                    onHeaderClick={() => {
                      setShowInfoPanel(!showInfoPanel);
                      setInfoPanelView('main');
                    }}
                    isPortrait={isPortrait}
                    colors={colors}
                    sizes={sizes}
                    t={t}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <MessageList />
                    <MessageComposer />
                  </div>
                </Window>

                {/* Info Panel */}
                {showInfoPanel && (
                  <div style={{
                    width: isPortrait ? '100%' : sizes.scale(320),
                    borderLeft: `1px solid ${colors.n200}`,
                    backgroundColor: colors.white,
                    display: 'flex',
                    flexDirection: 'column',
                    position: isPortrait ? 'absolute' : 'relative',
                    right: sizes.scale(0),
                    top: sizes.scale(0),
                    bottom: sizes.scale(0),
                    zIndex: 10
                  }}>
                    <div style={{ padding: sizes.spacing.m, borderBottom: `1px solid ${colors.n200}`, display: 'flex', alignItems: 'center', height: sizes.scale(68) }}>
                      <TouchableOpacity
                        onPress={() => {
                          if (infoPanelView !== 'main') {
                            setInfoPanelView('main');
                          } else {
                            setShowInfoPanel(false);
                          }
                        }}
                      >
                        <Icon name={infoPanelView !== 'main' ? 'arrow-back' : 'x'} size={sizes.scale(24)} color={colors.n900} />
                      </TouchableOpacity>
                      <span style={{ marginLeft: sizes.spacing.m, ...getWebTypo(sizes.typography.h4), color: colors.n900 }}>
                        {infoPanelView === 'media' ? t('chat.media_and_files') : t('chat.info')}
                      </span>
                    </div>

                    {(() => {
                      const otherMember = Object.values(selectedChannel.state.members).find(m => m.user_id !== chatClient.userID)?.user;
                      const pName = otherMember?.name || otherMember?.id || t('actions.chat', 'Чат');
                      const pOnline = otherMember?.online;
                      const isChannelMuted = !!mutedChannels[selectedChannel.id];

                      const sharedAttachments = (selectedChannel.state?.messages || []).reduce((acc, msg) => {
                        if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
                          msg.attachments.forEach((att, idx) => {
                            acc.push({
                              id: `${msg.id}-${idx}`,
                              type: att.type || (att.image_url || att.thumb_url ? 'image' : 'file'),
                              url: att.image_url || att.asset_url || att.thumb_url,
                              title: att.title || att.fallback || t('chat.attachment', 'Вложение'),
                              createdAt: msg.created_at,
                            });
                          });
                        }
                        return acc;
                      }, []);

                      if (infoPanelView === 'media') {
                        return (
                          <div style={{ flex: 1, overflowY: 'auto', padding: sizes.spacing.m }}>
                            {sharedAttachments.length === 0 ? (
                              <div style={{ padding: sizes.spacing.xl, textAlign: 'center', color: colors.n500, ...getWebTypo(sizes.typography.bodyMedium) }}>
                                {t('chat.no_media', 'Нет медиафайлов и документов')}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: sizes.spacing.s }}>
                                {sharedAttachments.map((item) => (
                                  <a
                                    key={item.id}
                                    href={item.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      padding: sizes.spacing.s,
                                      borderRadius: sizes.borderRadius.medium,
                                      border: `1px solid ${colors.n200}`,
                                      textDecoration: 'none',
                                      color: colors.n900,
                                      gap: sizes.spacing.s,
                                    }}
                                  >
                                    {item.type === 'image' && item.url ? (
                                      <img
                                        src={item.url}
                                        alt={item.title}
                                        style={{ width: sizes.scale(48), height: sizes.scale(48), borderRadius: sizes.scale(8), objectFit: 'cover', flexShrink: 0 }}
                                      />
                                    ) : (
                                      <div style={{
                                        width: sizes.scale(48),
                                        height: sizes.scale(48),
                                        borderRadius: sizes.scale(8),
                                        backgroundColor: colors.p100,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                      }}>
                                        <Icon name="file" size={sizes.scale(22)} color={colors.p500} />
                                      </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ ...getWebTypo(sizes.typography.bodyMedium), fontWeight: '600', color: colors.n900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.title}
                                      </div>
                                      {!!item.createdAt && (
                                        <div style={{ ...getWebTypo(sizes.typography.caption), color: colors.n500 }}>
                                          {formatChannelTime(item.createdAt)}
                                        </div>
                                      )}
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <>
                          <div style={{ padding: `${sizes.spacing.xl}px ${sizes.spacing.m}px ${sizes.spacing.l}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: `1px solid ${colors.n200}` }}>
                            <div style={{ width: sizes.scale(96), height: sizes.scale(96), borderRadius: sizes.borderRadius.full, backgroundColor: colors.p100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: sizes.spacing.m, overflow: 'hidden' }}>
                              {(otherMember?.image || otherMember?.avatar_url || otherMember?.avatar) ? (
                                <img src={otherMember.image || otherMember.avatar_url || otherMember.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                              ) : (
                                <span style={{ color: colors.p500, ...getWebTypo(sizes.typography.displayS), fontWeight: '700' }}>
                                  {(pName || 'U')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ ...getWebTypo(sizes.typography.h3), textAlign: 'center', color: colors.n900 }}>{pName}</span>
                              {otherMember?.isVerified && (
                                <Icon name="BadgeCheck" size={sizes.scale(20)} color={colors.p300} style={{ marginLeft: sizes.scale(6) }} />
                              )}
                            </div>
                            <span style={{ ...getWebTypo(sizes.typography.bodyMedium), color: pOnline ? colors.success : colors.n500, marginTop: sizes.spacing.xs }}>
                              {pOnline ? t('chat.online') : formatLastActive(otherMember?.last_active, t)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', padding: `${sizes.spacing.s}px 0`, flex: 1 }}>
                            <div
                              onClick={() => handleToggleMute(selectedChannel)}
                              style={{ padding: `${sizes.spacing.m}px ${sizes.spacing.l}px`, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                              <Icon name={isChannelMuted ? 'bell-off' : 'bell'} size={sizes.scale(24)} color={isChannelMuted ? colors.n400 : colors.p500} />
                              <span style={{ marginLeft: sizes.spacing.m, ...getWebTypo(sizes.typography.bodyLarge), color: colors.n900, flex: 1 }}>
                                {isChannelMuted ? t('chat.notifications_off', 'Уведомления выключены') : t('chat.notifications_on')}
                              </span>
                            </div>
                            <div
                              onClick={() => setInfoPanelView('media')}
                              style={{ padding: `${sizes.spacing.m}px ${sizes.spacing.l}px`, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                              <Icon name="image" size={sizes.scale(24)} color={colors.n500} />
                              <span style={{ marginLeft: sizes.spacing.m, ...getWebTypo(sizes.typography.bodyLarge), color: colors.n900, flex: 1 }}>
                                {t('chat.media_and_files')}
                              </span>
                              <span style={{ ...getWebTypo(sizes.typography.caption), color: colors.n400, marginRight: sizes.spacing.xs }}>
                                {sharedAttachments.length}
                              </span>
                              <Icon name="chevron-right" size={sizes.scale(18)} color={colors.n400} />
                            </div>
                            {otherMember?.id && (
                              <div
                                onClick={() => {
                                  setReportTargetId(otherMember.id);
                                  setReportModalVisible(true);
                                }}
                                style={{ padding: `${sizes.spacing.m}px ${sizes.spacing.l}px`, display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: 'auto' }}
                              >
                                <Icon name="slash" size={sizes.scale(24)} color={colors.danger} />
                                <span style={{ marginLeft: sizes.spacing.m, ...getWebTypo(sizes.typography.bodyLarge), color: colors.danger }}>{t('chat.block_user')}</span>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </Channel>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="message-square" size={sizes.scale(64)} color={colors.n300} />
                <div style={{ color: colors.n500, marginTop: sizes.spacing.m, ...getWebTypo(sizes.typography.bodyLarge) }}>{t('chat.select_chat')}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {reportTargetId && (
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          targetType="profile"
          targetId={reportTargetId}
        />
      )}
    </View>
  );
}

const getStyles = (sizes, colors) => ({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: sizes.scale(4),
  },
});
