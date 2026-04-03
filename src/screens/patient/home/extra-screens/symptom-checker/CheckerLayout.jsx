import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Icon } from '../../../../../components/ui/Icon';
import { useTheme } from '../../../../../theme/ThemeContext';
import { Screen } from '../../../../../components/ui/Screen';
import { Images } from '../../../../../assets';

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
            <Image 
              source={Images.logo} 
              style={styles(sizes, colors).logoImage}
              resizeMode="contain"
            />
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
  logoImage: {
    width: sizes.scale(100),
    height: sizes.scale(76),
  },
  backBtn: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  }
});
