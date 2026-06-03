import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const AnimatedIcon = ({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.12 : 1,
        tension: focused ? 320 : 200,
        friction: focused ? 10 : 14,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -1.5 : 0,
        tension: 300,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: focused ? 1 : 0.4,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          transform: [{ scale }, { translateY }],
          opacity: iconOpacity,
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 68,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedIcon;
