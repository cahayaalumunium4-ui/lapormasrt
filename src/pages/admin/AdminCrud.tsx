import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDateShort, logActivity } from '@/lib/helpers';
import { toast, alert } from '@/lib/notify';
import type { Resident } from '@/types';
import { Loading, Spinner } from '@/components/Loading';
import { Plus, Pencil, Trash2, X, Users, Phone, MapPin, Save } from 'lucide-react';

export function AdminWarga() {
  const { session } = useAuth();
  const [items, setItems] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', rt_rw: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    supabase.from('residents').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const openNew = () => { setEditing(null); setForm({ name: '', phone: '', address: '', rt_rw: '' }); setShowForm(true); };
  const openEdit = (r: Resident) => { setEditing(r); setForm({ name: r.name, phone: r.phone, address: r.address, rt_rw: r.rt_rw }); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.rt_rw) { toast.error('Lengkapi semua field'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('residents').update(form).eq('id', editing.id);
      if (error) toast.error('Gagal', error.message);
      else { toast.success('Diperbarui'); await logActivity(session?.user?.email ?? 'admin', 'update', `Warga: ${form.name}`); }
    } else {
      const { error } = await supabase.from('residents').insert(form);
      if (error) toast.error('Gagal', error.message);
      else { toast.success('Ditambahkan'); await logActivity(session?.user?.email ?? 'admin', 'create', `Warga: ${form.name}`); }
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const remove = async (r: Resident) => {
    if (!(await alert.confirm('Hapus warga?', r.name))) return;
    const { error } = await supabase.from('residents').delete().eq('id', r.id);
    if (error) toast.error('Gagal', error.message);
    else { toast.success('Dihapus'); await logActivity(session?.user?.email ?? 'admin', 'delete', `Warga: ${r.name}`); load(); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <Header title="Data Warga" desc="Daftar warga terdaftar" onAdd={openNew} addLabel="Tambah Warga" />
      {loading ? <Loading className="py-16" /> : items.length === 0 ? <Empty icon={Users} text="Belum ada data warga." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="grid place-items-center h-10 w-10 rounded-xl bg-brand-700 text-white font-bold">{r.name.slice(0, 1).toUpperCase()}</div>
                <div className="flex gap-1">
                  <IconBtn onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></IconBtn>
                  <IconBtn onClick={() => remove(r)} danger><Trash2 className="h-4 w-4" /></IconBtn>
                </div>
              </div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white mt-3">{r.name}</h3>
              <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {r.phone}</div>
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {r.address} • RT {r.rt_rw}</div>
                <div className="text-slate-400">Terdaftar {formatDateShort(r.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Warga' : 'Tambah Warga'} onClose={() => setShowForm(false)}>
          <form onSubmit={save} className="space-y-3">
            <Input label="Nama" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Nomor HP" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Alamat" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Input label="RT/RW" value={form.rt_rw} onChange={(v) => setForm({ ...form, rt_rw: v })} />
            <button disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold disabled:opacity-60">
              {saving ? <Spinner /> : <Save className="h-4 w-4" />} Simpan
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ===== RT/RW =====
export function AdminRtRw() {
  const { session } = useAuth();
  const [items, setItems] = useState<{ id: string; rt: string; rw: string; head_name: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<typeof items[number] | null>(null);
  const [form, setForm] = useState({ rt: '', rw: '', head_name: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    supabase.from('rt_rw').select('*').order('created_at', { ascending: false }).then(({ data }) => { setItems(data ?? []); setLoading(false); });
  };
  useEffect(load, []);

  const openNew = () => { setEditing(null); setForm({ rt: '', rw: '', head_name: '' }); setShowForm(true); };
  const openEdit = (r: typeof items[number]) => { setEditing(r); setForm({ rt: r.rt, rw: r.rw, head_name: r.head_name ?? '' }); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rt || !form.rw) { toast.error('RT dan RW wajib diisi'); return; }
    setSaving(true);
    const payload = { rt: form.rt, rw: form.rw, head_name: form.head_name || null };
    if (editing) {
      const { error } = await supabase.from('rt_rw').update(payload).eq('id', editing.id);
      if (error) toast.error('Gagal', error.message); else { toast.success('Diperbarui'); await logActivity(session?.user?.email ?? 'admin', 'update', `RT/RW ${form.rt}/${form.rw}`); }
    } else {
      const { error } = await supabase.from('rt_rw').insert(payload);
      if (error) toast.error('Gagal', error.message); else { toast.success('Ditambahkan'); await logActivity(session?.user?.email ?? 'admin', 'create', `RT/RW ${form.rt}/${form.rw}`); }
    }
    setSaving(false); setShowForm(false); load();
  };

  const remove = async (r: typeof items[number]) => {
    if (!(await alert.confirm('Hapus data ini?', `RT ${r.rt} / RW ${r.rw}`))) return;
    const { error } = await supabase.from('rt_rw').delete().eq('id', r.id);
    if (error) toast.error('Gagal', error.message); else { toast.success('Dihapus'); await logActivity(session?.user?.email ?? 'admin', 'delete', `RT/RW ${r.rt}/${r.rw}`); load(); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <Header title="Data RT/RW" desc="Daftar RT dan RW" onAdd={openNew} addLabel="Tambah RT/RW" />
      {loading ? <Loading className="py-16" /> : items.length === 0 ? <Empty icon={MapPin} text="Belum ada data RT/RW." /> : (
        <div className="glass rounded-3xl shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-white/10">
              <th className="px-4 py-3">RT</th><th className="px-4 py-3">RW</th><th className="px-4 py-3">Ketua</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-slate-100/70 dark:border-white/5">
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{r.rt}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.rw}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.head_name ?? '-'}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1.5">
                    <IconBtn onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></IconBtn>
                    <IconBtn onClick={() => remove(r)} danger><Trash2 className="h-4 w-4" /></IconBtn>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <Modal title={editing ? 'Edit RT/RW' : 'Tambah RT/RW'} onClose={() => setShowForm(false)}>
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="RT" value={form.rt} onChange={(v) => setForm({ ...form, rt: v })} />
              <Input label="RW" value={form.rw} onChange={(v) => setForm({ ...form, rw: v })} />
            </div>
            <Input label="Nama Ketua" value={form.head_name} onChange={(v) => setForm({ ...form, head_name: v })} />
            <button disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold disabled:opacity-60">
              {saving ? <Spinner /> : <Save className="h-4 w-4" />} Simpan
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ===== Kategori =====
export function AdminKategori() {
  const { session } = useAuth();
  const [items, setItems] = useState<{ id: string; name: string; icon: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<typeof items[number] | null>(null);
  const [form, setForm] = useState({ name: '', icon: 'Tag', color: '#1E40AF' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    supabase.from('categories').select('*').order('name').then(({ data }) => { setItems(data ?? []); setLoading(false); });
  };
  useEffect(load, []);

  const openNew = () => { setEditing(null); setForm({ name: '', icon: 'Tag', color: '#1E40AF' }); setShowForm(true); };
  const openEdit = (r: typeof items[number]) => { setEditing(r); setForm({ name: r.name, icon: r.icon, color: r.color }); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Nama kategori wajib diisi'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('categories').update(form).eq('id', editing.id);
      if (error) toast.error('Gagal', error.message); else { toast.success('Diperbarui'); await logActivity(session?.user?.email ?? 'admin', 'update', `Kategori: ${form.name}`); }
    } else {
      const { error } = await supabase.from('categories').insert(form);
      if (error) toast.error('Gagal', error.message); else { toast.success('Ditambahkan'); await logActivity(session?.user?.email ?? 'admin', 'create', `Kategori: ${form.name}`); }
    }
    setSaving(false); setShowForm(false); load();
  };

  const remove = async (r: typeof items[number]) => {
    if (!(await alert.confirm('Hapus kategori?', r.name))) return;
    const { error } = await supabase.from('categories').delete().eq('id', r.id);
    if (error) toast.error('Gagal', error.message); else { toast.success('Dihapus'); await logActivity(session?.user?.email ?? 'admin', 'delete', `Kategori: ${r.name}`); load(); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <Header title="Kategori Pengaduan" desc="Kelola kategori laporan warga" onAdd={openNew} addLabel="Tambah Kategori" />
      {loading ? <Loading className="py-16" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-5 shadow-soft flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center h-11 w-11 rounded-xl text-white font-bold" style={{ backgroundColor: c.color }}>{c.name.slice(0, 1)}</span>
                <div>
                  <div className="font-display font-bold text-slate-900 dark:text-white">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.icon}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <IconBtn onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></IconBtn>
                <IconBtn onClick={() => remove(c)} danger><Trash2 className="h-4 w-4" /></IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title={editing ? 'Edit Kategori' : 'Tambah Kategori'} onClose={() => setShowForm(false)}>
          <form onSubmit={save} className="space-y-3">
            <Input label="Nama Kategori" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Ikon (lucide name)" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Warna</label>
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-11 w-full rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10" />
            </div>
            <button disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold disabled:opacity-60">
              {saving ? <Spinner /> : <Save className="h-4 w-4" />} Simpan
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ===== Shared bits =====
function Header({ title, desc, onAdd, addLabel }: { title: string; desc: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
      <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold">
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}

function IconBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`grid place-items-center h-8 w-8 rounded-lg ${danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200'}`}>
      {children}
    </button>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="glass rounded-3xl p-12 text-center">
      <Icon className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-3xl shadow-soft p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
