import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDate, formatDateShort, logActivity } from '@/lib/helpers';
import { toast, alert } from '@/lib/notify';
import type { Report, ReportStatus, Category } from '@/types';
import { STATUS_LABEL, STATUS_COLOR, PRIORITY_LABEL } from '@/types';
import { Loading, Spinner } from '@/components/Loading';
import { QrCode } from '@/components/QrCode';
import { exportReportPdf } from '@/lib/pdf';
import { Search, Eye, FileDown, X, Save, Upload, Printer } from 'lucide-react';

export function AdminPengaduan() {
  const { session } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [selected, setSelected] = useState<Report | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    supabase
      .from('reports')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data ?? []));
  }, []);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          r.ticket_number.toLowerCase().includes(s) ||
          r.title.toLowerCase().includes(s) ||
          r.reporter_name.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [reports, q, statusFilter]);

  const openDetail = (r: Report) => {
    setSelected(r);
    setDetailLoading(false);
  };

  const updateReport = async (patch: Partial<Report>, action: string) => {
    if (!selected) return;
    setDetailLoading(true);
    const { error } = await supabase
      .from('reports')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    if (error) {
      toast.error('Gagal memperbarui', error.message);
      setDetailLoading(false);
      return;
    }
    const updated = { ...selected, ...patch };
    setSelected(updated);
    setReports((rs) => rs.map((r) => (r.id === selected.id ? updated : r)));
    await logActivity(session?.user?.email ?? 'admin', action, `${selected.ticket_number}`);
    toast.success('Berhasil diperbarui');
    setDetailLoading(false);
  };

  const changeStatus = async (status: ReportStatus) => {
    if (!selected) return;
    const ok = await alert.confirm('Ubah status?', `Status akan diubah menjadi "${STATUS_LABEL[status]}".`);
    if (!ok) return;
    await updateReport({ status }, `Ubah status ke ${STATUS_LABEL[status]}`);
    await supabase.from('report_timeline').insert({
      report_id: selected.id,
      status,
      note: selected.admin_note ?? null,
      officer: session?.user?.email ?? 'Admin',
    });
  };

  const saveNote = async (note: string, officer: string) => {
    await updateReport({ admin_note: note, assigned_officer: officer }, 'Tambah catatan admin');
  };

  const uploadFollowUp = async (file: File) => {
    if (!selected) return;
    const path = `tindaklanjut-${selected.ticket_number}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('reports').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (error) {
      toast.error('Upload gagal', error.message);
      return;
    }
    const url = supabase.storage.from('reports').getPublicUrl(path).data.publicUrl;
    await updateReport({ follow_up_photo_url: url }, 'Upload foto tindak lanjut');
  };

  const printPdf = (r: Report) => {
    const cat = categories.find((c) => c.id === r.category_id)?.name ?? '-';
    exportReportPdf({ ...r, categoryName: cat });
    logActivity(session?.user?.email ?? 'admin', 'Cetak PDF', r.ticket_number);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Pengaduan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Kelola seluruh laporan warga</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl glass text-sm font-semibold text-slate-700 dark:text-slate-200">
          Muat ulang
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari tiket, judul, nama..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'menunggu', 'diproses', 'selesai'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                statusFilter === s ? 'bg-brand-700 text-white' : 'glass text-slate-600 dark:text-slate-300'
              }`}
            >
              {s === 'all' ? 'Semua' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-3xl shadow-soft overflow-hidden">
        {loading ? (
          <Loading className="py-20" />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">Tidak ada pengaduan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-white/10">
                  <th className="px-4 py-3 font-semibold">Tiket</th>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Judul</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100/70 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-mono font-semibold text-brand-700 dark:text-brand-300 whitespace-nowrap">
                      {r.ticket_number}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">{r.reporter_name}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-[200px] truncate">{r.title}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.category?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateShort(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: STATUS_COLOR[r.status] }}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(r)} className="grid place-items-center h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-100">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => printPdf(r)} className="grid place-items-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200">
                          <FileDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          report={selected}
          loading={detailLoading}
          onClose={() => setSelected(null)}
          onChangeStatus={changeStatus}
          onSaveNote={saveNote}
          onUploadFollowUp={uploadFollowUp}
          onPrint={() => printPdf(selected)}
        />
      )}
    </div>
  );
}

function DetailModal({
  report, loading, onClose, onChangeStatus, onSaveNote, onUploadFollowUp, onPrint,
}: {
  report: Report;
  loading: boolean;
  onClose: () => void;
  onChangeStatus: (s: ReportStatus) => void;
  onSaveNote: (note: string, officer: string) => void;
  onUploadFollowUp: (f: File) => void;
  onPrint: () => void;
}) {
  const [note, setNote] = useState(report.admin_note ?? '');
  const [officer, setOfficer] = useState(report.assigned_officer ?? '');

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl shadow-soft p-6 sm:p-7 animate-scale-in">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="font-mono font-bold text-brand-800 dark:text-brand-200">{report.ticket_number}</div>
            <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">{report.title}</h3>
          </div>
          <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
          <Cell label="Pelapor" value={report.reporter_name} />
          <Cell label="HP" value={report.reporter_phone} />
          <Cell label="Alamat" value={report.reporter_address} />
          <Cell label="RT/RW" value={report.rt_rw} />
          <Cell label="Lokasi Kejadian" value={report.location ?? '-'} />
          <Cell label="Prioritas" value={PRIORITY_LABEL[report.priority]} />
          <Cell label="Kategori" value={report.category?.name ?? '-'} />
          <Cell label="Tanggal" value={formatDate(report.created_at)} />
        </div>

        <div className="rounded-2xl bg-white/60 dark:bg-white/5 p-4 mb-4">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Deskripsi</div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.description}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {report.photo_url && (
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Foto Pengaduan</div>
              <img src={report.photo_url} alt="bukti" className="rounded-2xl max-h-48 object-cover w-full" />
            </div>
          )}
          {report.follow_up_photo_url && (
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Foto Tindak Lanjut</div>
              <img src={report.follow_up_photo_url} alt="tindak lanjut" className="rounded-2xl max-h-48 object-cover w-full" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: STATUS_COLOR[report.status] }}>
              {STATUS_LABEL[report.status]}
            </span>
          </div>
          <div className="flex gap-2 ml-auto">
            {(['menunggu', 'diproses', 'selesai'] as const).map((s) => (
              <button
                key={s}
                disabled={loading || report.status === s}
                onClick={() => onChangeStatus(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40"
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* QR */}
        <div className="flex items-center gap-4 rounded-2xl bg-white/60 dark:bg-white/5 p-4 mb-5">
          <QrCode value={report.ticket_number} size={110} />
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-100">QR Tiket</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scan untuk melihat detail pengaduan ini.</p>
          </div>
        </div>

        {/* Note + officer */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Petugas Penanggung Jawab</label>
            <input value={officer} onChange={(e) => setOfficer(e.target.value)} className={inputCls} placeholder="Nama petugas" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Catatan Admin</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputCls} placeholder="Catatan tindak lanjut..." />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={loading}
              onClick={() => onSaveNote(note, officer)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? <Spinner /> : <Save className="h-4 w-4" />} Simpan Catatan
            </button>
            <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/20">
              <Upload className="h-4 w-4" /> Upload Foto Tindak Lanjut
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadFollowUp(e.target.files[0])} />
            </label>
            <button onClick={onPrint} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-900/20">
              <Printer className="h-4 w-4" /> Cetak PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/60 dark:bg-white/5 px-3 py-2">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="font-medium text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
