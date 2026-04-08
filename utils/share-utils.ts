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
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'web';
};

export const getEmbedUrl = (url: string): string | null => {
  const platform = detectPlatform(url);
  
  try {
    switch (platform) {
      case 'youtube': {
        const id = url.includes('youtu.be/') 
          ? url.split('youtu.be/')[1]?.split('?')[0]
          : new URL(url).searchParams.get('v');
        // Removing origin and simplifying to fix playback errors
        return id ? `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&showinfo=0&playsinline=1` : null;
      }
      
      case 'instagram': {
        const id = url.includes('/p/') 
          ? url.split('/p/')[1]?.split('/')[0]
          : url.includes('/reels/')
            ? url.split('/reels/')[1]?.split('/')[0]
            : url.split('/reel/')[1]?.split('/')[0];
        return id ? `https://www.instagram.com/p/${id}/embed` : null;
      }
      
      case 'tiktok': {
        const id = url.includes('/video/') 
          ? url.split('/video/')[1]?.split('?')[0]
          : url.split('/v/')[1]?.split('?')[0];
        return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
      }
      
      case 'pinterest': {
        const idRegex = /\/pin\/(\d+)/;
        const match = url.match(idRegex);
        const id = match ? match[1] : null;
        return id ? `https://assets.pinterest.com/ext/embed.html?id=${id}` : url;
      }
      
      case 'twitter': {
        const idMatch = url.match(/status\/(\d+)/);
        const id = idMatch ? idMatch[1] : null;
        // Using id directly is more reliable than url for X
        return id 
          ? `https://platform.twitter.com/embed/Tweet.html?id=${id}&dnt=true` 
          : `https://platform.twitter.com/embed/Tweet.html?url=${encodeURIComponent(url)}&dnt=true`;
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
    return null;
  }
};

export const getDynamicHeight = (platform: Platform) => {
  switch (platform) {
    case 'youtube': return 160;
    case 'instagram': return 350;
    case 'tiktok': return 420;
    case 'pinterest': return 380;
    case 'twitter': return 300;
    case 'linkedin': return 400; // Taller for LinkedIn feeds
    default: return 220;
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
