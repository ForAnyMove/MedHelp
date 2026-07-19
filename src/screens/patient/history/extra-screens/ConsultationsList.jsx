import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';

export function ConsultationsList() {
    const { t } = useTranslation();
    const { themeController: { colors, sizes }, historyController: { goBack } } = useComponentContext();
    const styles = useStyles(themeStyles);

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backButton}>
                        <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.title}>{t('history.consultations_list.title')}</Text>
            </ScrollView>
        </View>
    );
}

const themeStyles = (theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    scrollContent: {
        paddingHorizontal: theme.sizes.spacing.m,
        paddingTop: theme.sizes.spacing.m,
        paddingBottom: theme.sizes.spacing.s,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.sizes.spacing.s,
    },
    backButton: {
        marginRight: theme.sizes.spacing.m,
    },
    title: {
        ...theme.sizes.typography.h3,
        color: theme.colors.n700,
        marginBottom: theme.sizes.spacing.s,
    },
});