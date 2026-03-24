import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import LogoSvg from '../../../../assets/logo.svg';
import { useTheme } from '../../../theme/ThemeContext';
import { Screen } from '../../../components/ui/Screen';

export function CheckerLayout({ children, onBack, title, style, hideLogo }) {
  const { sizes, colors } = useTheme();
  
  return (
    <Screen style={[{ backgroundColor: colors.bg, flex: 1 }, style]}>
      <View style={styles(sizes, colors).header}>
        <TouchableOpacity 
          style={styles(sizes, colors).backBtn} 
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{top: 15, bottom:15, left:15, right:15}}
        >
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
        
        {!hideLogo && (
          <View style={styles(sizes, colors).logoWrapper}>
            <LogoSvg width={sizes.scale(64)} height={sizes.scale(48)} />
          </View>
        )}
      </View>
      <View style={{flex: 1}}>
        {children}
      </View>
    </Screen>
  );
}

const styles = (sizes, colors) => StyleSheet.create({
  header: {
    paddingHorizontal: sizes.spacing.l,
    paddingTop: sizes.spacing.m,
    paddingBottom: sizes.spacing.l,
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: sizes.spacing.m,
  },
  backBtn: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  }
});
