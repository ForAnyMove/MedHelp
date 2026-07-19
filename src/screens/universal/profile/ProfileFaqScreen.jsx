import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../components/ui/Screen';
import { Icon } from '../../../components/ui/Icon';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';
import { useComponentContext } from '../../../context/GlobalContext';

export function ProfileFaqScreen({ onBack }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { legalController } = useComponentContext();
  
  const faqList = legalController?.content?.faq || [];
  
  // Keep track of which items are expanded
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.faq', 'FAQ')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {faqList.map((item, index) => {
          const isExpanded = expandedItems[item.id];
          return (
            <View key={item.id} style={styles.faqCard}>
              <TouchableOpacity 
                style={styles.faqHeader} 
                activeOpacity={0.7}
                onPress={() => toggleItem(item.id)}
              >
                <Text style={styles.questionText}>{item.question}</Text>
                <Icon 
                  name={isExpanded ? "close" : "add"} 
                  size={sizes.scale(20)} 
                  color={colors.p500} 
                />
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.m,
    backgroundColor: /* TODO: color */ '#FAFAFA', // Light background as in mockup
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.sizes.scale(40),
    marginBottom: theme.sizes.scale(24),
  },
  backButton: {
    padding: theme.sizes.spacing.xs,
    marginRight: theme.sizes.spacing.s,
  },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  scrollContent: {
    paddingBottom: theme.sizes.scale(100),
  },
  faqCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.sizes.spacing.m,
  },
  questionText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    flex: 1,
    paddingRight: theme.sizes.spacing.s,
  },
  answerContainer: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.m,
  },
  answerText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    lineHeight: theme.sizes.scale(20),
  }
});
