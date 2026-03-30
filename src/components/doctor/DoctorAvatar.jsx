import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export function DoctorAvatar({ url, firstName, lastName, size = 100 }) {
  const { colors, sizes } = useTheme();

  const getInitials = () => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    
    if (f && l) return `${f}.${l}.`;
    if (f) return `${f}.`;
    if (l) return `${l}.`;
    return '';
  };

  const initials = getInitials();

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {url ? (
        <Image 
          source={{ uri: url }} 
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} 
        />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.p200, width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.35, color: colors.p500 }]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: 'Manrope_600SemiBold',
  }
});
