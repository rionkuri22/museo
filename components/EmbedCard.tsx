import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { ContentItem } from '../utils/share-utils';
import { Trash2, Tag, X } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface EmbedCardProps {
  item: ContentItem;
  onDelete: (id: string) => void;
  onTag: (id: string) => void;
}

const { width } = Dimensions.get('window');

export const EmbedCard = ({ item, onDelete, onTag }: EmbedCardProps) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const [hasError, setHasError] = useState(false);

  const handleLongPress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    setMenuVisible(true);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={handleLongPress}
          delayLongPress={500}
          style={styles.touchable}
        >
          <View style={styles.webviewContainer}>
            {hasError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Content unavailable</Text>
              </View>
            ) : (
              <WebView
                source={{ uri: item.embedUrl }}
                style={styles.webview}
                scrollEnabled={false}
                pointerEvents="none"
                onError={() => setHasError(true)}
              />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Options</Text>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                onTag(item.id);
              }}
            >
              <Tag size={18} color="#007AFF" />
              <Text style={styles.menuItemText}>Tag to Board</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteItem]} 
              onPress={() => {
                setMenuVisible(false);
                onDelete(item.id);
              }}
            >
              <Trash2 size={18} color="#FF3B30" />
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  touchable: {
    flex: 1,
  },
  webviewContainer: {
    height: 180, // Fixed height for common aspect ratio in grid
    width: '100%',
    backgroundColor: '#F2F2F7',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    color: '#000',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  deleteItem: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#FF3B30',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
  },
  closeButtonText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
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
