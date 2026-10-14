export function productMediaUrl(path: string | null) {
  if (!path) return null;
  if (/^\/products\/[a-z0-9-]+\.webp$/.test(path)) return path;
  try {
    const url = new URL(path);
    return url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith("/diometfe9/image/upload/")
      ? url.href
      : null;
  } catch {
    return null;
  }
}
