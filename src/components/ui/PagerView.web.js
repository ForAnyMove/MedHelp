import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { ScrollView, View, Dimensions } from 'react-native';

const PagerView = forwardRef(({ children, onPageSelected, style, initialPage = 0 }, ref) => {
  const scrollRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);
  
  useImperativeHandle(ref, () => ({
    setPage: (page) => {
      scrollRef.current?.scrollTo({ x: page * windowWidth, animated: true });
    }
  }));

  return (
    <ScrollView 
      ref={scrollRef}
      horizontal 
      pagingEnabled 
      showsHorizontalScrollIndicator={false}
      style={style}
      onMomentumScrollEnd={(e) => {
        const offset = e.nativeEvent.contentOffset.x;
        const width = e.nativeEvent.layoutMeasurement.width || windowWidth;
        const page = Math.round(offset / width);
        if (onPageSelected) {
          onPageSelected({ nativeEvent: { position: page } });
        }
      }}
    >
      {React.Children.map(children, child => (
        <View style={{ width: windowWidth, height: '100%' }}>
          {child}
        </View>
      ))}
    </ScrollView>
  );
});

export default PagerView;
