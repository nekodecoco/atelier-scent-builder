import { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Loader2, Trash2 } from 'lucide-react';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB before downscaling
const MAX_EDGE = 1600; // longest edge after downscaling, px

/**
 * Downscale large images client-side so Storage objects stay small. Returns the
 * original file when it's already small enough or when canvas encoding fails.
 */
async function downscale(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  if (scale === 1) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  );
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

/**
 * Shared admin control for uploading a single image. Shows a preview when a URL
 * exists, guards file type/size, downscales, then hands the file to `onUpload`.
 */
export function ImageUploadField({
  url,
  label,
  onUpload,
  onClear,
}: {
  url: string;
  label: string;
  /** Persist the file; resolves to an error string or null on success. */
  onUpload: (file: File) => Promise<string | null>;
  /** Remove the saved image; resolves to an error string or null on success. */
  onClear: () => Promise<string | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state !== 'saved') return;
    const t = setTimeout(() => setState('idle'), 1500);
    return () => clearTimeout(t);
  }, [state]);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image is over 5 MB — pick a smaller file.');
      return;
    }
    setError(null);
    setState('busy');
    const prepared = await downscale(file).catch(() => file);
    const err = await onUpload(prepared);
    if (err) {
      setState('idle');
      setError(err);
      return;
    }
    setState('saved');
  };

  const clear = async () => {
    setState('busy');
    const err = await onClear();
    if (err) {
      setState('idle');
      setError(err);
      return;
    }
    setError(null);
    setState('saved');
  };

  const busy = state === 'busy';

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-ivory-line bg-white/70">
        {url ? (
          <img src={url} alt={`${label} preview`} className="h-full w-full object-cover" />
        ) : (
          <ImagePlus size={16} className="text-stone-dim" aria-hidden />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            className="flex items-center gap-1.5 rounded border border-gold-deep px-3 py-1.5 font-sans text-[9px] tracking-luxe text-gold-deep transition-colors hover:bg-gold-deep hover:text-ivory disabled:opacity-50"
          >
            {busy && <Loader2 size={10} className="animate-spin" aria-hidden />}
            {state === 'saved' && <Check size={10} aria-hidden />}
            {url ? 'REPLACE PHOTO' : 'UPLOAD PHOTO'}
          </button>
          {url && (
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              aria-label={`Remove ${label}`}
              className="flex items-center gap-1 rounded border border-ivory-line px-2.5 py-1.5 font-sans text-[9px] tracking-luxe text-stone transition-colors hover:border-red-400 hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 size={10} aria-hidden />
              REMOVE
            </button>
          )}
        </div>
        {error ? (
          <span className="font-sans text-[10px] text-red-500">{error}</span>
        ) : (
          <span className="font-sans text-[9px] normal-case tracking-normal text-stone-dim">
            JPG or PNG · blank shows the generative visual
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
        aria-label={`Upload ${label}`}
      />
    </div>
  );
}
