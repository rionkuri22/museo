import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, Pressable, Platform as RNPlatform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ContentItem, getDynamicHeight } from '../utils/share-utils';
import { useMuseoStore } from '../store/useMuseoStore';
import { Trash2, Tag, Move } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

interface EmbedCardProps {
  item: ContentItem;
  onDelete: (id: string) => void;
  onTag: (id: string) => void;
  customWidth?: string | number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Standard mobile user agent
const MOBILE_USER_AGENT = RNPlatform.select({
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
  default: '',
});

const HEIGHT_DETECTOR_JS = `
  (function() {
    var lastHeight = 0;
    function checkHeight() {
      if (window.location.href.indexOf('pinterest') > -1) return;
      
      var container = document.getElementById('container');
      var height = 0;
      
      if (container && window.location.href.indexOf('twitter') > -1) {
        // For Twitter, report the SCALED height
        var windowWidth = window.innerWidth;
        var scale = windowWidth / 350;
        var realHeight = container.getBoundingClientRect().height;
        height = realHeight * scale;
      } else {
        height = document.body.scrollHeight || document.documentElement.scrollHeight;
      }

      if (Math.abs(height - lastHeight) > 5 && height > 50) {
        lastHeight = height;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
      }
    }
    setInterval(checkHeight, 500);
    window.addEventListener('load', checkHeight);
  })();
  true;
`;

const getWebViewSource = (item: ContentItem) => {
  switch (item.platform) {
    case 'instagram': {
      let shortcode = '';
      const pMatch = item.embedUrl.match(/\/p\/([^/?]+)/);
      const reelMatch = item.embedUrl.match(/\/reel(?:s)?\/([^/?]+)/);
      if (pMatch) shortcode = pMatch[1];
      else if (reelMatch) shortcode = reelMatch[1];
      
      return {
        html: `
          <!DOCTYPE html>
          <html><head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; background: #fafafa; overflow: hidden; }
            iframe { 
              width: 100%; 
              border: none; 
              position: absolute;
              top: 0; left: 0;
              height: 1000px; 
            }
          </style>
          </head><body>
          <iframe id="main-frame" src="https://www.instagram.com/p/${shortcode}/embed/" scrolling="no"></iframe>
          <script>
            window.addEventListener('message', function(event) {
              if (event.data.type === 'scrollTo') {
                window.scrollTo(0, event.data.y);
              }
            });
          </script>
          </body></html>
        `,
      };
    }

    case 'twitter': {
      const tweetUrl = item.embedUrl;
      return {
        html: `
          <!DOCTYPE html>
          <html><head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { 
              width: 100%; 
              background: #ffffff;
              overflow: hidden;
            }
            #container {
              width: 350px; 
              padding: 0;
              display: flex;
              justify-content: center;
              transform-origin: top left;
            }
            .twitter-tweet { margin: 0 !important; }
          </style>
          </head><body>
          <div id="container">
            <blockquote class="twitter-tweet" data-dnt="true" data-theme="light" data-width="350">
              <a href="${tweetUrl}"></a>
            </blockquote>
          </div>
          <script>
            function scaleWidget() {
              var container = document.getElementById('container');
              if (container) {
                var windowWidth = window.innerWidth;
                var scale = windowWidth / 350;
                container.style.transform = 'scale(' + scale + ')';
              }
            }
            window.addEventListener('load', scaleWidget);
            window.addEventListener('resize', scaleWidget);
            scaleWidget();
            setInterval(scaleWidget, 500);

            window.addEventListener('message', function(event) {
              if (event.data.type === 'scrollTo') {
                window.scrollTo(0, event.data.y);
              }
            });
          </script>
          <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
          </body></html>
        `,
      };
    }

    case 'pinterest':
    case 'tiktok':
    case 'linkedin':
    case 'web':
      return { 
        html: `
          <!DOCTYPE html>
          <html><head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; background: #ffffff; overflow: hidden; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
          </head><body>
          <iframe src="${item.embedUrl}" scrolling="no"></iframe>
          <script>
            window.addEventListener('message', function(event) {
              if (event.data.type === 'scrollTo') {
                window.scrollTo(0, event.data.y);
              }
            });
          </script>
          </body></html>
        `
      };

    default:
      return { uri: item.embedUrl };
  }
};

export const EmbedCard = ({ item, onDelete, onTag, customWidth }: EmbedCardProps) => {
  const { updateItem } = useMuseoStore();
  const webViewRef = useRef<WebView>(null);
  
  const [hasError, setHasError] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  
  const initialHeight = getDynamicHeight(item.platform);
  const animatedHeight = useSharedValue(initialHeight);
  const hasReceivedHeight = useRef(false);

  // Crop / Scroll Logic
  const currentScrollY = useSharedValue(item.cropY || 0);
  const startScrollY = useSharedValue(0);

  // Animation values for Move Mode visual feedback
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Initial scroll sync
    if (item.cropY) {
      const scrollScript = `window.scrollTo(0, ${item.cropY}); true;`;
      webViewRef.current?.injectJavaScript(scrollScript);
    }
  }, [item.id]);

  const onMessage = (event: WebViewMessageEvent) => {
    if (item.platform === 'pinterest') return;

    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && data.height > 50) {
        let adjustedHeight = data.height;
        if (item.platform === 'instagram') adjustedHeight = 340;
        
        if (!hasReceivedHeight.current || Math.abs(animatedHeight.value - adjustedHeight) > 10) {
          animatedHeight.value = withTiming(adjustedHeight, { duration: 300 });
          hasReceivedHeight.current = true;
        }
      }
    } catch (e) {}
  };

  const saveCrop = (y: number) => {
    updateItem(item.id, { cropY: Math.max(0, y) });
  };

  const longPressGesture = Gesture.LongPress()
    .onStart(() => {
      runOnJS(setIsMoveMode)(true);
      scale.value = withSpring(1.05);
      opacity.value = withTiming(0.8);
    })
    .minDuration(500);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startScrollY.value = currentScrollY.value;
    })
    .onUpdate((event) => {
      if (!isMoveMode) return;
      // Invert delta because dragging UP should scroll DOWN
      const newY = startScrollY.value - event.translationY;
      currentScrollY.value = Math.max(0, newY);
      
      const scrollScript = `window.scrollTo(0, ${currentScrollY.value}); true;`;
      webViewRef.current?.injectJavaScript(scrollScript);
    })
    .onEnd(() => {
      if (!isMoveMode) return;
      runOnJS(setIsMoveMode)(false);
      scale.value = withSpring(1);
      opacity.value = withTiming(1);
      runOnJS(saveCrop)(currentScrollY.value);
    })
    .enabled(isMoveMode);

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    borderWidth: isMoveMode ? 2 : 0,
    borderColor: '#007AFF',
    borderRadius: 12,
  }));

  const isSocial = ['instagram', 'twitter', 'tiktok', 'pinterest', 'linkedin'].includes(item.platform);

  const renderContent = () => {
    if (hasError && !isSocial) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Content unavailable</Text>
        </View>
      );
    }

    if (item.platform === 'youtube') {
      return (
        <YoutubePlayer
          height={animatedHeight.value}
          videoId={item.embedUrl}
          play={false}
          onError={() => setHasError(true)}
        />
      );
    }

    return (
      <WebView
        ref={webViewRef}
        source={getWebViewSource(item)}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={onMessage}
        injectedJavaScript={HEIGHT_DETECTOR_JS}
        onError={() => !isSocial && setHasError(true)}
        onHttpError={(syntheticEvent) => {
          if (syntheticEvent.nativeEvent.statusCode >= 500 && !isSocial) setHasError(true);
        }}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        userAgent={MOBILE_USER_AGENT}
        thirdPartyCookiesEnabled={true}
        originWhitelist={['*']}
      />
    );
  };

  return (
    <View style={[styles.container, customWidth ? { width: customWidth as any } : {}]}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.webviewContainer}>
            {renderContent()}

            {isMoveMode && (
              <View style={styles.moveOverlay}>
                <Move color="#FFFFFF" size={24} />
                <Text style={styles.moveText}>Dragging to Crop</Text>
              </View>
            )}

            {!isMoveMode && (
              <View style={styles.floatingActions}>
                <TouchableOpacity
                  style={styles.floatingButton}
                  onPress={() => onTag(item.id)}
                  activeOpacity={0.8}
                >
                  <Tag size={16} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.floatingButton, styles.deleteButton]}
                  onPress={() => onDelete(item.id)}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webviewContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    position: 'relative',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  moveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  moveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  floatingActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  floatingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {},
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
});
