import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Network from 'expo-network';
import { WifiOff } from 'lucide-react-native';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const checkStatus = async () => {
      const status = await Network.getNetworkStateAsync();
      const offline = !status.isConnected || !status.isInternetReachable;
      setIsOffline(offline);
      
      Animated.timing(fadeAnim, {
        toValue: offline ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    const interval = setInterval(checkStatus, 3000);
    checkStatus();

    return () => clearInterval(interval);
  }, [fadeAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <WifiOff size={16} color="#FFFFFF" strokeWidth={2.5} />
      <Text style={styles.text}>No Connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
