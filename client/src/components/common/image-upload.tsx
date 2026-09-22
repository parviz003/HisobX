import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type ImageUploadProps = {
  /** Backend'dan kelgan mavjud rasm manzili (`/api/v1/uploads/...`). */
  currentUrl?: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onRemoveCurrent?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

/**
 * Rasm tanlash: galereyadan yoki telefon kamerasidan.
 * Backend `multipart/form-data` da `image` maydonini kutadi va .webp ga o'giradi.
 */
export function ImageUpload({
  currentUrl,
  file,
  onFileChange,
  onRemoveCurrent,
  disabled,
  className,
  label,
}: ImageUploadProps) {
  const { t } = useTranslation('common');
  const [error, setError] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Tanlangan fayl uchun vaqtincha URL.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // URL faqat almashganda bo'shatiladi — aks holda xotira band bo'lib qoladi.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const accept = (selected: File | undefined) => {
    setError(null);
    if (!selected) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(selected.type)) {
      setError('Faqat JPG, PNG yoki WEBP rasm yuklash mumkin');
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setError("Rasm hajmi 10 MB dan oshmasligi kerak");
      return;
    }
    onFileChange(selected);
  };

  const shown = preview ?? currentUrl ?? null;

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <p className="text-[13px] font-medium">{label}</p> : null}

      <div className="flex items-center gap-3">
        <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border">
          {shown ? (
            <img src={shown} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <ImagePlus className="text-muted-foreground size-7" aria-hidden />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-touch"
            disabled={disabled}
            onClick={() => galleryRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Galereya
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-touch"
            disabled={disabled}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="size-4" />
            Kamera
          </Button>
          {shown ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-touch text-destructive"
              disabled={disabled}
              onClick={() => {
                onFileChange(null);
                if (!preview) onRemoveCurrent?.();
              }}
            >
              <Trash2 className="size-4" />
              {t('actions.delete')}
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="sr-only"
        onChange={(event) => accept(event.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => accept(event.target.files?.[0])}
      />

      {error ? (
        <p role="alert" className="text-destructive text-[13px]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
