// client/src/pages/Settings/Profile.jsx - NEW FILE

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, Shield, Save, Camera } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuthStore from '../../stores/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    vehicleInfo: '',
    vehicleNumber: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        vehicleInfo: user.vehicleInfo || '',
        vehicleNumber: user.vehicleNumber || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call API to update profile (you'll need to create this endpoint)
      await authAPI.updateProfile(formData);
      await updateUser(); // Refresh user data in store
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: 'Administrator', color: 'bg-black text-white' },
      driver: { label: 'Fleet Driver', color: 'bg-blue-100 text-blue-700' },
      user: { label: 'Standard User', color: 'bg-brand-zinc-100 text-brand-zinc-700' },
    };
    const badge = badges[role] || badges.user;
    return (
      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout title="Profile & Settings">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Header Card */}
        <Card variant="elevated" className="relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-32 from-brand-zinc-50 to-brand-zinc-100" />
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 pt-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-sm bg-black flex items-center justify-center text-white text-3xl font-bold">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button className="absolute inset-0 bg-black/60 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-tight mb-2">{user?.displayName}</h2>
              <p className="text-brand-zinc-500 text-sm mb-3">{user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {getRoleBadge(user?.role)}
                <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Basic Information */}
            <Card>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-brand-zinc-100">
                <User size={18} />
                <h3 className="font-bold tracking-tight">Basic Information</h3>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  name="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  icon={User}
                  required
                />
                
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  icon={Mail}
                  className="bg-brand-zinc-50 cursor-not-allowed"
                />
                
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  icon={Phone}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </Card>

            {/* Role-Specific Info */}
            <Card>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-brand-zinc-100">
                <Briefcase size={18} />
                <h3 className="font-bold tracking-tight">
                  {user?.role === 'driver' ? 'Vehicle Details' : 'Account Details'}
                </h3>
              </div>
              
              <div className="space-y-4">
                {user?.role === 'driver' ? (
                  <>
                    <Input
                      label="Vehicle Information"
                      name="vehicleInfo"
                      value={formData.vehicleInfo}
                      onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
                      placeholder="e.g., Toyota Camry 2020"
                    />
                    
                    <Input
                      label="Vehicle License"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      placeholder="e.g., ABC-1234"
                    />
                  </>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-3 border-b border-brand-zinc-100">
                      <span className="text-brand-zinc-500">Member Since</span>
                      <span className="font-medium">
                        {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-brand-zinc-100">
                      <span className="text-brand-zinc-500">Last Login</span>
                      <span className="font-medium">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-brand-zinc-500">Account Status</span>
                      <span className="font-medium text-green-600">Active</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

          </div>

          {/* Action Buttons */}
          <Card className="mt-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <p className="text-sm text-brand-zinc-500">
                Changes will be reflected immediately across all sessions.
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    setFormData({
                      displayName: user?.displayName || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      vehicleInfo: user?.vehicleInfo || '',
                      vehicleNumber: user?.vehicleNumber || '',
                    });
                  }}
                >
                  Reset
                </Button>
                <Button 
                  type="submit" 
                  loading={loading}
                  className="flex-1 sm:flex-none"
                  icon={Save}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </form>

        {/* Security Section */}
        <Card variant="bordered">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-brand-zinc-100">
            <Shield size={18} />
            <h3 className="font-bold tracking-tight">Security</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Password</p>
                <p className="text-xs text-brand-zinc-500">Last changed 3 months ago</p>
              </div>
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-brand-zinc-100">
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-brand-zinc-500">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">
                Enable 2FA
              </Button>
            </div>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}