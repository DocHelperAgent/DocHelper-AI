import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { User, Bell, Shield, CreditCard, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

const RESET_COOLDOWN = 60; // 60 seconds cooldown

const Settings = () => {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState({
    documentUpdates: false,
    comments: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    let timer: number;
    if (resetCooldown > 0) {
      timer = window.setInterval(() => {
        setResetCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resetCooldown]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (resetCooldown > 0) {
      setMessage({ 
        text: `Please wait ${resetCooldown} seconds before requesting another password reset.`,
        type: 'error'
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
        redirectTo: `${window.location.origin}/settings`,
      });

      if (error) {
        if (error.message.includes('rate_limit')) {
          setResetCooldown(RESET_COOLDOWN);
          throw new Error('Please wait before requesting another password reset.');
        }
        throw error;
      }

      setMessage({ 
        text: 'Password reset email sent. Please check your inbox.', 
        type: 'success' 
      });
      setResetCooldown(RESET_COOLDOWN);
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const handleNotificationChange = (key: keyof typeof emailNotifications) => {
    setEmailNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <User className="w-6 h-6 text-blue-500 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Profile Settings</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Manage your account details and preferences
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <Bell className="w-6 h-6 text-purple-500 dark:text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Configure how you want to receive notifications
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={emailNotifications.documentUpdates}
                onChange={() => handleNotificationChange('documentUpdates')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Email notifications for document updates
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={emailNotifications.comments}
                onChange={() => handleNotificationChange('comments')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Email notifications for comments
              </span>
            </label>
            <Button onClick={() => setMessage({ text: 'Notification preferences saved!', type: 'success' })}>
              Save Preferences
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <Shield className="w-6 h-6 text-green-500 dark:text-green-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Security</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Manage your security preferences
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Change your password or update security settings
            </p>
            <Button 
              variant="outline" 
              onClick={handleChangePassword}
              disabled={resetCooldown > 0}
            >
              <Shield className="w-4 h-4 mr-2" />
              {resetCooldown > 0 
                ? `Wait ${resetCooldown}s to reset password`
                : 'Change Password'
              }
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
              <CreditCard className="w-6 h-6 text-orange-500 dark:text-orange-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Billing</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Manage your subscription and payment methods
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are currently on the <span className="font-semibold">Free Plan</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Upgrade to access premium features
              </p>
            </div>
            <Button variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;