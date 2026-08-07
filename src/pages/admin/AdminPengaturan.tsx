import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { toast } from '@/lib/notify';
import { logActivity } from '@/lib/helpers';
import type { AppSettings } from '@/types';
import { Spinner } from '@/components/Loading';
import { Save, Upload, Settings as SettingsIcon, Image as ImageIcon } from 'lucide-react';

export function AdminPengaturan() {
  const { session } = useAuth();
  const [s, setS] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => setS(data));
  }, []);

  if (!s) return <div className="py-20 grid place-items-center"><Spinner className="h-7 w-7 text-brand-600" /></div>;

  const update = (patch: Partial<AppSettings>) => setS({ ...s, ...patch });

  const upload = async (kind: 'logo' | 'banner', file: File) => {
    setUploading(kind);
    const path = `${kind}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('reports').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (error) { toast.error('Upload gagal', error.message); setUploading(null); return; }
    const url = supabase.storage.from('reports').getPublicUrl(path).data.publicUrl;
    update(kind === 'logo' ? { logo_url: url } : { banner_url: url });
    setUploading(null);
    toast.success(kind === 'logo' ? 'Logo diperbarui' : 'Banner diperbarui');
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('settings').update({
      logo_url: s.logo_url,
      rt_name: s.rt_name,
      theme_color: s.theme_color,
      contact_email: s.contact_email,
      contact_whatsapp: s.contact_whatsapp,
      address: s.address,
      banner_url: s.banner_url,
      pengurus_info: s.pengurus_info,
    }).eq('id', 1);
    setSaving(false);
    if (error) toast.error('Gagal simpan', error.message);
    else { toast.success('Pengaturan disimpan'); await logActivity(session?.user?.email ?? 'admin', 'update', 'Pengaturan aplikasi'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Pengaturan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Konfigurasi tampilan dan informasi RT</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Identitas RT" icon={SettingsIcon}>
          <Input label="Nama RT" value={s.rt_name} onChange={(v) => update({ rt_name: v })} />
          <Input label="Email Kontak" value={s.contact_email} onChange={(v) => update({ contact_email: v })} />
          <Input label="Nomor WhatsApp" value={s.contact_whatsapp} onChange={(v) => update({ contact_whatsapp: v })} />
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Alamat</label>
            <textarea value={s.address} onChange={(e) => update({ address: e.target.value })} rows={2} className={cls} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Warna Tema</label>
            <input type="color" value={s.theme_color} onChange={(e) => update({ theme_color: e.target.value })} className="h-11 w-full rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10" />
          </div>
        </Section>

        <Section title="Aset Visual" icon={ImageIcon}>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Logo</label>
            <div className="flex items-center gap-3">
              {s.logo_url ? <img src={s.logo_url} alt="logo" className="h-14 w-14 rounded-xl object-cover" /> : <div className="h-14 w-14 rounded-xl bg-brand-700 text-white grid place-items-center font-bold">RT</div>}
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-semibold cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/20">
                {uploading === 'logo' ? <Spinner /> : <Upload className="h-4 w-4" />} Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload('logo', e.target.files[0])} />
              </label>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">Banner</label>
            {s.banner_url && <img src={s.banner_url} alt="banner" className="rounded-2xl mb-2 max-h-32 object-cover w-full" />}
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-semibold cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/20">
              {uploading === 'banner' ? <Spinner /> : <Upload className="h-4 w-4" />} Upload Banner
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload('banner', e.target.files[0])} />
            </label>
          </div>
        </Section>

        <Section title="Informasi Pengurus" icon={SettingsIcon}>
          <Input label="Ketua RT" value={s.pengurus_info?.ketua ?? ''} onChange={(v) => update({ pengurus_info: { ...s.pengurus_info, ketua: v } })} />
          <Input label="Sekretaris" value={s.pengurus_info?.sekretaris ?? ''} onChange={(v) => update({ pengurus_info: { ...s.pengurus_info, sekretaris: v } })} />
          <Input label="Bendahara" value={s.pengurus_info?.bendahara ?? ''} onChange={(v) => update({ pengurus_info: { ...s.pengurus_info, bendahara: v } })} />
        </Section>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-semibold disabled:opacity-60"
      >
        {saving ? <Spinner /> : <Save className="h-5 w-5" />} Simpan Pengaturan
      </button>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-6 shadow-soft space-y-3">
      <h3 className="font-display font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
        <Icon className="h-5 w-5 text-brand-600" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
    </div>
  );
}

const cls = 'w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
