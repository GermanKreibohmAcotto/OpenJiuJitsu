import { describe, expect, it } from 'vitest';
import { isSafeUrl, parseYoutubeId, youtubeEmbedUrl } from './media';

describe('parseYoutubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=10', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts the id from %s', (url, id) => {
    expect(parseYoutubeId(url)).toBe(id);
  });

  it.each(['https://vimeo.com/12345', 'https://evil.com/watch?v=dQw4w9WgXcQ', 'not a url', 'https://youtu.be/', ''])(
    'returns null for %s',
    (url) => {
      expect(parseYoutubeId(url)).toBeNull();
    },
  );

  it('builds the privacy-friendly embed url', () => {
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
});

describe('isSafeUrl', () => {
  it('accepts http and https only', () => {
    expect(isSafeUrl('https://example.com/a.gif')).toBe(true);
    expect(isSafeUrl('http://example.com/a.png')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:image/png;base64,AAAA')).toBe(false);
    expect(isSafeUrl('ftp://example.com/a')).toBe(false);
    expect(isSafeUrl('nonsense')).toBe(false);
  });
});
