import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, FileImage, Upload, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  formatBytes,
  MAX_INPUT_BYTES,
  prepareImageForUpload,
  TARGET_OUTPUT_BYTES,
} from '../services/imageCompression';

const BUCKET_NAME = 'image-compression-tests';

type ImageDetails = {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
};

const ImageCompressionTester: React.FC = () => {
  const [original, setOriginal] = useState<ImageDetails | null>(null);
  const [compressed, setCompressed] = useState<ImageDetails | null>(null);
  const [originalPreview, setOriginalPreview] = useState('');
  const [compressedPreview, setCompressedPreview] = useState('');
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState('Choose an image to see the before and after sizes.');
  const [error, setError] = useState('');
  const [uploadedPath, setUploadedPath] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => () => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (compressedPreview) URL.revokeObjectURL(compressedPreview);
  }, [originalPreview, compressedPreview]);

  const reduction = useMemo(() => {
    if (!original || !compressed || original.size === 0) return null;
    return Math.max(0, Math.round((1 - compressed.size / original.size) * 100));
  }, [original, compressed]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setUploadedPath('');
    setCompressed(null);
    setCompressedBlob(null);
    setOriginalPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
    setStatus('Checking image size...');

    try {
      const result = await prepareImageForUpload(file);
      const previewUrl = URL.createObjectURL(result.file);
      setOriginal({
        name: file.name,
        size: file.size,
        type: file.type || 'unknown',
        width: result.sourceWidth,
        height: result.sourceHeight,
      });
      setCompressed({
        name: result.file.name,
        size: result.file.size,
        type: result.file.type || file.type || 'unknown',
        width: result.width,
        height: result.height,
      });
      setCompressedBlob(result.file);
      setCompressedPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return previewUrl;
      });
      setStatus(result.changed
        ? 'Image optimized. Uploading is optional.'
        : 'This image is already within the limits, so it was left unchanged. Uploading is optional.');
    } catch (compressionError) {
      setStatus('Compression failed.');
      setError(compressionError instanceof Error ? compressionError.message : 'Could not compress this image.');
    }
  };

  const handleUpload = async () => {
    if (!compressedBlob || !compressed) return;

    setUploading(true);
    setError('');
    setUploadedPath('');
    const path = `compression-tests/${Date.now()}-${compressed.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, compressedBlob, {
          cacheControl: '3600',
          contentType: compressed.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;
      setUploadedPath(path);
      setStatus('Uploaded to the test bucket. You can inspect its size in Supabase Storage.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed. Check the bucket policies and try again.');
      setStatus('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setOriginal(null);
    setCompressed(null);
    setCompressedBlob(null);
    setUploadedPath('');
    setError('');
    setStatus('Choose an image to see the before and after sizes.');
    setOriginalPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return '';
    });
    setCompressedPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return '';
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
            <FileImage className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold serif-font">Image Compression Test</h1>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-text/40">
              Temporary test tool · no event is created or changed
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-[2rem] border border-brand-border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Select a test image</h2>
            <p className="mt-2 text-sm text-brand-text/60">
              Images up to {formatBytes(MAX_INPUT_BYTES)} are left unchanged. Larger images are compressed toward {formatBytes(TARGET_OUTPUT_BYTES)}; dimensions are reduced only if needed to reach that target.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-text px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-bg transition-all hover:bg-brand-gold">
            <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
            <Upload className="h-4 w-4" />
            Choose image
          </label>
        </div>

        <p className="mt-6 text-sm font-medium text-brand-text/60">{status}</p>
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {(original || compressed) && (
        <section className="grid gap-6 lg:grid-cols-2">
          {[{ label: 'Original', details: original, preview: originalPreview }, { label: 'Compressed', details: compressed, preview: compressedPreview }].map((item) => (
            <div key={item.label} className="overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-sm">
              <div className="aspect-video bg-brand-bg/50">
                {item.preview && <img src={item.preview} alt={`${item.label} preview`} className="h-full w-full object-contain" />}
              </div>
              <div className="space-y-2 p-6">
                <h3 className="text-lg font-bold">{item.label}</h3>
                {item.details ? (
                  <div className="space-y-1 text-sm text-brand-text/60">
                    <p><span className="font-bold text-brand-text">Size:</span> {formatBytes(item.details.size)}</p>
                    <p><span className="font-bold text-brand-text">Dimensions:</span> {item.details.width} × {item.details.height}</p>
                    <p><span className="font-bold text-brand-text">Type:</span> {item.details.type}</p>
                  </div>
                ) : <p className="text-sm text-brand-text/40">Waiting for compression...</p>}
              </div>
            </div>
          ))}
        </section>
      )}

      {compressed && (
        <section className="rounded-[2rem] border border-brand-border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Test bucket upload</h2>
              <p className="mt-2 text-sm text-brand-text/60">
                This uploads only to <span className="font-bold">{BUCKET_NAME}</span>. It does not touch event records.
              </p>
              {reduction !== null && (
                <p className="mt-2 text-sm font-bold text-emerald-700">
                  {reduction === 0 ? 'No compression was needed' : `${reduction}% smaller than the original`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleUpload} disabled={uploading} className="rounded-2xl bg-brand-text px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-bg transition-all hover:bg-brand-gold disabled:cursor-not-allowed disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload test copy'}
              </button>
              <button type="button" onClick={reset} className="rounded-2xl border border-brand-border px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text transition-all hover:border-brand-gold hover:text-brand-gold">
                Clear
              </button>
            </div>
          </div>
          {uploadedPath && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Uploaded successfully.</p>
                <p className="mt-1 break-all">Storage path: {uploadedPath}</p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ImageCompressionTester;
