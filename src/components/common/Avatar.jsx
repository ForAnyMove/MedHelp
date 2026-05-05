import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export function Avatar({ 
  source, 
  firstName = '', 
  lastName = '', 
  size = 40, 
  style 
}) {
  const { colors, sizes } = useTheme();

  const containerStyle = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
      backgroundColor: colors.p100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    style
  ];

  if (source && source.uri) {
    return (
      <View style={containerStyle}>
        <Image 
          source={source} 
          style={{ width: '100%', height: '100%' }} 
          resizeMode="cover"
        />
      </View>
    );
  }

  // Fallback: Initials
  const f = firstName?.charAt(0) || '';
  const l = lastName?.charAt(0) || '';
  const initials = (f + l).toUpperCase() || '?';
  
  // Font size relative to avatar size
  const fontSize = size * 0.4;

  return (
    <View style={containerStyle}>
      <Text style={{ 
        color: colors.p500, 
        fontSize, 
        fontWeight: '700',
        fontFamily: 'Manrope_700Bold'
      }}>
        {initials}
      </Text>
    </View>
  );
}
