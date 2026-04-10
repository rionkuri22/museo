import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  Dimensions, Platform as RNPlatform,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ContentItem, getDynamicHeight } from '../utils/share-utils';
import { Trash2, Tag, Move } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface EmbedCardProps {
  item: ContentItem;
  onDelete: (id: string) => void;
  onTag: (id: string) => void;
  customWidth?: string | number;
  isDragging?: boolean;
  isDropTarget?: boolean;
  isEditMode?: boolean;
  onDragStart?: (id: string, pageY: number, pageX: number, w: number, h: number) => void;
  onDragMove?: (id: string, absoluteY: number) => void;
  onDragEnd?: (id: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOBILE_USER_AGENT = RNPlatform.select({
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
  default: '',
});

const HEIGHT_DETECTOR_JS = `
  (function() {
    if (document.body) document.body.style.height = 'auto';
    if (document.documentElement) document.documentElement.style.height = 'auto';

    var lastHeight = 0;
    var checks = 0;

    function checkHeight() {
      if (window.location.href.indexOf('pinterest') > -1) return;

      var height = Math.max(
        document.body ? document.body.scrollHeight : 0,
        document.documentElement ? document.documentElement.scrollHeight : 0,
        document.body ? document.body.offsetHeight : 0
      );

      if (height > 50 && Math.abs(height - lastHeight) > 4) {
        lastHeight = height;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
      }

      if (checks < 10) {
        checks++;
        setTimeout(checkHeight, 400);
      }
    }

    window.addEventListener('load', checkHeight);
    setInterval(checkHeight, 1200);
    checkHeight();
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
          <!DOCTYPE html><html><head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>* { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: #fafafa; overflow: hidden; }
          iframe { width: 100%; border: none; position: absolute; top: 0; left: 0; height: 1000px; }</style>
          </head><body>
          <iframe src="https://www.instagram.com/p/${shortcode}/embed/" scrolling="no"></iframe>
          </body></html>
        `,
      };
    }

    case 'twitter': {
      const tweetUrl = item.embedUrl;
      return {
        html: `
          <!DOCTYPE html><html><head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>* { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; background: #fff; overflow: hidden; height: auto !important; }
          .twitter-tweet { margin: 0 !important; }</style>
          </head><body>
          <blockquote class="twitter-tweet" data-dnt="true" data-theme="light">
            <a href="${tweetUrl}"></a>
          </blockquote>
          <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
          </body></html>
        `,
      };
    }

    case 'pinterest':
      return { uri: item.embedUrl };

    case 'tiktok': {
      // TikTok embed via their official blockquote + script (same approach as Twitter).
      // The embed URL stored is the full original TikTok URL.
      const tiktokUrl = item.url; // original share URL
      // Extract video ID from the embed URL like https://www.tiktok.com/embed/v2/{id}
      const idMatch = item.embedUrl.match(/embed\/v2\/(\d+)/);
      const videoId = idMatch ? idMatch[1] : '';
      if (videoId) {
        return {
          html: `
            <!DOCTYPE html><html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>* { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
            iframe { width: 100%; height: 100%; border: none; display: block; }</style>
            </head><body>
            <iframe src="https://www.tiktok.com/embed/v2/${videoId}" 
              allow="encrypted-media;" allowfullscreen
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-top-navigation-by-user-activation allow-same-origin"
            ></iframe>
            </body></html>
          `,
        };
      }
      // Fallback: direct URI
      return { uri: item.embedUrl };
    }

    case 'spotify':
      // Spotify provides its own responsive embed — load it directly, no wrapper needed.
      return { uri: item.embedUrl };

    default:
      return {
        html: `
          <!DOCTYPE html><html><head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>* { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: #fff; overflow: hidden; }
          iframe { width: 100%; height: 100%; border: none; }</style>
          </head><body>
          <iframe src="${item.embedUrl}" scrolling="no"></iframe>
          </body></html>
        `,
      };
  }
};

export const EmbedCard = ({
  item, onDelete, onTag, customWidth,
  isDragging = false, isDropTarget = false, isEditMode = false,
  onDragStart, onDragMove, onDragEnd,
}: EmbedCardProps) => {
  const webViewRef = useRef<WebView>(null);
  const dragHandleRef = useRef<View>(null);
  const [hasError, setHasError] = useState(false);

  const initialHeight = getDynamicHeight(item.platform);
  const animatedHeight = useSharedValue(initialHeight);
  const hasReceivedHeight = useRef(false);

  // Shared values for gesture (UI thread)
  const dragStartPageY = useSharedValue(0);
  const dragStartPageX = useSharedValue(0);
  const previewedCardH = useSharedValue(initialHeight);

  useEffect(() => {
    previewedCardH.value = animatedHeight.value;
  }, [animatedHeight.value]);

  const onMessage = (event: WebViewMessageEvent) => {
    // Platforms with fixed or iframe-controlled heights — skip dynamic detection
    if (['pinterest', 'spotify', 'tiktok'].includes(item.platform)) return;
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && data.height > 50) {
        let h = data.height;
        if (item.platform === 'instagram') h = 340;
        if (!hasReceivedHeight.current || Math.abs(animatedHeight.value - h) > 6) {
          animatedHeight.value = withTiming(h, { duration: 300 });
          previewedCardH.value = h;
          hasReceivedHeight.current = true;
        }
      }
    } catch (e) {}
  };

  // —— Drag Gesture —— 
  // Gesture.LongPress activates drag; Gesture.Pan tracks the movement.
  // Both run simultaneously so the pan captures movement immediately after long-press fires.
  const notifyDragStart = (id: string, py: number, px: number, w: number, h: number) => {
    onDragStart?.(id, py, px, w, h);
  };
  const notifyDragMove = (id: string, absY: number) => {
    onDragMove?.(id, absY);
  };
  const notifyDragEnd = (id: string) => {
    onDragEnd?.(id);
  };

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart((e) => {
      // Measure the card's page position on the UI thread
      // absoluteY is the finger's absolute Y. Estimate card top.
      const estimatedCardTop = e.absoluteY - previewedCardH.value / 2;
      dragStartPageY.value = estimatedCardTop;
      dragStartPageX.value = 0;
      runOnJS(notifyDragStart)(item.id, estimatedCardTop, 0, SCREEN_WIDTH - 8, previewedCardH.value);
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      runOnJS(notifyDragMove)(item.id, e.absoluteY);
    })
    .onEnd(() => {
      runOnJS(notifyDragEnd)(item.id);
    })
    .minDistance(0);

  const combinedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  // —— Animated styles —— 
  const cardAnimStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    opacity: isDragging ? 0.35 : 1,
    transform: [{ scale: isDragging ? 0.97 : 1 }],
    borderWidth: isDropTarget ? 2 : 0,
    borderColor: isDropTarget ? '#007AFF' : 'transparent',
    borderRadius: 12,
  }));

  const overlayAnimStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDragging ? 'rgba(0,122,255,0.08)' : 'rgba(0,0,0,0.0)',
    zIndex: 10,
  }));

  const isSocial = ['instagram', 'twitter', 'tiktok', 'pinterest', 'linkedin', 'spotify'].includes(item.platform);

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
        <View pointerEvents={isEditMode ? 'none' : 'auto'}>
          <YoutubePlayer
            height={animatedHeight.value}
            videoId={item.embedUrl}
            play={false}
            onError={() => setHasError(true)}
          />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }} pointerEvents={isEditMode ? 'none' : 'auto'}>
        <WebView
          ref={webViewRef}
          source={getWebViewSource(item)}
          style={styles.webview}
          scrollEnabled={['pinterest', 'spotify', 'tiktok'].includes(item.platform) && !isEditMode}
          onMessage={onMessage}
          injectedJavaScript={HEIGHT_DETECTOR_JS}
          onError={() => !isSocial && setHasError(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500 && !isSocial) setHasError(true);
          }}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          userAgent={MOBILE_USER_AGENT}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          originWhitelist={['*']}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, customWidth ? { width: customWidth as any } : {}]}>
      <Animated.View style={[styles.card, cardAnimStyle]}>
        <View style={styles.webviewContainer}>
          {renderContent()}

          {/* Action buttons — hidden in edit mode */}
          {!isEditMode && (
            <View style={styles.floatingActions}>
              <TouchableOpacity style={styles.floatingButton} onPress={() => onTag(item.id)} activeOpacity={0.8}>
                <Tag size={16} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.floatingButton} onPress={() => onDelete(item.id)} activeOpacity={0.8}>
                <Trash2 size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}

          {/* Edit mode drag overlay — sits above the WebView and captures gestures */}
          {isEditMode && (
            <GestureDetector gesture={combinedGesture}>
              <Animated.View style={[StyleSheet.absoluteFill, styles.dragOverlay, overlayAnimStyle]}>
                <View style={styles.dragHandle}>
                  <Move size={20} color="#FFF" />
                  <Text style={styles.dragLabel}>Hold to move</Text>
                </View>
              </Animated.View>
            </GestureDetector>
          )}

          {/* Drop target highlight ring */}
          {isDropTarget && (
            <View style={styles.dropTargetRing} pointerEvents="none" />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
  dragOverlay: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dragLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dropTargetRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
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
