// Encode: "Pizza Palace" + id=3  → "pizza-palace--3"
export function toStoreSlug(name, id) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return id !== undefined ? `${slug}--${id}` : slug
}

// Decode: "pizza-palace--3" → { name: "pizza palace", id: 3 }
export function fromStoreSlug(slug) {
  const parts = slug.split('--')
  const id = parts.length > 1 ? parseInt(parts[parts.length - 1]) : null
  const name = parts[0].replace(/-/g, ' ')
  return { name, id }
}
