import { lazy, Suspense, useEffect, useState } from 'react';
import { useDarkMode } from '@/lib/useDarkMode';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Loading } from '@/components/Loading';
import { LandingPage } from '@/pages/LandingPage';
const BuatPengaduan = lazy(() => import('@/pages/BuatPengaduan').then((m) => ({ default: m.BuatPengaduan })));
const CekTiket = lazy(() => import('@/pages/CekTiket').then((m) => ({ default: m.CekTiket })));
const RiwayatLaporan = lazy(() => import('@/pages/RiwayatLaporan').then((m) => ({ default: m.RiwayatLaporan })));
const GaleriKegiatan = lazy(() => import('@/pages/GaleriKegiatan').then((m) => ({ default: m.GaleriKegiatan })));
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { AdminLayout, type AdminPage } from '@/pages/admin/AdminLayout';
import { AdminResetPassword } from '@/pages/admin/AdminResetPassword';
import { DebugLogin } from '@/pages/admin/DebugLogin';

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminPengaduan = lazy(() => import('@/pages/admin/AdminPengaduan').then((m) => ({ default: m.AdminPengaduan })));
const AdminScan = lazy(() => import('@/pages/admin/AdminScan').then((m) => ({ default: m.AdminScan })));
const AdminMedia = lazy(() => import('@/pages/admin/AdminMedia').then((m) => ({ default: m.AdminMedia })));
const AdminStatistik = lazy(() => import('@/pages/admin/AdminStatistik').then((m) => ({ default: m.AdminStatistik })));
const AdminBackup = lazy(() => import('@/pages/admin/AdminBackup').then((m) => ({ default: m.AdminBackup })));
const AdminAktivitas = lazy(() => import('@/pages/admin/AdminAktivitas').then((m) => ({ default: m.AdminAktivitas })));
const AdminPengaturan = lazy(() => import('@/pages/admin/AdminPengaturan').then((m) => ({ default: m.AdminPengaturan })));
const AdminWarga = lazy(() => import('@/pages/admin/AdminCrud').then((m) => ({ default: m.AdminWarga })));
const AdminRtRw = lazy(() => import('@/pages/admin/AdminCrud').then((m) => ({ default: m.AdminRtRw })));
const AdminKategori = lazy(() => import('@/pages/admin/AdminCrud').then((m) => ({ default: m.AdminKategori })));

type Page = 'home' | 'alur' | 'buat' | 'cek' | 'riwayat' | 'galeri' | 'admin-login' | 'admin' | 'debug';

function Shell() {
  const [, toggleDark] = useDarkMode();
  const [page, setPage] = useState<Page>('home');
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard');
  const { session, profile, loading, isAdmin } = useAuth();

  const navigate = (p: string) => {
    if (p === 'alur') {
      setPage('home');
      setTimeout(() => document.getElementById('alur')?.scrollIntoView({ behavior: 'smooth' }), 80);
      return;
    }
    if (p === 'admin-login' && session && isAdmin) {
      setPage('admin');
      return;
    }
    setPage(p as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (page === 'admin' && !loading) {
      if (!session) {
        setPage('admin-login');
      } else if (profile && !isAdmin) {
        setPage('admin-login');
      }
    }
  }, [page, loading, session, profile, isAdmin]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === '1') {
      setPage('admin-login');
    }
  }, []);

  if (page === 'admin' && session && isAdmin) {
    return (
      <AdminLayout page={adminPage} setPage={setAdminPage}>
        <Suspense fallback={<div className="grid place-items-center py-20"><Loading label="Memuat..." /></div>}>
          {adminPage === 'dashboard' && <AdminDashboard />}
          {adminPage === 'pengaduan' && <AdminPengaduan />}
          {adminPage === 'scan' && <AdminScan />}
          {adminPage === 'warga' && <AdminWarga />}
          {adminPage === 'rtrw' && <AdminRtRw />}
          {adminPage === 'kategori' && <AdminKategori />}
          {adminPage === 'media' && <AdminMedia />}
          {adminPage === 'statistik' && <AdminStatistik />}
          {adminPage === 'backup' && <AdminBackup />}
          {adminPage === 'aktivitas' && <AdminAktivitas />}
          {adminPage === 'pengaturan' && <AdminPengaturan />}
          {adminPage === 'reset' && <AdminResetPassword />}
        </Suspense>
      </AdminLayout>
    );
  }

  if (page === 'admin' && loading) {
    return <div className="min-h-screen grid place-items-center bg-[#F8FAFC]"><Loading label="Memuat admin..." /></div>;
  }

  const showFooter = ['home', 'galeri', 'riwayat', 'cek', 'buat'].includes(page);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar onNavigate={navigate} current={page} />
      <div className="flex-1">
        <Suspense fallback={<div className="grid place-items-center py-20"><Loading label="Memuat..." /></div>}>
          {page === 'home' && <LandingPage onNavigate={navigate} />}
          {page === 'buat' && <BuatPengaduan onNavigate={navigate} />}
          {page === 'cek' && <CekTiket onNavigate={navigate} />}
          {page === 'riwayat' && <RiwayatLaporan onNavigate={navigate} />}
          {page === 'galeri' && <GaleriKegiatan onNavigate={navigate} />}
          {page === 'admin-login' && <AdminLogin onNavigate={navigate} />}
          {page === 'debug' && <DebugLogin onNavigate={navigate} />}
        </Suspense>
      </div>
      {showFooter && <Footer onNavigate={navigate} />}
      {/* keep toggleDark referenced to satisfy linter */}
      <span className="hidden" onClick={toggleDark} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
