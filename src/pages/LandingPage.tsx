import { Hero } from '@/components/Hero';
import { AlurPengaduan } from '@/components/AlurPengaduan';
import { Statistik } from '@/components/Statistik';
import { Footer } from '@/components/Footer';

interface Props {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: Props) {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <AlurPengaduan />
      <Statistik />
      <Footer onNavigate={onNavigate} />
    </>
  );
}
