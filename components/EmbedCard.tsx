import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ContentItem, getDynamicHeight } from '../utils/share-utils';
import { Trash2, Tag, X } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface EmbedCardProps {
  item: ContentItem;
  onDelete: (id: string) => void;
  onTag: (id: string) => void;
  customWidth?: string | number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Build the HTML source for platforms that need it
const getWebViewSource = (item: ContentItem) => {
  switch (item.platform) {
    case 'instagram':
      return {
        html: `
          <!DOCTYPE html>
          <html><head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            * { margin: 0; padding: 0; }
            html, body { width: 100%; height: 100%; background: #fafafa; overflow: hidden; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
          </head><body>
          <iframe src="https://www.instagram.com/p/${item.embedUrl}/embed/captioned/" allowfullscreen></iframe>
          </body></html>
        `,
      };

    default:
      return { uri: item.embedUrl };
  }
};

export const EmbedCard = ({ item, onDelete, onTag, customWidth }: EmbedCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [hasError, setHasError] = useState(false);

  const cardHeight = getDynamicHeight(item.platform);

  const renderContent = () => {
    if (hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Content unavailable</Text>
        </View>
      );
    }

    // YouTube uses the dedicated player
    if (item.platform === 'youtube') {
      return (
        <YoutubePlayer
          height={cardHeight}
          videoId={item.embedUrl}
          play={false}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
          }}
          onError={() => setHasError(true)}
        />
      );
    }

    // Everything else uses WebView
    return (
      <WebView
        source={getWebViewSource(item)}
        style={styles.webview}
        scrollEnabled={true}
        onError={() => setHasError(true)}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode >= 400) setHasError(true);
        }}
        allowsFullscreenVideo={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        scalesPageToFit={false}
        automaticallyAdjustContentInsets={false}
        mixedContentMode="always"
        allowsLinkPreview={false}
      />
    );
  };

  return (
    <View style={[styles.container, customWidth ? { width: customWidth as any } : {}]}>
      <View style={styles.card}>
        <View style={[styles.webviewContainer, { height: cardHeight }]}>
          {renderContent()}

          {/* Pinterest-style floating action buttons */}
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
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
    width: '50%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  webviewContainer: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingActions: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  floatingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    // inherits from floatingButton, just different icon color
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
});
