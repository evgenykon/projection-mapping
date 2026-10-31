const VIDEO_DIRECTORY = 'pm-videos';
const VIDEO_META_KEY = 'pm-video-assets';
const IMAGE_DIRECTORY = 'pm-images';
const IMAGE_META_KEY = 'pm-image-assets';

export interface AssetMeta {
  id: string;
  name: string;
  type: string;
  size: number;
}

function readMeta(key: string): Record<string, AssetMeta> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, AssetMeta>) : {};
  } catch {
    return {};
  }
}

function writeMeta(key: string, meta: Record<string, AssetMeta>) {
  try {
    localStorage.setItem(key, JSON.stringify(meta));
  } catch {
    // localStorage can be unavailable in private mode; the file still works.
  }
}

export function getAssetMeta(id: string): AssetMeta | null {
  return readMeta(VIDEO_META_KEY)[id] ?? null;
}

export function getImageAssetMeta(id: string): AssetMeta | null {
  return readMeta(IMAGE_META_KEY)[id] ?? null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getDirectory(
  name: string,
  create: boolean,
): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(name, { create });
}

async function saveMediaFile(
  file: File,
  directoryName: string,
  metaKey: string,
  prefix: string,
  fallbackType: string,
): Promise<{ url: string; meta: AssetMeta }> {
  const directory = await getDirectory(directoryName, true);
  const id = crypto.randomUUID();
  const handle = await directory.getFileHandle(id, { create: true });
  const writable = await handle.createWritable();
  await writable.write(file);
  await writable.close();

  const meta: AssetMeta = {
    id,
    name: file.name,
    type: file.type || fallbackType,
    size: file.size,
  };
  const all = readMeta(metaKey);
  all[id] = meta;
  writeMeta(metaKey, all);

  return { url: `${prefix}${id}`, meta };
}

async function resolveMediaFile(
  source: string,
  prefix: string,
  directoryName: string,
  metaKey: string,
): Promise<{ src: string; owned: boolean }> {
  if (!source.startsWith(prefix)) {
    return { src: source, owned: false };
  }
  const id = source.slice(prefix.length);
  const meta = readMeta(metaKey)[id];
  const directory = await getDirectory(directoryName, false);
  const handle = await directory.getFileHandle(id, { create: false });
  const file = await handle.getFile();
  const blob = meta?.type ? new Blob([file], { type: meta.type }) : file;
  return { src: URL.createObjectURL(blob), owned: true };
}

export async function saveVideoFile(
  file: File,
): Promise<{ url: string; meta: AssetMeta }> {
  return saveMediaFile(file, VIDEO_DIRECTORY, VIDEO_META_KEY, 'asset:', 'video/mp4');
}

export async function resolveVideoSource(
  source: string,
): Promise<{ src: string; owned: boolean }> {
  return resolveMediaFile(source, 'asset:', VIDEO_DIRECTORY, VIDEO_META_KEY);
}

export async function saveImageFile(
  file: File,
): Promise<{ url: string; meta: AssetMeta }> {
  return saveMediaFile(
    file,
    IMAGE_DIRECTORY,
    IMAGE_META_KEY,
    'image-asset:',
    'image/png',
  );
}

export async function resolveImageSource(
  source: string,
): Promise<{ src: string; owned: boolean }> {
  return resolveMediaFile(
    source,
    'image-asset:',
    IMAGE_DIRECTORY,
    IMAGE_META_KEY,
  );
}
