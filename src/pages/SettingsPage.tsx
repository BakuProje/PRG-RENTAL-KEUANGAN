import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  User,
  Bell,
  MapPin,
  Shield,
  Database,
  Info,
  ChevronRight,
  Check,
  Save,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useApp();
  const [expandedSection, setExpandedSection] = useState<string | null>('profil');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Profile state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  
  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSave = () => {
    // Save profile changes
    if (profileName !== user?.name || profileEmail !== user?.email) {
      updateProfile(profileName, profileEmail);
    }
    
    toast.success('Pengaturan berhasil disimpan!');
    setHasChanges(false);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field password harus diisi');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setIsChangingPassword(true);
    const success = await changePassword(oldPassword, newPassword);
    setIsChangingPassword(false);

    if (success) {
      toast.success('Password berhasil diubah!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Password lama salah');
    }
  };

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  const settingSections = [
    {
      id: 'profil',
      icon: User,
      title: 'Profil',
      description: 'Kelola informasi akun Anda',
      color: 'text-blue-500 bg-blue-500/10',
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Nama Lengkap</Label>
            <Input 
              value={profileName}
              onChange={(e) => {
                setProfileName(e.target.value);
                setHasChanges(true);
              }}
              className="transition-all focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Email</Label>
            <Input 
              value={profileEmail}
              type="email" 
              onChange={(e) => {
                setProfileEmail(e.target.value);
                setHasChanges(true);
              }}
              className="transition-all focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Role</Label>
            <div className="px-4 py-2.5 rounded-lg bg-muted text-muted-foreground border border-border">
              {user?.role === 'admin' ? 'Administrator' : 'Karyawan'}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'notifikasi',
      icon: Bell,
      title: 'Notifikasi',
      description: 'Atur preferensi notifikasi',
      color: 'text-amber-500 bg-amber-500/10',
      content: (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">Notifikasi Hari Minggu</p>
              <p className="text-sm text-muted-foreground">Ingatkan untuk input rental akhir pekan</p>
            </div>
            <Switch defaultChecked onChange={() => setHasChanges(true)} />
          </div>
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">Peringatan Stok Rendah</p>
              <p className="text-sm text-muted-foreground">Notifikasi saat stok hampir habis</p>
            </div>
            <Switch defaultChecked onChange={() => setHasChanges(true)} />
          </div>
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">Laporan Harian</p>
              <p className="text-sm text-muted-foreground">Kirim ringkasan harian via email</p>
            </div>
            <Switch onChange={() => setHasChanges(true)} />
          </div>
        </div>
      ),
    },
    {
      id: 'gps',
      icon: MapPin,
      title: 'GPS & Lokasi',
      description: 'Pengaturan GPS dan peta',
      color: 'text-green-500 bg-green-500/10',
      content: (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">Auto-detect Lokasi</p>
              <p className="text-sm text-muted-foreground">Otomatis ambil lokasi saat buka form</p>
            </div>
            <Switch defaultChecked onChange={() => setHasChanges(true)} />
          </div>
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">High Accuracy Mode</p>
              <p className="text-sm text-muted-foreground">Gunakan GPS presisi tinggi (lebih lambat)</p>
            </div>
            <Switch defaultChecked onChange={() => setHasChanges(true)} />
          </div>
          <div className="p-4">
            <Label className="text-sm font-medium mb-2 block">Timeout GPS (detik)</Label>
            <Input 
              type="number" 
              defaultValue={10} 
              min={5} 
              max={30} 
              onChange={() => setHasChanges(true)}
              className="w-32 transition-all focus:ring-2 focus:ring-primary/20" 
            />
            <p className="text-xs text-muted-foreground mt-2">Waktu maksimal menunggu GPS (5-30 detik)</p>
          </div>
        </div>
      ),
    },
    {
      id: 'inventory',
      icon: Database,
      title: 'Inventory',
      description: 'Pengaturan stok dan barang',
      color: 'text-purple-500 bg-purple-500/10',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <Label className="text-sm font-medium mb-2 block">Minimum Stok PS3</Label>
            <Input 
              type="number" 
              defaultValue={2} 
              min={1} 
              onChange={() => setHasChanges(true)}
              className="w-32 transition-all focus:ring-2 focus:ring-primary/20" 
            />
            <p className="text-xs text-muted-foreground mt-2">Peringatan muncul jika stok ≤ nilai ini</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <Label className="text-sm font-medium mb-2 block">Minimum Stok PS4</Label>
            <Input 
              type="number" 
              defaultValue={1} 
              min={1} 
              onChange={() => setHasChanges(true)}
              className="w-32 transition-all focus:ring-2 focus:ring-primary/20" 
            />
            <p className="text-xs text-muted-foreground mt-2">Peringatan muncul jika stok ≤ nilai ini</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <Label className="text-sm font-medium mb-2 block">Minimum Stok TV</Label>
            <Input 
              type="number" 
              defaultValue={2} 
              min={1} 
              onChange={() => setHasChanges(true)}
              className="w-32 transition-all focus:ring-2 focus:ring-primary/20" 
            />
            <p className="text-xs text-muted-foreground mt-2">Peringatan muncul jika stok ≤ nilai ini</p>
          </div>
        </div>
      ),
    },
    {
      id: 'keamanan',
      icon: Shield,
      title: 'Keamanan',
      description: 'Password dan akses',
      color: 'text-red-500 bg-red-500/10',
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Password Lama</Label>
            <Input 
              type="password" 
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan password lama"
              className="transition-all focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Password Baru</Label>
            <Input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru (min. 6 karakter)"
              className="transition-all focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Konfirmasi Password</Label>
            <Input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi password baru"
              className="transition-all focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleChangePassword}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengubah...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Ubah Password
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Password default: admin123
          </p>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Pengaturan
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola preferensi dan konfigurasi sistem
          </p>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-3">
          {settingSections.map((section, index) => {
            const isExpanded = expandedSection === section.id;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', section.color)}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <h2 className="font-bold text-foreground">{section.title}</h2>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <ChevronRight 
                    className={cn(
                      'w-5 h-5 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-90'
                    )} 
                  />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-border">
                        <div className="pt-5">
                          {section.content}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-primary/5 to-success/5 rounded-xl border border-border p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Tentang Aplikasi</h2>
              <p className="text-sm text-muted-foreground">PS Rental Management System</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-card/50">
              <p className="text-muted-foreground mb-1">Versi</p>
              <p className="font-bold text-foreground">1.0.0</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50">
              <p className="text-muted-foreground mb-1">Build</p>
              <p className="font-bold text-foreground">
                {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-card/50">
              <p className="text-muted-foreground mb-1">Developer</p>
              <p className="font-bold text-foreground">kuzuroken</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50">
              <p className="text-muted-foreground mb-1">Support</p>
              <p className="font-bold text-primary">support@psrental.com</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Powered by</p>
            <p className="font-bold text-primary">PRG (RENTAL)</p>
          </div>
        </motion.div>

        {/* Save Button - Fixed at bottom when changes */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <Button 
                onClick={handleSave}
                size="lg"
                className="gap-2 gradient-primary text-primary-foreground shadow-2xl hover:shadow-3xl"
              >
                <Save className="w-5 h-5" />
                Simpan Perubahan
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
