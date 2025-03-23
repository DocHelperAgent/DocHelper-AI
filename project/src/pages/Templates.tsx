import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { FileText, ArrowRight, Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: { text: string };
}

interface Category {
  id: string;
  name: string;
  count: number;
}

const Templates = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data: templatesData, error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .order('name');

      if (templatesError) throw templatesError;

      setTemplates(templatesData || []);

      // Calculate categories and counts
      const categoryMap = new Map<string, number>();
      templatesData?.forEach((template) => {
        const count = categoryMap.get(template.category) || 0;
        categoryMap.set(template.category, count + 1);
      });

      const categoriesArray = Array.from(categoryMap.entries()).map(([id, count]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        count,
      }));

      setCategories(categoriesArray.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocumentFromTemplate = async (template: Template) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            title: `${template.name} - Copy`,
            content: template.content,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        navigate(`/editor/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating document from template:', error);
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      (!selectedCategory || template.category === selectedCategory) &&
      (template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="mb-8">You need to be signed in to access templates.</p>
        <Link to="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Document Templates</h1>
        <Button variant="outline">
          Request Template
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <Button
          variant={selectedCategory ? 'default' : 'ghost'}
          onClick={() => setSelectedCategory(null)}
        >
          All Categories
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md cursor-pointer transition-all duration-200 ${
              selectedCategory === category.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedCategory(
              selectedCategory === category.id ? null : category.id
            )}
          >
            <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {category.count} template{category.count !== 1 ? 's' : ''}
            </p>
            <Button variant="ghost" className="w-full">
              {selectedCategory === category.id ? 'Show All' : 'View Category'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Loading templates...</p>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-500">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {template.category}
                    </p>
                  </div>
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {template.description}
                </p>
                <Button
                  onClick={() => createDocumentFromTemplate(template)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No templates found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "No templates match your search"
              : "No templates available in this category"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Templates;