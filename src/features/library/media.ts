const YOUTUBE_ID = /^[\w-]{11}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);

function parseUrl(value: string): URL | null {
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

/** Only http(s) URLs are ever stored or rendered (blocks javascript:, data:, etc.). */
export function isSafeUrl(value: string): boolean {
  const url = parseUrl(value);
  return url !== null && (url.protocol === 'http:' || url.protocol === 'https:');
}

/** Extracts the video id from watch, youtu.be, shorts and embed URLs; null for anything else. */
export function parseYoutubeId(value: string): string | null {
  const url = parseUrl(value);
  if (!url || !isSafeUrl(value)) return null;

  let id: string | null = null;
  if (url.hostname === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    const [, section, videoId] = url.pathname.split('/');
    if (section === 'watch') id = url.searchParams.get('v');
    else if (section === 'shorts' || section === 'embed') id = videoId ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}
