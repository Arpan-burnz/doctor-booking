'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Save, CheckCircle2 } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then((res) => {
        if (res.data.success) {
          setSettings(res.data.data);
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading || !settings) {
    return <div className="p-8 text-zinc-400">Loading settings...</div>;
  }

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: !prev.config[key]
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', settings.config);
      alert('Settings saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Switch UI component
  const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-purple-600' : 'bg-zinc-700'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Platform settings</h1>
          <p className="text-sm text-zinc-400 font-medium">Configure DOC4U platform behaviour</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 border border-zinc-700 bg-[#1a1a1d] hover:bg-zinc-800 text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95 text-zinc-200 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Platform Configuration */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800/50">
            <h2 className="text-lg font-bold text-zinc-100">Platform configuration</h2>
          </div>
          
          <div className="divide-y divide-zinc-800/50">
            {/* New registrations */}
            <div className="p-5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-100">New registrations</h3>
                <p className="text-sm font-medium text-zinc-400">Allow new patients to sign up</p>
              </div>
              <Switch checked={settings.config.newRegistrations} onChange={() => handleToggle('newRegistrations')} />
            </div>

            {/* Doctor self-registration */}
            <div className="p-5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-100">Doctor self-registration</h3>
                <p className="text-sm font-medium text-zinc-400">Doctors can apply via register page</p>
              </div>
              <Switch checked={settings.config.doctorRegistration} onChange={() => handleToggle('doctorRegistration')} />
            </div>

            {/* Email notifications */}
            <div className="p-5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-100">Email notifications</h3>
                <p className="text-sm font-medium text-zinc-400">Confirmation and reminder emails</p>
              </div>
              <Switch checked={settings.config.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
            </div>

            {/* SMS notifications */}
            <div className="p-5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-100">SMS notifications</h3>
                <p className="text-sm font-medium text-zinc-400">Twilio SMS reminders active</p>
              </div>
              <Switch checked={settings.config.smsNotifications} onChange={() => handleToggle('smsNotifications')} />
            </div>

            {/* Maintenance mode */}
            <div className="p-5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-100">Maintenance mode</h3>
                <p className="text-sm font-medium text-zinc-400">Take platform offline for users</p>
              </div>
              <Switch checked={settings.config.maintenanceMode} onChange={() => handleToggle('maintenanceMode')} />
            </div>
          </div>
        </div>

        {/* Right Column: Admin Accounts + System Health */}
        <div className="space-y-6">
          
          {/* Admin Accounts */}
          <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800/50">
              <h2 className="text-lg font-bold text-zinc-100">Admin accounts</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="divide-y divide-zinc-800/50">
                {settings.admins.map((admin: any, index: number) => {
                  const isSuper = index === 0;
                  return (
                    <div key={admin.id} className="py-4 first:pt-0 flex items-center justify-between gap-4">
                      <div className="font-semibold text-zinc-200 truncate">
                        {admin.email}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md shrink-0 ${isSuper ? 'bg-purple-900/30 text-purple-400' : 'bg-green-900/30 text-green-500'}`}>
                        {isSuper ? 'Super admin' : 'Moderator'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button className="w-full py-2 border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-sm font-semibold rounded-xl transition-colors text-zinc-200 mt-2">
                + Add admin account
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800/50">
              <h2 className="text-lg font-bold text-zinc-100">System health</h2>
            </div>
            <div className="p-5 space-y-0 divide-y divide-zinc-800/50">
              {/* API */}
              <div className="py-3 flex items-center justify-between">
                <span className="font-semibold text-zinc-200 text-sm">API server</span>
                <div className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{settings.health.api ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              
              {/* Database */}
              <div className="py-3 flex items-center justify-between">
                <span className="font-semibold text-zinc-200 text-sm">PostgreSQL</span>
                <div className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{settings.health.db ? 'Online' : 'Offline'}</span>
                </div>
              </div>

              {/* Email */}
              <div className="py-3 flex items-center justify-between">
                <span className="font-semibold text-zinc-200 text-sm">Email service</span>
                <div className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{settings.health.email ? 'Online' : 'Offline'}</span>
                </div>
              </div>

              {/* Cron */}
              <div className="py-3 flex items-center justify-between">
                <span className="font-semibold text-zinc-200 text-sm">Cron jobs</span>
                <div className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{settings.health.cron ? 'Running' : 'Stopped'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
