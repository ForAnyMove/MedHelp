import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../src/context/SessionContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { createApiClient } from '../../src/api/apiClient';
import { createConsultationsApi } from '../../src/api/consultationsApi';

export default function RateConsultationScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const { session, refreshSessionToken } = useSession();
    const { colors, sizes } = useTheme();
    const styles = useStyles(themeStyles);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [consultation, setConsultation] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (!id || !session) return;
        let isMounted = true;

        const fetchConsultation = async () => {
            try {
                const api = createApiClient(session, refreshSessionToken);
                const consultApi = createConsultationsApi(api);
                const data = await consultApi.getById(id);
                if (isMounted) {
                    setConsultation(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to fetch consultation for rating:', err);
                if (isMounted) {
                    Alert.alert(t('common.error'), t('common.something_went_wrong'));
                    router.back();
                }
            }
        };

        fetchConsultation();
        return () => { isMounted = false; };
    }, [id, session]);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert(t('common.error'), 'Please select a rating.');
            return;
        }

        setSubmitting(true);
        try {
            const api = createApiClient(session, refreshSessionToken);
            const consultApi = createConsultationsApi(api);
            await consultApi.submitRating(id, { rating, comment });
            
            // Go back to the consultation tab
            router.back();
        } catch (err) {
            console.error('Failed to submit rating:', err);
            Alert.alert(t('common.error'), 'Could not submit your review. You might have already rated this consultation.');
            router.back();
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Screen style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.p500} />
            </Screen>
        );
    }

    const doctorName = consultation?.doctorName || consultation?.doctor?.profile?.first_name 
        ? `${consultation.doctor.profile.first_name} ${consultation.doctor.profile.last_name}` 
        : 'Doctor';

    return (
        <Screen style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Icon name="x" size={sizes.scale(24)} color={colors.n700} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.iconContainer}>
                        <Icon name="star" size={sizes.scale(48)} color={colors.warning} />
                    </View>

                    <Text style={styles.title}>How was your consultation?</Text>
                    <Text style={styles.subtitle}>
                        Please rate your experience with {doctorName}. Your feedback helps us improve our service.
                    </Text>

                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                style={styles.starButton}
                                activeOpacity={0.7}
                            >
                                <Icon 
                                    name="star" 
                                    size={sizes.scale(40)} 
                                    color={star <= rating ? colors.warning : colors.n300} 
                                    fill={star <= rating ? colors.warning : 'none'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Leave a comment (Optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Write your feedback here..."
                            placeholderTextColor={colors.n400}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={comment}
                            onChangeText={setComment}
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>{comment.length}/500</Text>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Button 
                        title="Skip" 
                        variant="outlined" 
                        onPress={() => router.back()} 
                        style={styles.skipButton} 
                    />
                    <Button 
                        title="Submit Review" 
                        variant="primary" 
                        onPress={handleSubmit} 
                        style={styles.submitButton}
                        loading={submitting}
                        disabled={submitting || rating === 0}
                    />
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const themeStyles = (theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: theme.sizes.spacing.m,
        paddingTop: theme.sizes.spacing.m,
        paddingBottom: theme.sizes.spacing.s,
    },
    closeButton: {
        padding: theme.sizes.spacing.xs,
        backgroundColor: theme.colors.n100,
        borderRadius: theme.sizes.borderRadius.full,
    },
    scrollContent: {
        paddingHorizontal: theme.sizes.spacing.xl,
        paddingBottom: theme.sizes.spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        width: theme.sizes.scale(80),
        height: theme.sizes.scale(80),
        borderRadius: theme.sizes.scale(40),
        backgroundColor: theme.colors.warning + '1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.sizes.spacing.xl,
        marginTop: theme.sizes.spacing.l,
    },
    title: {
        ...theme.sizes.typography.h2,
        color: theme.colors.n900,
        fontFamily: 'Manrope_700Bold',
        textAlign: 'center',
        marginBottom: theme.sizes.spacing.s,
    },
    subtitle: {
        ...theme.sizes.typography.body,
        color: theme.colors.n500,
        textAlign: 'center',
        marginBottom: theme.sizes.spacing.xxl,
        lineHeight: 24,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.sizes.spacing.xxl,
        gap: theme.sizes.spacing.m,
    },
    starButton: {
        padding: theme.sizes.spacing.xs,
    },
    inputContainer: {
        width: '100%',
    },
    inputLabel: {
        ...theme.sizes.typography.bodyMedium,
        fontFamily: 'Manrope_600SemiBold',
        color: theme.colors.n700,
        marginBottom: theme.sizes.spacing.s,
    },
    textInput: {
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.n200,
        borderRadius: theme.sizes.borderRadius.large,
        padding: theme.sizes.spacing.m,
        ...theme.sizes.typography.body,
        color: theme.colors.n900,
        fontFamily: 'Manrope_400Regular',
        height: theme.sizes.scale(120),
    },
    charCount: {
        ...theme.sizes.typography.caption,
        color: theme.colors.n400,
        textAlign: 'right',
        marginTop: theme.sizes.spacing.xs,
    },
    footer: {
        flexDirection: 'row',
        padding: theme.sizes.spacing.m,
        paddingBottom: theme.sizes.spacing.xl,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.n200,
        gap: theme.sizes.spacing.m,
    },
    skipButton: {
        flex: 1,
    },
    submitButton: {
        flex: 2,
    }
});
