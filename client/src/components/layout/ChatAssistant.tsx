import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { ChatMessage } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatAssistantProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatAssistant({ open, onClose }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi there! How can I help with your job search today?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const chatMutation = useMutation({
    mutationFn: async (messages: ChatMessage[]) => {
      const res = await apiRequest('POST', '/api/chat', { messages });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response }
      ]);
    }
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: inputValue
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    
    // Send all messages to the backend for context
    chatMutation.mutate([...messages, newUserMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!open) return null;

  return (
    <Card className="fixed bottom-6 right-6 w-96 z-40 shadow-xl flex flex-col h-[480px] max-h-[80vh]">
      <CardHeader className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="text-md font-medium">Job Search Assistant</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:text-gray-200 h-8 w-8">
          <span>×</span>
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`flex items-start ${
              message.role === 'user' ? 'justify-end' : ''
            }`}
          >
            {message.role === 'assistant' && (
              <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
                <AvatarFallback className="bg-primary-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className={`${
              message.role === 'user' 
                ? 'bg-primary-50 text-gray-900' 
                : 'bg-gray-100 text-gray-900'
              } rounded-lg px-4 py-2 max-w-[75%]`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            
            {message.role === 'user' && (
              <Avatar className="h-8 w-8 ml-3 flex-shrink-0">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gray-300 text-gray-700">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messageEndRef} />
      </CardContent>
      
      <CardFooter className="border-t border-gray-200 p-4">
        <form 
          className="flex space-x-3 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={chatMutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full"
            disabled={chatMutation.isPending || !inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
