export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'pinterest' | 'twitter' | 'web';

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
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      
      case 'instagram': {
        const id = url.split('/p/')[1]?.split('/')[0];
        return id ? `https://www.instagram.com/p/${id}/embed` : null;
      }
      
      case 'tiktok': {
        const id = url.split('/video/')[1]?.split('?')[0];
        return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
      }
      
      case 'pinterest': {
        // Pinterest embeds are tricky via URL, often require a widget script
        // For now, we'll try to use a direct pin embed link if possible
        const id = url.includes('pin.it/') 
          ? null // Would need to resolve short link
          : url.split('/pin/')[1]?.split('/')[0];
        return id ? `https://assets.pinterest.com/ext/embed.html?id=${id}` : url;
      }
      
      case 'twitter': {
        // Twitter embeds usually require oEmbed or a widget
        // For WebView, we can use the publish.twitter.com approach or just the URL
        return `https://platform.twitter.com/embed/Tweet.html?url=${encodeURIComponent(url)}`;
      }
      
      default:
        return url; // Fallback to raw URL for web
    }
  } catch (e) {
    return null;
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
