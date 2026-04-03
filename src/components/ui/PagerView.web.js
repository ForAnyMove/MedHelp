import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Dimensions } from 'react-native';

const PagerView = forwardRef(({ children, onPageSelected, style, initialPage = 0 }, ref) => {
  const scrollRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const currentPageRef = useRef(initialPage);
  const scrollTimeout = useRef(null);

  useImperativeHandle(ref, () => ({
    setPage: (page) => {
      if (containerWidth > 0) {
        currentPageRef.current = page;
        scrollRef.current?.scrollTo({ x: page * containerWidth, animated: true });
      }
    }
  }));

  const handleLayout = (e) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handleScroll = useCallback((e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const width = e.nativeEvent.layoutMeasurement?.width || containerWidth;
    if (width <= 0) return;

    // Debounce: wait for scroll to settle
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const page = Math.round(offset / width);
      if (page !== currentPageRef.current) {
        currentPageRef.current = page;
        if (onPageSelected) {
          onPageSelected({ nativeEvent: { position: page } });
        }
      }
    }, 50);
  }, [containerWidth, onPageSelected]);

  return (
    <View style={[{ flex: 1 }, style]} onLayout={handleLayout}>
      <ScrollView 
        ref={scrollRef}
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={(e) => {
          const offset = e.nativeEvent.contentOffset.x;
          const width = e.nativeEvent.layoutMeasurement?.width || containerWidth;
          if (width > 0) {
            const page = Math.round(offset / width);
            if (page !== currentPageRef.current) {
              currentPageRef.current = page;
              if (onPageSelected) {
                onPageSelected({ nativeEvent: { position: page } });
              }
            }
          }
        }}
      >
        {React.Children.map(children, child => (
          <View style={{ width: containerWidth || Dimensions.get('window').width, height: '100%' }}>
            {child}
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

export default PagerView;

