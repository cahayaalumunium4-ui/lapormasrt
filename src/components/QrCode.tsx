import { useEffect } from 'react';
import { useState } from 'react';

interface Props {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 160, className = '' }: Props) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let active = true;
    import('qrcode').then((QRCode) => {
      if (!active) return;
      QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
        .then((url) => {
          if (active) setSrc(url);
        })
        .catch(() => {});
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!src) {
    return <div className="shimmer rounded-xl" style={{ width: size, height: size }} />;
  }
  return <img src={src} width={size} height={size} alt="QR Code" className={`rounded-xl ${className}`} />;
}
