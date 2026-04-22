"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Send, X, Loader2, User } from 'lucide-react';
import { translations, useLanguage } from '@/lib/translations';
import { resolveObservationDateTime } from '@/lib/observation-dates';
import { homeClaudeTheme } from '@/lib/app-theme';
import { cn } from '@/lib/utils';

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
  /** When set with `onOpenChange`, the floating FAB is hidden (e.g. toggle lives in the app footer). */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClaudeChat({
  selectedObservations,
  allObservations,
  onLoadMoreData,
  isOpen: isOpenControlled,
  onOpenChange,
}: ClaudeChatProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isControlled = isOpenControlled !== undefined;
  const open = isControlled ? isOpenControlled : isOpenInternal;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setIsOpenInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
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
      {!isControlled && (
        <div className="fixed bottom-2 sm:bottom-6 left-0 right-0 z-40 pointer-events-none">
          <div className="max-w-6xl mx-auto px-3 sm:px-8 flex justify-end">
            <Button
              onClick={() => setOpen(!open)}
              className={cn(homeClaudeTheme.chatFab, !open && "rounded-none")}
            >
              {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      )}

      {/* Chat Window — sits above the fixed app footer when the FAB is in the footer */}
      {open && (
        <div
          className={cn(
            "fixed right-0 left-0 z-50 pointer-events-none",
            isControlled ? "bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))]" : "bottom-20",
          )}
        >
          <div className="max-w-6xl mx-auto px-3 sm:px-8 flex justify-end">
          <div className={homeClaudeTheme.panel}>
          {/* Header */}
          <div className={homeClaudeTheme.header}>
            <div className="flex items-center gap-2">
              <span className={homeClaudeTheme.headerTitle}>{mounted ? t('aiAssistant') : 'AI Assistant'}</span>
            </div>
            {selectedObservations && selectedObservations.size > 0 && (
              <Button
                onClick={analyzeSelectedObservations}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className={homeClaudeTheme.outlineButtonSm}
              >
                {mounted ? `${t('analyze')} (${selectedObservations.size})` : `Analyze (${selectedObservations.size})`}
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className={homeClaudeTheme.messagesArea}>
            {messages.length === 0 && mounted && (
              <div className="space-y-4">
                <div className={homeClaudeTheme.emptyState}>
                  <div className="w-8 h-8 mx-auto mb-2 bg-foreground text-background flex items-center justify-center text-xs font-semibold rounded-sm">
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
                    className={homeClaudeTheme.quickActionButton}
                  >
                    {t('summarizeToday')}
                  </Button>
                  <Button
                    onClick={() => handleSummaryRequest('week', t('lastSevenDaysSummary'))}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className={homeClaudeTheme.quickActionButton}
                  >
                    {t('lastSevenDaysSummary')}
                  </Button>
                  <Button
                    onClick={() => handleSummaryRequest('twoWeeks', t('lastFourteenDaysSummary'))}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className={homeClaudeTheme.quickActionButton}
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
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-sm",
                  message.role === 'user' ? homeClaudeTheme.userAvatar : homeClaudeTheme.assistantAvatar,
                )}>
                  {message.role === 'user' ? <User className="h-3 w-3" /> : 'AI'}
                </div>
                <div
                  className={message.role === "user" ? homeClaudeTheme.userBubble : homeClaudeTheme.assistantBubble}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      "text-xs mt-1 opacity-70",
                      message.role === "user" ? "text-muted-foreground" : "text-background/80",
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2">
                <div className={cn("flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-sm", homeClaudeTheme.assistantAvatar)}>
                  AI
                </div>
                <div className={homeClaudeTheme.assistantBubble}>
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
          <div className={homeClaudeTheme.inputBar}>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={mounted ? t('askAiAboutObservations') : 'Ask AI about your observations...'}
                className={homeClaudeTheme.input}
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                variant={(!inputValue.trim() || isLoading) ? "outline" : "default"}
                className={cn(
                  "px-3 h-10",
                  (!inputValue.trim() || isLoading) && "text-muted-foreground",
                )}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
