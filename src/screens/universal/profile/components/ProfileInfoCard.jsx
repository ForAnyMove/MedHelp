import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';

export function ProfileInfoCard({ user }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.card}>
      <InfoRow label={t('profile.phone_number')} value={user.phone} isFirst />
      <InfoRow label={t('profile.dob')} value={user.dob} />
      <InfoRow label={t('profile.gender')} value={user.gender} />
      <InfoRow label={t('profile.height_weight')} value={`${user.height} / ${user.weight}`} />
      <InfoRow label={t('profile.blood_type')} value={user.bloodType} />
    </View>
  );
}

const InfoRow = ({ label, value, isFirst }) => {
  const styles = useStyles(themeStyles);
  return (
    <View style={styles.rowWrapper}>
      {!isFirst && <View style={styles.divider} />}
      <View style={styles.row}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
};

const themeStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginHorizontal: theme.sizes.spacing.m,
    marginTop: -theme.sizes.scale(40), // Overlap with header as per mockup
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    zIndex: 10,
  },
  rowWrapper: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.n200,
    marginVertical: theme.sizes.scale(10),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...theme.sizes.typography.bodyLarge,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n500,
  },
  value: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
  },
});
