import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { useTranslation } from 'react-i18next';
import { ResponsiveDialog } from './responsive-dialog';
import { Button } from '@/components/ui/button';

const INSECURE_CONTEXT_MESSAGE =
  "Kamera faqat xavfsiz ulanishda (HTTPS yoki localhost) ishlaydi. Barcode'ni qo'lda kiriting.";

type BarcodeScannerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (code: string) => void;
};

/**
 * Telefon kamerasi orqali barcode o'qish.
 * Kamera faqat HTTPS yoki localhost'da ishlaydi — aks holda tushunarli xabar chiqadi.
 */
export function BarcodeScanner({ open, onOpenChange, onDetected }: BarcodeScannerProps) {
  const { t } = useTranslation('common');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Oyna qayta ochilganda eski xato qolib ketmasligi kerak.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setCameraError(null);
  }

  // Kamera faqat xavfsiz kontekstda (HTTPS yoki localhost) ishlaydi.
  const insecure = !window.isSecureContext;
  const error = insecure ? INSECURE_CONTEXT_MESSAGE : cameraError;

  useEffect(() => {
    if (!open || insecure) return;

    let controls: IScannerControls | null = null;
    let cancelled = false;

    const reader = new BrowserMultiFormatReader();
    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (cancelled || !result) return;
        // Topilganda qisqa tebranish — sotuvchi ekranga qaramasdan ham sezadi.
        navigator.vibrate?.(60);
        onDetected(result.getText());
        onOpenChange(false);
      })
      .then((value) => {
        if (cancelled) value.stop();
        else controls = value;
      })
      .catch(() => {
        if (!cancelled) setCameraError('Kameraga ruxsat berilmadi yoki kamera topilmadi.');
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [open, insecure, onDetected, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Barcode skanerlash"
      description="Kamerani mahsulot chizig'iga qarating"
      footer={
        <Button variant="outline" className="min-h-touch" onClick={() => onOpenChange(false)}>
          {t('actions.cancel')}
        </Button>
      }
    >
      {error ? (
        <p role="alert" className="text-destructive py-6 text-center text-sm">
          {error}
        </p>
      ) : (
        <div className="bg-muted relative overflow-hidden rounded-2xl">
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
          <div
            className="border-primary pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2"
            aria-hidden
          />
        </div>
      )}
    </ResponsiveDialog>
  );
}
