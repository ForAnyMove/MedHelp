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
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
};

const themeStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 32,
    padding: theme.sizes.spacing.l,
    marginHorizontal: theme.sizes.spacing.l,
    marginTop: -40, // Overlap with header as per mockup
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
    backgroundColor: '#F3F9F9',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...theme.sizes.typography.body,
    color: '#B0BCBC',
    fontWeight: '500',
  },
  value: {
    ...theme.sizes.typography.body,
    color: '#2D4A4A',
    fontWeight: '700',
  },
});
