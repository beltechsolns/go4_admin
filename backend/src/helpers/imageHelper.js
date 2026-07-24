const BASE_URL = process.env.BASE_URL || 'https://go4-admin.onrender.com';

export function toFullUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return BASE_URL + (path.startsWith('/') ? path : '/' + path);
}

export function fixItemImages(item) {
  if (!item) return item;
  if (item.image) item.image = toFullUrl(item.image);
  if (item.image_url) item.image_url = toFullUrl(item.image_url);
  if (item.avatar) item.avatar = toFullUrl(item.avatar);
  return item;
}

export function fixImages(items) {
  if (Array.isArray(items)) return items.map(fixItemImages);
  return fixItemImages(items);
}
