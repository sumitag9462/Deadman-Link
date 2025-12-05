import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Bell } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <Card className="p-6 border-slate-800 bg-slate-900">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500 text-2xl font-bold">
             {user?.name?.[0]}
           </div>
           <div>
             <h3 className="text-white font-medium">{user?.name}</h3>
             <p className="text-slate-500 text-sm">{user?.email}</p>
           </div>
        </div>
        <div className="grid gap-4 max-w-xl">
           <Input label="Display Name" defaultValue={user?.name} icon={<User className="w-4 h-4"/>} />
           <Button className="w-fit">Update Profile</Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-800 bg-slate-900">
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
             <Lock className="w-4 h-4 text-emerald-500" /> Security
           </h3>
           <div className="space-y-4">
             <Input type="password" label="Current Password" placeholder="••••••" />
             <Input type="password" label="New Password" placeholder="••••••" />
             <Button variant="secondary">Change Password</Button>
           </div>
        </Card>

        <Card className="p-6 border-slate-800 bg-slate-900">
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
             <Bell className="w-4 h-4 text-emerald-500" /> Notifications
           </h3>
           <div className="space-y-3">
             <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                <span className="text-slate-300 text-sm">Email me on link destruction</span>
                <input type="checkbox" className="accent-emerald-500" defaultChecked />
             </div>
             <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                <span className="text-slate-300 text-sm">Suspicious activity alert</span>
                <input type="checkbox" className="accent-emerald-500" defaultChecked />
             </div>
           </div>
        </Card>
      </div>
    </div>
  );
};
export default Settings;