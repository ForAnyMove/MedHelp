import { useEffect } from 'react';
import { useStreamContext } from '../../context/Stream';
import { useComponentContext } from '../../context/GlobalContext';

/**
 * StreamEventHandler
 * 
 * Bridge between Stream real-time events and the app's data layer.
 * Uses global Stream notification events that fire WITHOUT needing to watch
 * a specific channel — so doctors receive new booking alerts instantly.
 * 
 * Add this component inside both StreamProvider AND ComponentProvider.
 */
export function StreamEventHandler() {
  const { chatClient } = useStreamContext();
  const { consultationController } = useComponentContext();

  useEffect(() => {
    if (!chatClient || !consultationController) return;

    const handleEvent = async (event) => {
      switch (event.type) {
        // Fires when the current user is added to a new channel.
        // Doctor gets this when patient creates a booking (channel is created with doctor as member).
        case 'notification.added_to_channel':
          console.log('[StreamEventHandler] New channel — refreshing consultations');
          await consultationController.loadConsultations();
          break;

        // Fires when a channel the user is a member of is deleted.
        // Patient/Doctor gets this when a booking is canceled.
        case 'notification.removed_from_channel':
        case 'channel.deleted':
          console.log('[StreamEventHandler] Channel removed — refreshing consultations');
          await consultationController.loadConsultations();
          break;

        default:
          break;
      }
    };

    const listener = chatClient.on(handleEvent);
    return () => listener.unsubscribe();
  }, [chatClient, consultationController]);

  // Renders nothing — this is a logic-only component
  return null;
}
