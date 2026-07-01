// Exercise media is NOT in the dataset repo; it is served from a CDN keyed by media_id.
// Verified: https://static.exercisedb.dev/media/2gPfomN.gif -> 200 image/gif.
const MEDIA_BASE = 'https://static.exercisedb.dev/media';

export function buildGifUrl(mediaId: string): string {
  return `${MEDIA_BASE}/${mediaId}.gif`;
}
