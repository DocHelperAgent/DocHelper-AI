import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';

interface ShareDialogProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SharedUser {
  id: string;
  email: string;
  role_type: 'viewer' | 'editor';
}

const ShareDialog = ({ documentId, isOpen, onClose }: ShareDialogProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareLink] = useState(`${window.location.origin}/editor/${documentId}`);

  useEffect(() => {
    if (isOpen) {
      loadSharedUsers();
    }
  }, [isOpen, documentId]);

  const loadSharedUsers = async () => {
    try {
      const { data: shares, error: sharesError } = await supabase
        .from('document_shares')
        .select(`
          shared_with,
          role_type,
          users:shared_with (
            id,
            email
          )
        `)
        .eq('document_id', documentId);

      if (sharesError) throw sharesError;

      const formattedShares = shares?.map(share => ({
        id: share.users.id,
        email: share.users.email,
        role_type: share.role_type,
      })) || [];

      setSharedUsers(formattedShares);
    } catch (error) {
      console.error('Error loading shared users:', error);
      setError('Failed to load shared users');
    }
  };

  const handleShare = async () => {
    if (!email) return;
    
    setLoading(true);
    setError('');

    try {
      // First, find the user by email
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) throw new Error('User not found');

      // Then create the share
      const { error: shareError } = await supabase
        .from('document_shares')
        .upsert({
          document_id: documentId,
          shared_with: users.id,
          role_type: role,
        });

      if (shareError) throw shareError;

      setEmail('');
      loadSharedUsers();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('document_shares')
        .delete()
        .eq('document_id', documentId)
        .eq('shared_with', userId);

      if (error) throw error;

      setSharedUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error removing share:', error);
      setError('Failed to remove user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'viewer' | 'editor') => {
    try {
      const { error } = await supabase
        .from('document_shares')
        .update({ role_type: newRole })
        .eq('document_id', documentId)
        .eq('shared_with', userId);

      if (error) throw error;

      setSharedUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, role_type: newRole } : user
        )
      );
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Failed to update role');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Share Document</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Share Link</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
              />
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Share with Email</label>
            <div className="flex items-center space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <Button onClick={handleShare} disabled={loading}>
                Share
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Shared With</h3>
            <div className="space-y-3">
              {sharedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {user.role_type}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={user.role_type}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value as 'viewer' | 'editor')}
                      className="p-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-600"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveShare(user.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {sharedUsers.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No users shared with yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;