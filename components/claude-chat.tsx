"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, X, Loader2, User } from 'lucide-react';
import { translations, useLanguage } from '@/lib/translations';
import { resolveObservationDateTime } from '@/lib/observation-dates';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ClaudeChatProps {
  selectedObservations?: Set<string>;
  allObservations?: Array<{
    id: string;
    note?: string | null;
    labels?: string[] | null;
    photo_date?: string | null;
    taken_at?: string | null;
    created_at: string;
    sites?: { name: string } | null;
  }>;
  onLoadMoreData?: (period: 'week' | 'month') => Promise<void>;
}

export function ClaudeChat({ selectedObservations, allObservations, onLoadMoreData }: ClaudeChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Translation support
  const { language, mounted } = useLanguage();
  const t = useCallback(
    (key: keyof typeof translations.en) => {
      const value = translations[language][key];
      return typeof value === "string" ? value : "";
    },
    [language],
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSummarySystemPrompt = (period: 'today' | 'week' | 'twoWeeks') => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'twoWeeks':
        startDate = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
        break;
    }

    const relevantObservations = allObservations?.filter(obs => {
      const obsDate = resolveObservationDateTime(obs);
      return obsDate >= startDate;
    }) || [];

    const periodName = period === 'today' ? 'today' : 
                     period === 'week' ? 'the last 7 days' : 
                     'the last 14 days';

    if (relevantObservations.length === 0) {
      return `You are an AI assistant. The user asked for a summary of ${periodName}, but there are no observations recorded for this period. Provide a brief, helpful response explaining this.`;
    }

    return `You are an AI assistant specializing in construction site management. Create a comprehensive summary of construction observations for ${periodName}. 

Observations to summarize (${relevantObservations.length} total):
${relevantObservations.map((obs, index) => `
${index + 1}. Date: ${resolveObservationDateTime(obs).toLocaleDateString('en-GB')} at ${resolveObservationDateTime(obs).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
   Site: ${obs.sites?.name || 'Unknown site'}
   Note: ${obs.note || 'No note provided'}
   Labels: ${obs.labels?.join(', ') || 'No labels'}`).join('')}

Please provide:
1. Overview of activities during this period
2. Key progress made
3. Any notable observations or patterns
4. Sites that were most active
5. Brief recommendations or insights

Keep the summary concise but informative.`;
  };

  const handleSummaryRequest = async (period: 'today' | 'week' | 'twoWeeks', message: string) => {
    // For week and twoWeeks summaries, try to load more data first if the function is available
    if ((period === 'week' || period === 'twoWeeks') && onLoadMoreData) {
      try {
        setIsLoading(true);
        // Load past month data to ensure we have comprehensive data for summaries
        await onLoadMoreData('month');
        // Wait a moment for the data to be processed
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch {
        console.log('Could not load additional data, proceeding with existing data');
      } finally {
        setIsLoading(false);
      }
    }
    
    // Now send the summary request with (potentially) more comprehensive data
    await sendMessage(message, getSummarySystemPrompt(period));
  };

  const sendMessage = async (content: string, customSystemPrompt?: string) => {
    if (!content.trim() || isLoading) return;

    const newMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create context about ALL observations
      let contextInfo = '';
      if (allObservations && allObservations.length > 0) {
        // Sort all observations by date (newest first)
        const sortedObservations = allObservations
          .sort((a, b) => resolveObservationDateTime(b).getTime() - resolveObservationDateTime(a).getTime());

        console.log('Total observations available:', allObservations.length);
        console.log('All observations being sent to Claude:', sortedObservations.length);
        console.log('Date range:', 
          sortedObservations.length > 0 ? 
          `${resolveObservationDateTime(sortedObservations[sortedObservations.length - 1]).toLocaleDateString()} to ${resolveObservationDateTime(sortedObservations[0]).toLocaleDateString()}` : 
          'No observations'
        );

        // Group observations by date for better organization
        const observationsByDate = sortedObservations.reduce((acc, obs) => {
          const date = resolveObservationDateTime(obs).toLocaleDateString('en-GB');
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(obs);
          return acc;
        }, {} as Record<string, typeof sortedObservations>);

        const formattedObservations = Object.entries(observationsByDate)
          .map(([date, dayObs]) => {
            return `\n--- ${date} (${dayObs.length} observations) ---\n${
              dayObs.map((obs, index) => `
${index + 1}. Time: ${resolveObservationDateTime(obs).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
   Site: ${obs.sites?.name || 'Unknown site'}
   Note: ${obs.note || 'No note provided'}
   Labels: ${obs.labels?.join(', ') || 'No labels'}`).join('')
            }`;
          }).join('\n');

        contextInfo = `\n\nContext: Here are ALL of the user's construction site observations (${sortedObservations.length} total observations across ${Object.keys(observationsByDate).length} days):${formattedObservations}\n\nPlease use this complete information to provide specific insights about their construction observations. You have access to ALL their observation data, so you can answer questions about any date or time period accurately.`;
      }

      const systemPrompt = customSystemPrompt || `You are a helpful AI assistant specializing in construction site management and observation analysis. You can help analyze construction observations, provide insights, and answer questions about construction projects.${contextInfo}`;

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: [...messages, newMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          systemPrompt,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message to Claude:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSelectedObservations = async () => {
    if (!selectedObservations || selectedObservations.size === 0) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Please select some observations first to analyze.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);
    const observationIds = Array.from(selectedObservations);
    
    const userMessage: Message = {
      role: 'user',
      content: `Analyze ${observationIds.length} selected observations`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          observationIds,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error analyzing observations:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error analyzing the observations. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 rounded-none h-12 w-12 p-0 shadow-lg z-40 ${
          isOpen ? 'bg-gray-800 hover:bg-gray-900' : 'bg-black hover:bg-gray-800'
        }`}
      >
        {isOpen ? <X className="h-5 w-5 text-white" /> : <MessageCircle className="h-5 w-5 text-white" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white border border-gray-300 shadow-xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-black">{mounted ? t('aiAssistant') : 'AI Assistant'}</span>
            </div>
            {selectedObservations && selectedObservations.size > 0 && (
              <Button
                onClick={analyzeSelectedObservations}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="text-xs border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {mounted ? `${t('analyze')} (${selectedObservations.size})` : `Analyze (${selectedObservations.size})`}
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
            {messages.length === 0 && mounted && (
              <div className="space-y-4">
                <div className="text-center text-gray-500 text-sm py-4">
                  <div className="w-8 h-8 mx-auto mb-2 bg-black text-white flex items-center justify-center text-xs font-semibold">
                    AI
                  </div>
                  <p>{t('aiAssistantIntro')}</p>
                  <p className="mt-1">{t('quickSummaries')}</p>
                </div>
                
                {/* Quick Summary Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handleSummaryRequest('today', t('summarizeToday'))}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {t('summarizeToday')}
                  </Button>
                  <Button
                    onClick={() => handleSummaryRequest('week', t('lastSevenDaysSummary'))}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {t('lastSevenDaysSummary')}
                  </Button>
                  <Button
                    onClick={() => handleSummaryRequest('twoWeeks', t('lastFourteenDaysSummary'))}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {t('lastFourteenDaysSummary')}
                  </Button>
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-semibold ${
                  message.role === 'user' ? 'bg-white border border-gray-300 text-gray-600' : 'bg-black text-white'
                }`}>
                  {message.role === 'user' ? <User className="h-3 w-3" /> : 'AI'}
                </div>
                <div
                  className={`max-w-[80%] p-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-white text-black border border-gray-300'
                      : 'bg-black text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.role === 'user' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-semibold">
                  AI
                </div>
                <div className="bg-black text-white p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{mounted ? t('thinking') : 'Thinking...'}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={mounted ? t('askAiAboutObservations') : 'Ask AI about your observations...'}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:border-gray-500 h-10"
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                variant={(!inputValue.trim() || isLoading) ? "outline" : "default"}
                className={`px-3 h-10 ${
                  (!inputValue.trim() || isLoading) 
                    ? "border-gray-300 text-gray-400 bg-white hover:bg-gray-50" 
                    : "bg-black text-white hover:bg-gray-800 border-black"
                }`}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
