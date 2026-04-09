import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';

export function OngoingConsultation({ consultation, onEndConsultation }) {
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const [notes, setNotes] = React.useState('');
  const [timer, setTimer] = React.useState(70); // 00:01:10

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => n.toString().padStart(2, '0');

    return [
      pad(hours)[0], pad(hours)[1],
      pad(minutes)[0], pad(minutes)[1],
      pad(seconds)[0], pad(seconds)[1]
    ];
  };

  const digits = formatTimer(timer);

  return (
    <SubViewScreen title={t('consultation.title')}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} style={{ flex: 1 }}>
          <View style={styles.unifiedBadge}>
            <View style={styles.unifiedSection}>
              <Icon name="profile" size={sizes.scale(24)} color={colors.sBlue} wrapperStyle={styles.iconCircle} wrapped />
              <Text style={styles.patientName}>{consultation.patient.firstName} {consultation.patient.lastName}</Text>
            </View>
            <View style={styles.unifiedDivider} />
            <View style={styles.unifiedSection}>
              <Icon name="time" size={sizes.scale(24)} color={colors.sPink} wrapperStyle={[styles.iconCircle]} wrapped />
              <Text style={styles.patientName}>{consultation.time}</Text>
            </View>
          </View>

          <View style={styles.actionGrid}>
            <View style={styles.row}>
              <TouchableOpacity style={styles.actionCard}>
                <Icon name="chat" size={sizes.scale(24)} color={colors.sCoral} wrapperStyle={[styles.actionIcon]} wrapped />
                <Text style={styles.actionText}>{t('actions.chat')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Icon name="video" size={sizes.scale(24)} color={colors.p500} wrapperStyle={[styles.actionIcon]} wrapped />
                <Text style={styles.actionText}>{t('actions.video')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={styles.actionCard}>
                <Icon name="medical-document" size={sizes.scale(24)} color={colors.sYell} wrapperStyle={[styles.actionIcon]} wrapped />
                <Text style={styles.actionText}>{t('actions.files')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Icon name="message" size={sizes.scale(24)} color={colors.sBlue} wrapperStyle={[styles.actionIcon]} wrapped />
                <Text style={styles.actionText}>{t('actions.messages')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timerBlock}>
            <View style={styles.timerHeader}>
              <Icon name="timer" size={sizes.scale(24)} color={colors.sPink} wrapperStyle={styles.timerIconBox} wrapped />
              <Text style={styles.timerTitle}>{t('consultation.timer')}</Text>
            </View>
            <View style={styles.timerDivider} />
            <View style={styles.timerGrid}>
              <View style={styles.digitBox}><Text style={styles.digit}>{digits[0]}</Text></View>
              <View style={styles.digitBox}><Text style={styles.digit}>{digits[1]}</Text></View>
              <Text style={styles.colon}>:</Text>
              <View style={styles.digitBox}><Text style={styles.digit}>{digits[2]}</Text></View>
              <View style={styles.digitBox}><Text style={styles.digit}>{digits[3]}</Text></View>
              <Text style={styles.colon}>:</Text>
              <View style={styles.digitBox}><Text style={styles.digit}>{digits[4]}</Text></View>
              <View style={styles.digitBox}><Text style={styles.digit}>{digits[5]}</Text></View>
            </View>
          </View>

          <View style={styles.notesBlock}>
            <Text style={styles.blockTitle}>{t('doctor_consultation.private_notes')}</Text>
            <View style={styles.notesInputContainer}>
              <View style={styles.notesInputHeader}>
                <Text style={styles.notesLabel}>{t('doctor_consultation.important_notes')}</Text>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  placeholder={t('doctor_consultation.notes_placeholder')}
                  value={notes}
                  onChangeText={setNotes}
                  maxLength={800}
                />
              </View>
              <Text style={styles.charCount}>{notes.length}/800</Text>
            </View>
          </View>

          <View style={styles.recordingTextContainer}>
            <Text style={styles.recordingText}>{t('consultation.recording')}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onEndConsultation}
            hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}
            style={styles.endButton}
            activeOpacity={0.7}
          >
            <View style={styles.endTextContainer}>
              <Text style={styles.endText}>{t('consultation.end_btn')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingBottom: theme.sizes.spacing.l,
  },
  unifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: theme.sizes.spacing.m,
  },
  unifiedSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.spacing.l,
  },
  unifiedDivider: {
    width: 1,
    height: '80%',
    backgroundColor: theme.colors.n200,
    marginHorizontal: theme.sizes.spacing.m,
  },
  iconCircle: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  patientName: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
  },
  actionGrid: {
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  row: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.l,
    paddingHorizontal: theme.sizes.spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  actionIcon: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    marginRight: theme.sizes.spacing.s,
  },
  actionText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
  },
  timerBlock: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
    alignItems: 'stretch',
    marginBottom: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  timerIconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
  },
  timerTitle: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
    marginLeft: theme.sizes.spacing.s,
  },
  timerDivider: {
    height: 1,
    backgroundColor: theme.colors.n200,
    marginBottom: theme.sizes.spacing.m,
  },
  timerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  digitBox: {
    width: theme.sizes.scale(24),
    height: theme.sizes.scale(32),
    backgroundColor: theme.colors.bg,
    borderRadius: theme.sizes.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.n300,
    marginHorizontal: theme.sizes.scale(2),
  },
  digit: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  colon: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  notesBlock: {
    marginBottom: theme.sizes.spacing.xs,
  },
  blockTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  notesInputContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.s,
    borderRadius: theme.sizes.borderRadius.large,
  },
  notesInputHeader: {
    borderRadius: theme.sizes.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.n300,
    paddingVertical: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xs,
  },
  notesLabel: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
  },
  notesInput: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    minHeight: theme.sizes.scale(80),
    textAlignVertical: 'top',
  },
  charCount: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    alignSelf: 'flex-end',
    marginTop: theme.sizes.spacing.xs,
    paddingRight: theme.sizes.spacing.m,
  },
  recordingTextContainer: {
    alignSelf: 'center',
    marginTop: theme.sizes.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n500,
  },
  recordingText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
    lineHeight: theme.sizes.scale(12),
  },
  footer: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.s,
    paddingTop: theme.sizes.spacing.m,
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
  },
  endButton: {
    padding: theme.sizes.spacing.m,
  },
  endTextContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.p500,
  },
  endText: {
    ...theme.sizes.typography.h3,
    lineHeight: theme.sizes.scale(16),
    color: theme.colors.p500,
  }
});
