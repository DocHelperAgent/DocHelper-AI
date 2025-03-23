import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Save, Share2, Download, MessageSquare, Wand2, Type } from 'lucide-react';
import { saveAs } from 'file-saver';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import ShareDialog from '../components/ShareDialog';

const templates = {
  contract: `GENERAL CONTRACT AGREEMENT

This Contract Agreement ("Agreement") is made and entered into as of [Date], by and between:

Party 1: [Full Name / Company Name]
Address: [Address]
Hereinafter referred to as "Party A"

Party 2: [Full Name / Company Name]
Address: [Address]
Hereinafter referred to as "Party B"

Collectively referred to as "the Parties."

1. SCOPE OF AGREEMENT
   Party A agrees to [describe the services, goods, or obligations], and Party B agrees to [describe the compensation, exchange, or obligations] as per the terms and conditions set forth in this Agreement.

2. TERM & TERMINATION
   2.1. This Agreement shall commence on [Start Date] and remain in effect until [End Date] or until terminated by either Party with [number] days written notice.
   2.2. Either Party may terminate this Agreement if the other Party breaches any material term and fails to remedy the breach within [number] days.

3. PAYMENT TERMS
   3.1. Party B agrees to pay Party A [Amount] for the services/goods.
   3.2. Payments shall be made [weekly/monthly/lump sum] via [payment method].
   3.3. All payments are due within [number] days of invoice receipt.

4. CONFIDENTIALITY
   Both Parties agree to keep confidential any proprietary or sensitive information shared during the course of this Agreement.

5. LIABILITY & INDEMNIFICATION
   5.1. Each Party shall not be held liable for any indirect damages arising from this Agreement.
   5.2. Party A agrees to indemnify Party B against any claims resulting from [specific liabilities] and vice versa.

6. GOVERNING LAW
   This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction].

7. DISPUTE RESOLUTION
   Any disputes arising from this Agreement shall be resolved through [mediation/arbitration/court proceedings] in [Jurisdiction].

8. ENTIRE AGREEMENT
   This Agreement represents the entire understanding between the Parties and supersedes all prior agreements or negotiations.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

Party A:
Signature: ____________________
Name: ____________________
Title: ____________________
Date: ____________________

Party B:
Signature: ____________________
Name: ____________________
Title: ____________________
Date: ____________________`,

  agreement: `BUSINESS AGREEMENT

This Business Agreement (the "Agreement") is made effective as of [Date]

BETWEEN:

[Company/Individual Name A]
[Address]
[Contact Information]

AND:

[Company/Individual Name B]
[Address]
[Contact Information]

1. PURPOSE
   [Clearly describe the purpose and objectives of this agreement]

2. TERMS AND CONDITIONS
   2.1. [Key term 1]
   2.2. [Key term 2]
   2.3. [Key term 3]

3. DURATION
   3.1. This agreement commences on [Start Date]
   3.2. This agreement terminates on [End Date]

4. RESPONSIBILITIES
   4.1. Party A Responsibilities:
        - [Responsibility 1]
        - [Responsibility 2]
   
   4.2. Party B Responsibilities:
        - [Responsibility 1]
        - [Responsibility 2]

5. SIGNATURES

________________________
[Name]
[Title]
[Company A]
Date: ___________________


________________________
[Name]
[Title]
[Company B]
Date: ___________________`,

  resume: `PROFESSIONAL RESUME

[Your Full Name]
[Phone Number] | [Email] | [LinkedIn]
[Location]

PROFESSIONAL SUMMARY
[2-3 sentences highlighting your key professional attributes and career goals]

SKILLS
Technical Skills:
• [Skill 1]
• [Skill 2]
• [Skill 3]

Soft Skills:
• [Skill 1]
• [Skill 2]
• [Skill 3]

PROFESSIONAL EXPERIENCE

[Company Name] | [Location]
[Job Title] | [Start Date] - [End Date]
• [Achievement/Responsibility 1]
• [Achievement/Responsibility 2]
• [Achievement/Responsibility 3]

[Previous Company] | [Location]
[Job Title] | [Start Date] - [End Date]
• [Achievement/Responsibility 1]
• [Achievement/Responsibility 2]
• [Achievement/Responsibility 3]

EDUCATION

[Degree] in [Field]
[Institution Name] | [Graduation Year]
• GPA: [X.XX] (if applicable)
• Relevant Coursework: [List key courses]
• Honors/Awards: [If applicable]

CERTIFICATIONS
• [Certification Name] | [Issuing Organization] | [Year]
• [Certification Name] | [Issuing Organization] | [Year]

LANGUAGES
• [Language 1]: [Proficiency Level]
• [Language 2]: [Proficiency Level]`,

  empty: ""
};

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('Untitled Document');
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof templates>("empty");
  const [content, setContent] = useState('');
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('How can I help you with your document?');
  const [userMessage, setUserMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:3003/health');
        if (!response.ok) throw new Error('Server health check failed');
        const data = await response.json();
        setServerStatus(data.aiService === 'available' ? 'online' : 'offline');
      } catch (error) {
        console.error('Server health check failed:', error);
        setServerStatus('offline');
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id, user]);

  const loadDocument = async () => {
    if (!user) {
      setSaveStatus('Please sign in to load documents');
      return;
    }

    if (!id) {
      setSaveStatus('No document ID provided');
      return;
    }

    setIsLoading(true);
    setSaveStatus('Loading document...');

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setContent(data.content.text || '');
        setSaveStatus('Document loaded successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Document not found');
        navigate('/editor', { replace: true });
      }
    } catch (error: any) {
      console.error('Error loading document:', error);
      setSaveStatus(`Error: ${error.message || 'Failed to load document'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!user) {
      setSaveStatus('Please sign in to save documents');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Saving...');

    try {
      const documentData = {
        title,
        content: { text: content },
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      let response;

      if (id) {
        // Update existing document
        response = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new document
        response = await supabase
          .from('documents')
          .insert([documentData])
          .select()
          .single();
      }

      if (response.error) throw response.error;

      setSaveStatus('Document saved successfully!');
      
      if (!id && response.data?.id) {
        navigate(`/editor/${response.data.id}`, { replace: true });
      }
    } catch (error: any) {
      console.error('Error saving document:', error);
      setSaveStatus(`Error: ${error.message || 'Failed to save document'}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        if (saveStatus === 'Document saved successfully!') {
          setSaveStatus('');
        }
      }, 3000);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value as keyof typeof templates;
    setSelectedTemplate(template);
    if (template !== 'empty') {
      setContent(templates[template]);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.txt`);
  };

  const handleAISuggestion = async () => {
    if (serverStatus === 'offline') {
      setAiMessage("The AI service is currently unavailable. Please ensure the server is running and try again.");
      setShowAiAssistant(true);
      return;
    }

    if (!content.trim()) {
      setAiMessage("Please add some content to your document first.");
      setShowAiAssistant(true);
      return;
    }

    setIsImproving(true);
    setIsProcessing(true);
    setAiMessage("Processing your request...");
    setAiError(null);
    setShowAiAssistant(true);

    try {
      const response = await fetch('http://localhost:3003/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get AI suggestion');
      }

      const data = await response.json();
      
      if (!data || typeof data.suggestion !== 'string') {
        throw new Error('Invalid response format from AI service');
      }

      setContent(data.suggestion);
      setAiMessage("Document improved! Here's the enhanced version.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Error getting AI suggestion:', errorMessage);
      setAiError(errorMessage);
      setAiMessage(`Failed to improve document. ${errorMessage}`);
    } finally {
      setIsImproving(false);
      setIsProcessing(false);
    }
  };

  const handleFormatDocument = async () => {
    if (serverStatus === 'offline') {
      setAiMessage("The AI service is currently unavailable. Please ensure the server is running and try again.");
      setShowAiAssistant(true);
      return;
    }

    if (!content.trim()) {
      setAiMessage("Please add some content to your document first.");
      setShowAiAssistant(true);
      return;
    }

    setIsFormatting(true);
    setIsProcessing(true);
    setAiMessage("Formatting your document...");
    setAiError(null);
    setShowAiAssistant(true);

    try {
      const response = await fetch('http://localhost:3003/api/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to format document');
      }

      const data = await response.json();
      
      if (!data || typeof data.formattedText !== 'string') {
        throw new Error('Invalid response format from formatting service');
      }

      setContent(data.formattedText);
      setAiMessage("Document formatted successfully! The text has been structured with headings, bullet points, and emphasis.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Error formatting document:', errorMessage);
      setAiError(errorMessage);
      setAiMessage(`Failed to format document. ${errorMessage}`);
    } finally {
      setIsFormatting(false);
      setIsProcessing(false);
    }
  };

  const handleAssistantMessage = async () => {
    if (serverStatus === 'offline') {
      setAiMessage("The AI service is currently unavailable. Please ensure the server is running and try again.");
      return;
    }

    if (!userMessage.trim()) {
      setAiMessage("Please enter a question or request.");
      return;
    }

    setIsProcessing(true);
    setAiMessage("Processing your request...");
    setAiError(null);

    try {
      const response = await fetch('http://localhost:3003/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: `${userMessage}\n\nDocument Content:\n${content}` 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get AI response');
      }

      const data = await response.json();

      if (!data || typeof data.suggestion !== 'string') {
        throw new Error('Invalid response format from AI service');
      }

      setAiMessage(data.suggestion);
      setUserMessage('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Error getting AI response:', errorMessage);
      setAiError(errorMessage);
      setAiMessage(`Error: ${errorMessage}. Please try again later.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAssistantMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document Title"
            className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full"
            disabled={isLoading}
          />
          {saveStatus && (
            <p className={`text-sm mt-1 ${
              saveStatus.includes('Error') ? 'text-red-500' : 
              saveStatus === 'Loading...' || saveStatus === 'Saving...' ? 'text-blue-500' : 
              'text-green-500'
            }`}>
              {saveStatus}
            </p>
          )}
          {serverStatus === 'offline' && (
            <p className="text-sm mt-1 text-red-500">
              AI services unavailable. Please ensure the server is running.
            </p>
          )}
          {aiError && (
            <p className="text-sm mt-1 text-red-500">
              AI Error: {aiError}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            className="bg-[#FFD700] text-black hover:bg-[#E6C200] dark:text-black"
            size="sm" 
            onClick={saveDocument}
            disabled={isSaving || isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Document'}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAISuggestion}
            disabled={isImproving || isLoading || serverStatus === 'offline' || isProcessing}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isImproving ? 'Improving...' : 'Improve'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFormatDocument}
            disabled={isFormatting || isLoading || serverStatus === 'offline' || isProcessing}
          >
            <Type className="w-4 h-4 mr-2" />
            {isFormatting ? 'Formatting...' : 'Format'}
          </Button>
          <Button
            variant={showAiAssistant ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAiAssistant(!showAiAssistant)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,300px] gap-4 h-[calc(100%-3rem)]">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
          <Select 
            value={selectedTemplate}
            onChange={handleTemplateChange}
            className="w-full"
            disabled={isLoading}
          >
            <option value="empty">Select a template...</option>
            <option value="contract">Contract Template</option>
            <option value="agreement">Agreement Template</option>
            <option value="resume">Resume Template</option>
          </Select>
          
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isLoading ? "Loading..." : "Start typing your document..."}
            className="w-full h-[calc(100%-4rem)] resize-none font-medium"
            disabled={isLoading}
          />
        </div>

        {showAiAssistant && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4">AI Assistant</h3>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{aiMessage}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 p-2 text-sm"
                  disabled={isProcessing || serverStatus === 'offline'}
                />
                <Button 
                  size="sm" 
                  onClick={handleAssistantMessage}
                  disabled={isProcessing || serverStatus === 'offline'}
                >
                  {isProcessing ? '...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showShareDialog && id && (
        <ShareDialog
          documentId={id}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
};

export default DocumentEditor;