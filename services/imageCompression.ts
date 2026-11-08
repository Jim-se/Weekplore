export const MAX_INPUT_BYTES = 2 * 1024 * 1024;
export const TARGET_OUTPUT_BYTES = 1.5 * 1024 * 1024;
// Memory safeguard for oversized files; the user-facing trigger remains file size.
const MAX_PROCESSING_DIMENSION = 4096;
const WEBP_QUALITY = 0.82;
const MIN_WEBP_QUALITY = 0.65;

export type PreparedImage = {
  file: File;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  changed: boolean;
};

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getSafeFileName = (name: string) =>
  name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'image';

const loadImage = async (file: File) => {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const prepareImageForUpload = async (file: File): Promise<PreparedImage> => {
  const image = await loadImage(file);
  const sourceWidth = image.width;
  const sourceHeight = image.height;
  const needsOptimization = file.size > MAX_INPUT_BYTES;

  if (!needsOptimization) {
    if ('close' in image && typeof image.close === 'function') {
      image.close();
    }

    return {
      file,
      width: sourceWidth,
      height: sourceHeight,
      sourceWidth,
      sourceHeight,
      changed: false,
    };
  }

  const renderBlob = async (width: number, height: number, quality: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Your browser could not prepare the image for compression.');
    }

    context.drawImage(image, 0, 0, width, height);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('The browser could not compress this image.'))),
        'image/webp',
        quality
      );
    });
  };

  let scale = Math.min(1, MAX_PROCESSING_DIMENSION / Math.max(sourceWidth, sourceHeight));
  let width = Math.max(1, Math.round(sourceWidth * scale));
  let height = Math.max(1, Math.round(sourceHeight * scale));
  let quality = WEBP_QUALITY;
  let blob = await renderBlob(width, height, quality);

  while (blob.size > TARGET_OUTPUT_BYTES && quality > MIN_WEBP_QUALITY) {
    quality = Math.max(MIN_WEBP_QUALITY, quality - 0.05);
    blob = await renderBlob(width, height, quality);
  }

  while (blob.size > TARGET_OUTPUT_BYTES && Math.max(width, height) > 1000) {
    scale *= 0.85;
    width = Math.max(1, Math.round(sourceWidth * scale));
    height = Math.max(1, Math.round(sourceHeight * scale));
    blob = await renderBlob(width, height, MIN_WEBP_QUALITY);
  }

  if ('close' in image && typeof image.close === 'function') {
    image.close();
  }

  const outputType = blob.type || 'image/webp';
  const compressedFile = new File([blob], `${getSafeFileName(file.name)}.webp`, {
    type: outputType,
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    width,
    height,
    sourceWidth,
    sourceHeight,
    changed: true,
  };
};
