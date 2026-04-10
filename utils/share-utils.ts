export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'pinterest' | 'twitter' | 'web' | 'linkedin';

export interface ContentItem {
  id: string;
  url: string;
  embedUrl: string;
  platform: Platform;
  title: string;
  addedAt: number;
  boardIds: string[];
  cropY?: number;
}

export const detectPlatform = (url: string): Platform => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
  if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'web';
};

export const getEmbedUrl = (url: string): string => {
  const platform = detectPlatform(url);
  
  try {
    switch (platform) {
      case 'youtube': {
        // Extract video ID only — used by react-native-youtube-iframe
        const id = url.includes('youtu.be/') 
          ? url.split('youtu.be/')[1]?.split('?')[0]
          : new URL(url).searchParams.get('v');
        return id || url; // fallback to raw URL if extraction fails
      }
      
      case 'instagram': {
        // Store the full original URL for proper embedding
        return url;
      }
      
      case 'tiktok': {
        const id = url.includes('/video/') 
          ? url.split('/video/')[1]?.split('?')[0]
          : url.split('/v/')[1]?.split('?')[0];
        return id ? `https://www.tiktok.com/embed/v2/${id}` : url;
      }
      
      case 'pinterest': {
        const idRegex = /\/pin\/(\d+)/;
        const match = url.match(idRegex);
        const id = match ? match[1] : null;
        return id ? `https://assets.pinterest.com/ext/embed.html?id=${id}` : url;
      }
      
      case 'twitter': {
        // Store the full original URL (normalizing x.com to twitter.com) for proper embedding via Twitter widget.js
        return url.replace('x.com', 'twitter.com');
      }

      case 'linkedin': {
        const idMatch = url.match(/activity-(\d+)/) || url.match(/update\/urn:li:activity:(\d+)/);
        const id = idMatch ? idMatch[1] : null;
        return id ? `https://www.linkedin.com/embed/feed/update/urn:li:activity:${id}` : url;
      }
      
      default:
        return url;
    }
  } catch (e) {
    return url; // Always fall back to raw URL, never null
  }
};

// Returns true if this platform should span the full width (single column)
export const isFullWidth = (platform: Platform): boolean => {
  switch (platform) {
    case 'youtube':
    case 'linkedin':
    case 'web':
      return true;
    default:
      return false;
  }
};

export const getDynamicHeight = (platform: Platform): number => {
  switch (platform) {
    case 'youtube': return 210;
    case 'instagram': return 300;
    case 'tiktok': return 450;
    case 'pinterest': return 340;
    case 'twitter': return 300;
    case 'linkedin': return 350;
    default: return 250;
  }
};

/**
 * Smart layout algorithm: reorders half-width items so columns look balanced.
 * Distributes items into shortest column FIRST to preserve relative order.
 */
export type LayoutRow = 
  | { type: 'full'; item: ContentItem }
  | { type: 'pair'; left: ContentItem[]; right: ContentItem[] };

export const buildSmartLayout = (items: ContentItem[]): LayoutRow[] => {
  const rows: LayoutRow[] = [];
  let halfWidthBuffer: ContentItem[] = [];

  const flushBuffer = () => {
    if (halfWidthBuffer.length === 0) return;

    // Preserving chronological order (no sort)
    const sorted = [...halfWidthBuffer];

    const left: ContentItem[] = [];
    const right: ContentItem[] = [];
    let leftH = 0;
    let rightH = 0;

    sorted.forEach(item => {
      const h = getDynamicHeight(item.platform);
      // Always place into the shorter column
      if (leftH <= rightH) {
        left.push(item);
        leftH += h;
      } else {
        right.push(item);
        rightH += h;
      }
    });

    rows.push({ type: 'pair', left, right });
    halfWidthBuffer = [];
  };

  items.forEach(item => {
    if (isFullWidth(item.platform)) {
      flushBuffer();
      rows.push({ type: 'full', item });
    } else {
      halfWidthBuffer.push(item);
    }
  });
  flushBuffer();

  return rows;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};
