import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../../../context/SessionContext';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { createApiClient } from '../../../../api/apiClient';
import { createConsultationsApi } from '../../../../api/consultationsApi';

export function PatientConsultationRate({ booking, onSkip, onSubmit }) {
  const { t } = useTranslation();
  const { session, refreshSessionToken } = useSession();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const api = createApiClient(session, refreshSessionToken);
      const consultApi = createConsultationsApi(api);
      await consultApi.submitRating(booking.id, { rating, comment });
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setSubmitting(false);
      if (onSubmit) onSubmit(booking);
    }
  };

  const doctorName = booking?.doctorName || (booking?.doctor?.profile?.first_name 
    ? `${booking.doctor.profile.first_name} ${booking.doctor.profile.last_name}` 
    : 'Doctor');

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Icon 
              name="rate-star" 
              size={sizes.scale(32)} 
              color={star <= rating ? colors.warning : colors.n300}
              fill={star <= rating ? colors.warning : 'transparent'} 
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SubViewScreen title={t('consultation.rating_title', 'Consultation')} hideHeader>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onSkip} style={styles.closeButton}>
            <Icon name="x" size={sizes.scale(24)} color={colors.p500} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Avatar Icon */}
          <View style={styles.iconContainer}>
            <Text style={{ fontSize: sizes.scale(40) }}>🤩</Text>
          </View>

          <Text style={styles.title}>{t('consultation.how_was_consultation', 'How was your consultation?')}</Text>
          <Text style={styles.subtitle}>
            {t('consultation.feedback_helps', 'Your feedback helps other patients\nchoose the right doctor.')}
          </Text>

          {/* Doctor Info Card */}
          <View style={styles.doctorCard}>
            <View style={styles.avatar}>
               <Icon name="user" size={sizes.scale(32)} color={colors.white} />
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dr. {doctorName}</Text>
              <Text style={styles.doctorSpecialty}>{booking?.doctorSpecialty || t('consultation.general_practitioner', 'General Practitioner')}</Text>
            </View>
          </View>

          {/* Rating Card */}
          <View style={styles.rateCard}>
            <View style={styles.rateHeader}>
              <Icon name="bookmark" size={sizes.scale(24)} color={colors.warning} />
              <View style={styles.rateTexts}>
                <Text style={styles.rateTitle}>{t('consultation.rate_this', 'Rate this consultation')}</Text>
                <Text style={styles.rateSub}>{t('consultation.help_others', 'Help others by sharing your experience')}</Text>
              </View>
            </View>

            {renderStars()}

            <View style={styles.commentBox}>
              <TextInput
                style={styles.commentInput}
                placeholder={t('consultation.leave_comment', 'Leave a comment (optional)')}
                placeholderTextColor={colors.n400}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
                maxLength={100}
              />
              <Text style={styles.charCount}>{comment.length}/100</Text>
            </View>

            <Button 
              title={t('consultation.submit_rating', 'Submit rating')} 
              variant={rating > 0 ? 'primary' : 'outlined'} 
              onPress={handleSubmit} 
              style={styles.submitButton}
              textStyle={rating > 0 ? {} : { color: colors.warning }}
              loading={submitting}
              disabled={submitting || rating === 0}
            />
          </View>

          <TouchableOpacity onPress={onSkip} style={styles.skipButtonContainer}>
            <Text style={styles.skipButtonText}>{t('consultation.skip_for_now', 'Skip for now')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
  },
  closeButton: {
    padding: theme.sizes.spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: theme.sizes.scale(80),
    height: theme.sizes.scale(80),
    borderRadius: theme.sizes.scale(40),
    backgroundColor: theme.colors.p50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xs,
  },
  subtitle: {
    ...theme.sizes.typography.body,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.l,
    lineHeight: theme.sizes.scale(20),
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    width: '100%',
    marginBottom: theme.sizes.spacing.l,
    shadowColor: theme.colors.n900,
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: theme.sizes.scale(48),
    height: theme.sizes.scale(48),
    borderRadius: theme.sizes.scale(24),
    backgroundColor: theme.colors.p500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.scale(2),
  },
  doctorSpecialty: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  rateCard: {
    backgroundColor: theme.colors.warning + '11',
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    width: '100%',
    marginBottom: theme.sizes.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  rateTexts: {
    marginLeft: theme.sizes.spacing.s,
    flex: 1,
  },
  rateTitle: {
    ...theme.sizes.typography.bodyMedium,
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.warning,
  },
  rateSub: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
    gap: theme.sizes.spacing.s,
  },
  starButton: {
    padding: theme.sizes.spacing.xs,
  },
  commentBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  commentInput: {
    ...theme.sizes.typography.body,
    color: theme.colors.n900,
    minHeight: theme.sizes.scale(60),
    textAlignVertical: 'top',
  },
  charCount: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    textAlign: 'right',
    marginTop: theme.sizes.spacing.xs,
  },
  submitButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.warning,
    borderWidth: 1,
  },
  skipButtonContainer: {
    padding: theme.sizes.spacing.m,
  },
  skipButtonText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
    textDecorationLine: 'underline',
  }
});
