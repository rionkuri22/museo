export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'pinterest' | 'twitter' | 'web' | 'linkedin';

export interface ContentItem {
  id: string;
  url: string;
  embedUrl: string;
  platform: Platform;
  title: string;
  addedAt: number;
  boardIds: string[];
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
        const id = url.includes('/p/') 
          ? url.split('/p/')[1]?.split('/')[0]
          : url.includes('/reels/')
            ? url.split('/reels/')[1]?.split('/')[0]
            : url.split('/reel/')[1]?.split('/')[0];
        return id || url;
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
        // Use twitframe.com for reliable tweet embedding
        return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
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
    case 'twitter':
    case 'linkedin':
    case 'web':
      return true;
    default:
      return false;
  }
};

export const getDynamicHeight = (platform: Platform): number => {
  switch (platform) {
    case 'youtube': return 220;
    case 'instagram': return 580;
    case 'tiktok': return 500;
    case 'pinterest': return 340;
    case 'twitter': return 400;
    case 'linkedin': return 400;
    default: return 250;
  }
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};
