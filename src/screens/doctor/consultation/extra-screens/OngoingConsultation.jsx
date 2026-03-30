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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.unifiedBadge}>
          <View style={styles.unifiedSection}>
            <View style={styles.iconCircle}>
              <Icon name="User" size={16} color={colors.p500} />
            </View>
            <Text style={styles.patientName}>{consultation.patient.firstName} {consultation.patient.lastName}</Text>
          </View>
          <View style={styles.unifiedDivider} />
          <View style={styles.unifiedSection}>
             <View style={[styles.iconCircle, { backgroundColor: '#FFF0F0' }]}>
               <Icon name="Clock" size={16} color={colors.danger} />
             </View>
            <Text style={styles.patientName}>{consultation.time}</Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <View style={styles.row}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF0F0' }]}>
                 <Icon name="MessageSquare" size={24} color={colors.danger} />
              </View>
              <Text style={styles.actionText}>{t('actions.chat')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}>
                 <Icon name="Video" size={24} color="#7EBFFF" />
              </View>
              <Text style={styles.actionText}>{t('actions.video')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF9F0' }]}>
                 <Icon name="FileText" size={24} color="#FFC87E" />
              </View>
              <Text style={styles.actionText}>{t('actions.files')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0EEFF' }]}>
                 <Icon name="Mail" size={24} color="#8E7EFF" />
              </View>
              <Text style={styles.actionText}>{t('actions.messages')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.timerBlock}>
           <View style={styles.timerHeader}>
             <View style={styles.timerIconBox}>
               <Icon name="Clock" size={16} color={colors.danger} />
             </View>
             <Text style={styles.timerTitle}>{t('common.timer')}</Text>
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
              <Text style={styles.notesLabel}>{t('doctor_consultation.important_notes')}</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                placeholder={t('doctor_consultation.notes_placeholder')}
                value={notes}
                onChangeText={setNotes}
                maxLength={800}
              />
              <Text style={styles.charCount}>{notes.length}/800</Text>
           </View>
        </View>

        <TouchableOpacity style={styles.endButton} onPress={onEndConsultation}>
           <Text style={styles.endButtonText}>{t('consultation.end_btn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl,
  },
  unifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    paddingVertical: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: theme.sizes.spacing.xl,
  },
  unifiedSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unifiedDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.n100,
    marginHorizontal: theme.sizes.spacing.m,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F9F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  patientName: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    fontWeight: '700',
  },
  actionGrid: {
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  actionText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    fontWeight: '700',
  },
  timerBlock: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: theme.sizes.spacing.l,
    alignItems: 'stretch',
    marginBottom: theme.sizes.spacing.xl,
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
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTitle: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n900,
    fontWeight: '700',
    marginLeft: 8,
  },
  timerDivider: {
    height: 1,
    backgroundColor: theme.colors.n100,
    marginBottom: theme.sizes.spacing.l,
  },
  timerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  digitBox: {
    width: 32,
    height: 42,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EBED',
  },
  digit: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  colon: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontWeight: '700',
    marginHorizontal: 2,
  },
  notesBlock: {
    marginBottom: theme.sizes.spacing.xl,
  },
  blockTitle: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.l,
  },
  notesInputContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D3D9DE', 
    padding: theme.sizes.spacing.l,
  },
  notesLabel: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n300,
    marginBottom: 8,
  },
  notesInput: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    ...theme.sizes.typography.caption,
    fontSize: 10,
    color: theme.colors.n300,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  endButton: {
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.m,
  },
  endButtonText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.p400,
    fontFamily: 'Manrope_700Bold',
    textDecorationLine: 'underline',
  }
});
