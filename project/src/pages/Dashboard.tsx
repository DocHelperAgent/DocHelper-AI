import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Plus, FileText, Clock, Star, Folder } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Document {
  id: string;
  title: string;
  updated_at: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    if (user) {
      loadDocuments();
      loadTemplates();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, updated_at')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, description, category')
        .limit(3);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Welcome to DocHelper AI</h2>
        <p className="mb-8">Please sign in to access your documents and templates.</p>
        <Link to="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <Link to="/editor">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Documents</h2>
            <Folder className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400">Loading documents...</p>
            ) : documents.length > 0 ? (
              documents.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/editor/${doc.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated: {new Date(doc.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No recent documents</p>
            )}
            {documents.length > 0 && (
              <Link
                to="/documents"
                className="block mt-4 text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                View all documents →
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Popular Templates</h2>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {loadingTemplates ? (
              <p className="text-gray-500 dark:text-gray-400">Loading templates...</p>
            ) : templates.length > 0 ? (
              templates.map((template) => (
                <Link
                  key={template.id}
                  to={`/editor?template=${template.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {template.category}
                      </p>
                    </div>
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No templates available</p>
            )}
            {templates.length > 0 && (
              <Link
                to="/templates"
                className="block mt-4 text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                View all templates →
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">AI Assistant</h2>
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Let our AI assistant help you create professional documents quickly and easily.
          </p>
          <Link to="/editor">
            <Button variant="outline" className="w-full">
              Start New Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading activity...</p>
          ) : documents.length > 0 ? (
            <div className="space-y-4">
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Updated {new Date(doc.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Link to={`/editor/${doc.id}`}>
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;