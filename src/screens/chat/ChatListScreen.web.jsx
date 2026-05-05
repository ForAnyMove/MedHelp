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
import 'stream-chat-react/dist/css/index.css';

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
          <Icon name="arrow-left" size={sizes.scale(24)} color={colors.n900} />
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
          {otherMember?.image ? (
            <img src={otherMember.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          ) : (
            <span style={{ color: colors.p500, ...getWebTypo(sizes.typography.bodyLarge), fontWeight: '700' }}>
              {(name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Name & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ ...getWebTypo(sizes.typography.h4), color: colors.n900 }}>
            {name}
          </span>
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
  const { chatClient } = useStreamContext();
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const { pendingChannelId, setPendingChannelId, refreshUnreadCounts } = useChatNotifications();

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [unreadMap, setUnreadMap] = useState({});

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
    try {
      await channel.watch();
      setSelectedChannel(channel);
      // Mark as read and refresh unread counts
      try { await channel.markRead(); } catch (_) {}
      refreshUnreadCounts();
      setUnreadMap(prev => ({ ...prev, [channel.id]: 0 }));
    } catch (err) {
      setSelectedChannel(channel);
    }
  };

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
            <View style={[styles.header, { borderBottomColor: colors.n200, paddingHorizontal: sizes.spacing.m, height: sizes.scale(68) }]}>
              <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
                <Icon name="arrow-left" size={sizes.scale(24)} color={colors.n900} />
              </TouchableOpacity>
              <Text style={[{ color: colors.n900 }, sizes.typography.h3]}>{t('chat.messages')}</Text>
              <div style={{ width: sizes.scale(24) }} />
            </View>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {channels.length === 0 ? (
                <div style={{ padding: sizes.spacing.xl, textAlign: 'center', color: colors.n500, ...getWebTypo(sizes.typography.bodyMedium) }}>
                  {t('chat.no_chats')}
                </div>
              ) : (
                channels.map(channel => {
                  const isSelected = selectedChannel?.id === channel.id;
                  const lastMessage = channel.state.messages[channel.state.messages.length - 1];
                  const otherMember = Object.values(channel.state.members).find(m => m.user_id !== chatClient.userID)?.user;
                  const unreadCount = unreadMap[channel.id] || 0;
                  const hasUnread = unreadCount > 0 && !isSelected;

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
                        {otherMember?.image ? (
                          <img src={otherMember.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        ) : (
                          <span style={{ color: colors.p500, ...getWebTypo(sizes.typography.h3), fontWeight: '700' }}>
                            {(otherMember?.name || otherMember?.id || 'U')[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Text area */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sizes.spacing.xs / 2 }}>
                          <span style={{ ...getWebTypo(sizes.typography.bodyLarge), fontWeight: '700', color: colors.n900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: sizes.spacing.xs }}>
                            {otherMember?.name || otherMember?.id || 'User'}
                          </span>
                        </div>
                        <span style={{ ...getWebTypo(sizes.typography.bodyMedium), color: hasUnread ? colors.n900 : colors.n500, fontWeight: hasUnread ? '600' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {lastMessage?.text || t('chat.no_messages')}
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
                    onHeaderClick={() => setShowInfoPanel(!showInfoPanel)}
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
                    right: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 10 
                  }}>
                    <div style={{ padding: sizes.spacing.m, borderBottom: `1px solid ${colors.n200}`, display: 'flex', alignItems: 'center', height: sizes.scale(68) }}>
                      <TouchableOpacity onPress={() => setShowInfoPanel(false)}>
                        <Icon name="x" size={sizes.scale(24)} color={colors.n900} />
                      </TouchableOpacity>
                      <span style={{ marginLeft: sizes.spacing.m, ...getWebTypo(sizes.typography.h4), color: colors.n900 }}>{t('chat.info')}</span>
                    </div>
                    
                    {(() => {
                      const otherMember = Object.values(selectedChannel.state.members).find(m => m.user_id !== chatClient.userID)?.user;
                      const pName = otherMember?.name || otherMember?.id || 'Чат';
                      const pOnline = otherMember?.online;
                      return (
                        <>
                          <div style={{ padding: `${sizes.spacing.xl}px ${sizes.spacing.m}px ${sizes.spacing.l}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: `1px solid ${colors.n200}` }}>
                            <div style={{ width: sizes.scale(96), height: sizes.scale(96), borderRadius: sizes.borderRadius.full, backgroundColor: colors.p100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: sizes.spacing.m, overflow: 'hidden' }}>
                              {otherMember?.image ? (
                                <img src={otherMember.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                              ) : (
                                <span style={{ color: colors.p500, ...getWebTypo(sizes.typography.displayS), fontWeight: '700' }}>
                                  {(pName || 'U')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span style={{ ...getWebTypo(sizes.typography.h3), textAlign: 'center', color: colors.n900 }}>{pName}</span>
                            <span style={{ ...getWebTypo(sizes.typography.bodyMedium), color: pOnline ? colors.success : colors.n500, marginTop: sizes.spacing.xs }}>
                              {pOnline ? t('chat.online') : formatLastActive(otherMember?.last_active, t)}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', padding: `${sizes.spacing.s}px 0` }}>
                            <div style={{ padding: `${sizes.spacing.m}px ${sizes.spacing.l}px`, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                              <Icon name="bell" size={sizes.scale(24)} color={colors.n500} />
                              <span style={{ marginLeft: sizes.spacing.m, ...getWebTypo(sizes.typography.bodyLarge), color: colors.n900 }}>{t('chat.notifications_on')}</span>
                            </div>
                            <div style={{ padding: `${sizes.spacing.m}px ${sizes.spacing.l}px`, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                              <Icon name="image" size={sizes.scale(24)} color={colors.n500} />
                              <span style={{ marginLeft: sizes.spacing.m, ...getWebTypo(sizes.typography.bodyLarge), color: colors.n900 }}>{t('chat.media_and_files')}</span>
                            </div>
                            <div style={{ padding: `${sizes.spacing.m}px ${sizes.spacing.l}px`, display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: 'auto' }}>
                              <Icon name="slash" size={sizes.scale(24)} color={colors.danger} />
                              <span style={{ marginLeft: sizes.spacing.m, ...getWebTypo(sizes.typography.bodyLarge), color: colors.danger }}>{t('chat.block_user')}</span>
                            </div>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
});
