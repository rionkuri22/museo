import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, ScrollView,
  Dimensions, TouchableOpacity,
} from 'react-native';
import { getDynamicHeight, isFullWidth, ContentItem } from '../../utils/share-utils';
import { useMuseoStore } from '../../store/useMuseoStore';
import { EmbedCard } from '../../components/EmbedCard';
import { BoardPicker } from '../../components/BoardPicker';
import { OfflineBanner } from '../../components/OfflineBanner';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  LinearTransition,
} from 'react-native-reanimated';

const NUM_COLUMNS = 2;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function useMasonryLayout(items: ContentItem[]) {
  return useMemo(() => {
    type Section =
      | { kind: 'masonry'; columns: ContentItem[][] }
      | { kind: 'full'; item: ContentItem };

    const sections: Section[] = [];
    let halfBuffer: ContentItem[] = [];

    const flushHalf = () => {
      if (halfBuffer.length === 0) return;

      if (halfBuffer.length === 1) {
        sections.push({ kind: 'full', item: halfBuffer[0] });
        halfBuffer = [];
        return;
      }

      const columns: ContentItem[][] = Array.from({ length: NUM_COLUMNS }, () => []);
      halfBuffer.forEach((item, idx) => {
        const targetCol = idx % NUM_COLUMNS;
        columns[targetCol].push(item);
      });

      sections.push({ kind: 'masonry', columns });
      halfBuffer = [];
    };

    items.forEach(item => {
      if (isFullWidth(item.platform)) {
        flushHalf();
        sections.push({ kind: 'full', item });
      } else {
        halfBuffer.push(item);
      }
    });
    flushHalf();

    return sections;
  }, [items]);
}

export default function LandingPage() {
  const { items, removeItem, moveItem } = useMuseoStore();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [boardPickerVisible, setBoardPickerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Ghost card animated values - updated on UI thread during drag
  const ghostTop = useSharedValue(0);
  const ghostLeft = useSharedValue(0);
  const ghostW = useSharedValue(0);
  const ghostH = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);
  const ghostScale = useSharedValue(0.97);

  // Track each card's layout in the scroll content
  // { scrollContentY, height }
  const cardLayouts = useRef<Map<string, { y: number; height: number }>>(new Map());
  const scrollOffsetY = useRef(0);

  const handleTag = (id: string) => {
    setSelectedItemId(id);
    setBoardPickerVisible(true);
  };

  const handleDelete = (id: string) => {
    removeItem(id);
  };

  const toggleEditMode = () => {
    setIsEditMode(prev => {
      if (prev) {
        // Exiting edit mode — clear any drag in progress
        setDraggingId(null);
        setDropTargetId(null);
        ghostOpacity.value = 0;
      }
      return !prev;
    });
  };

  // Sets up ghost card position and notifies JS thread.
  const startDragUI = (pageY: number, pageX: number, w: number, h: number) => {
    ghostTop.value = pageY;
    ghostLeft.value = pageX;
    ghostW.value = w;
    ghostH.value = h;
    ghostOpacity.value = withTiming(0.9, { duration: 120 });
    ghostScale.value = withSpring(1.04);
  };

  const updateGhostUI = (dy: number, dx: number) => {
    ghostTop.value = ghostTop.value + dy;
    ghostLeft.value = ghostLeft.value + dx;
  };

  // JS thread: find best drop target based on absoluteY of the ghost center
  const findDropTarget = useCallback((absoluteY: number, excludeId: string): string | null => {
    // Convert absolute screen Y to scroll-content Y
    const contentY = absoluteY + scrollOffsetY.current;
    let closest: string | null = null;
    let closestDist = Infinity;

    cardLayouts.current.forEach(({ y, height }, id) => {
      if (id === excludeId) return;
      const centerY = y + height / 2;
      const dist = Math.abs(contentY - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = id;
      }
    });

    return closest;
  }, []);

  const onDragStart = useCallback((id: string, pageY: number, pageX: number, w: number, h: number) => {
    setDraggingId(id);
    startDragUI(pageY, pageX, w, h);
  }, [startDragUI]);

  const onDragMove = useCallback((id: string, absoluteY: number) => {
    const target = findDropTarget(absoluteY, id);
    setDropTargetId(target);
  }, [findDropTarget]);

  const onDragEnd = useCallback((id: string) => {
    const fromIdx = items.findIndex(i => i.id === id);
    const toIdx = dropTargetId ? items.findIndex(i => i.id === dropTargetId) : -1;

    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      moveItem(fromIdx, toIdx);
    }

    ghostOpacity.value = withTiming(0, { duration: 150 });
    ghostScale.value = withTiming(1, { duration: 150 });
    setDraggingId(null);
    setDropTargetId(null);
  }, [items, dropTargetId, moveItem]);

  const onCardLayout = useCallback((id: string, y: number, height: number) => {
    cardLayouts.current.set(id, { y, height });
  }, []);

  const sections = useMasonryLayout(items);

  const ghostAnimStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: ghostTop.value,
    left: ghostLeft.value,
    width: ghostW.value,
    height: ghostH.value,
    opacity: ghostOpacity.value,
    transform: [{ scale: ghostScale.value }],
    zIndex: 999,
    pointerEvents: 'none',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  }));

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your board is empty</Text>
        <Text style={styles.emptySubtitle}>Pasted links will appear here.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />

      {/* Header with Edit Mode toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Museo</Text>
        <TouchableOpacity onPress={toggleEditMode} style={styles.editButton}>
          {isEditMode
            ? <View style={styles.doneChip}><Text style={styles.doneText}>Done</Text></View>
            : <Text style={styles.editText}>Reorder</Text>
          }
        </TouchableOpacity>
      </View>

      {isEditMode && (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>Hold & drag any card to reorder it</Text>
        </View>
      )}

      {/* Main content */}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!draggingId}
          onScroll={(e) => { scrollOffsetY.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
        >
          {sections.map((section, idx) => {
            if (section.kind === 'full') {
              const item = section.item;
              return (
                <Animated.View
                  key={item.id}
                  layout={LinearTransition.springify().damping(18).stiffness(120)}
                  onLayout={(e) => onCardLayout(item.id, e.nativeEvent.layout.y, e.nativeEvent.layout.height)}
                >
                  <EmbedCard
                    item={item}
                    onDelete={handleDelete}
                    onTag={handleTag}
                    customWidth="100%"
                    isDragging={draggingId === item.id}
                    isDropTarget={dropTargetId === item.id}
                    isEditMode={isEditMode}
                    onDragStart={onDragStart}
                    onDragMove={onDragMove}
                    onDragEnd={onDragEnd}
                  />
                </Animated.View>
              );
            }

            return (
              <Animated.View
                key={`masonry-${idx}`}
                style={styles.masonryRow}
                layout={LinearTransition.springify().damping(18).stiffness(120)}
              >
                {section.columns.map((colItems, colIdx) => (
                  <View key={`col-${colIdx}`} style={styles.masonryColumn}>
                    {colItems.map(item => (
                      <Animated.View
                        key={item.id}
                        layout={LinearTransition.springify().damping(18).stiffness(120)}
                        onLayout={(e) => onCardLayout(item.id, e.nativeEvent.layout.y, e.nativeEvent.layout.height)}
                      >
                        <EmbedCard
                          item={item}
                          onDelete={handleDelete}
                          onTag={handleTag}
                          customWidth="100%"
                          isDragging={draggingId === item.id}
                          isDropTarget={dropTargetId === item.id}
                          isEditMode={isEditMode}
                          onDragStart={onDragStart}
                          onDragMove={onDragMove}
                          onDragEnd={onDragEnd}
                        />
                      </Animated.View>
                    ))}
                  </View>
                ))}
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Ghost card - floats above content during drag */}
        {draggingId && <Animated.View style={ghostAnimStyle} />}
      </View>

      <BoardPicker
        itemId={selectedItemId}
        visible={boardPickerVisible}
        onClose={() => setBoardPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  editButton: {
    padding: 6,
  },
  editText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  doneChip: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  doneText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  editBanner: {
    backgroundColor: '#007AFF15',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 6,
  },
  editBannerText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 20,
  },
  masonryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  masonryColumn: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
