import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

export function HealthNotes() {
  const { sizes } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  const notes = [
    { id: 1, title: t('dashboard.health_note_1'), readTime: t('dashboard.health_note_1_desc') },
    { id: 2, title: t('dashboard.health_note_2'), readTime: t('dashboard.health_note_2_desc') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('dashboard.health_notes')}</Text>
      <View style={styles.list}>
        {notes.map(note => (
          <TouchableOpacity key={note.id} style={styles.card} activeOpacity={0.7}>
            <View style={styles.imagePlaceholder} />
            <View style={styles.textContent}>
              <Text style={styles.title} numberOfLines={2}>{note.title}</Text>
              <Text style={styles.desc}>{note.readTime}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.xl,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  list: {
    gap: theme.sizes.spacing.m,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.s,
    shadowColor: theme.colors.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imagePlaceholder: {
    width: theme.sizes.scale(80),
    height: theme.sizes.scale(80),
    borderRadius: theme.sizes.borderRadius.small,
    backgroundColor: theme.colors.n200,
    marginRight: theme.sizes.spacing.m,
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...theme.sizes.typography.bodyMedium,
    fontWeight: '600',
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.xs,
  },
  desc: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  }
});
