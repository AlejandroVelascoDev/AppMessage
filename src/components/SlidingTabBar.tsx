import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

const TABS = 2; // número de tabs visibles

interface SlidingTabBarProps {
  activeIndex: number; // 0, 1, ...
}

export function SlidingTabBar({ activeIndex }: SlidingTabBarProps) {
  const pillX = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (barWidth === 0) return;
    const tabWidth = barWidth / TABS;
    const targetX = activeIndex * tabWidth + tabWidth / 2 - 38; // 38 = pillWidth/2

    Animated.spring(pillX, {
      toValue: targetX,
      tension: 260,
      friction: 13,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, barWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.wrapper} onLayout={handleLayout} pointerEvents="none">
      {/* Glass base */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={75}
          tint="systemChromeMaterialLight"
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* Tinte blanco */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              Platform.OS === 'ios'
                ? 'rgba(255,255,255,0.42)'
                : 'rgba(255,255,255,0.88)',
          },
        ]}
      />

      {/* Pastilla deslizante */}
      <Animated.View
        style={[styles.pill, { transform: [{ translateX: pillX }] }]}
      >
        {/* Superficie */}
        <View style={styles.pillSurface} />
        {/* Shimmer top */}
        <View style={styles.pillShimmer} />
        {/* Inner shadow bottom */}
        <View style={styles.pillInnerShadow} />
      </Animated.View>

      {/* Reflejo superior del glass */}
      <View style={styles.topReflect} />

      {/* Border exterior */}
      <View style={styles.border} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: 2,
    width: 76,
    height: 54,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pillSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
  },
  pillShimmer: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: 'rgba(255,255,255,1)',
    borderRadius: 1,
  },
  pillInnerShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  topReflect: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
});
