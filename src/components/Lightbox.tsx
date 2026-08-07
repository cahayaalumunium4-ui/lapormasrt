import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}

export function Lightbox({ images, index, onClose, onIndex }: Props) {
  const [i, setI] = useState(index);
  useEffect(() => setI(index), [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  });

  const prev = () => {
    const n = (i - 1 + images.length) % images.length;
    setI(n);
    onIndex(n);
  };
  const next = () => {
    const n = (i + 1) % images.length;
    setI(n);
    onIndex(n);
  };

  if (!images.length) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm grid place-items-center animate-fade-in" onClick={onClose}>
      <button className="absolute top-4 right-4 grid place-items-center h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={onClose}>
        <X className="h-6 w-6" />
      </button>
      <button
        className="absolute left-3 sm:left-6 grid place-items-center h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={(e) => { e.stopPropagation(); prev(); }}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <img
        src={images[i]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute right-3 sm:right-6 grid place-items-center h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={(e) => { e.stopPropagation(); next(); }}
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
        {i + 1} / {images.length}
      </div>
    </div>
  );
}
