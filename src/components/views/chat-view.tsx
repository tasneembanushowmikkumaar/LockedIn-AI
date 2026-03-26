"use client";

import { useState, useRef, useEffect } from "react";
import { aiChatInteraction } from "@/ai/flows/ai-chat-interaction-flow";
import { generateSpeech } from "@/ai/actions/voice";
import { AppState, Message } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, User, Bot, Loader2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatViewProps {
  state: AppState;
  addChatMessage: (msg: Message) => void;
}

export function ChatView({ state, addChatMessage }: ChatViewProps) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatMessages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    addChatMessage(userMsg);
    setInput("");
    setIsTyping(true);

    try {
      const response = await aiChatInteraction({
        message: userMsg.content,
        tier: state.tier,
        complianceScore: state.willpower,
        streak: state.streak,
        recentFailures: state.tasks.filter(t => (t.status as string) === 'Failed' || (t.status as string) === 'failed').map(t => t.description).join(", ") || "None",
        timeLeft: `${Math.floor((state.timerEnd - Date.now()) / (1000 * 60 * 60))}h left`,
        chatHistory: state.chatMessages.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        })),
      });

      addChatMessage({
        role: 'assistant',
        content: response.aiResponse,
        timestamp: Date.now(),
      });

      // Generate Audio
      try {
        const audioData = await generateSpeech(response.aiResponse);
        if (audioData) {
          if (audioRef.current) {
            audioRef.current.src = audioData;
            audioRef.current.play();
            setIsPlaying(true);
          }
        }
      } catch (voiceError) {
        console.error("Audio playback failed", voiceError);
      }

    } catch (e) {
      addChatMessage({
        role: 'assistant',
        content: "Error in transmission. Your submission will still be logged. Obey.",
        timestamp: Date.now(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] animate-in fade-in duration-500">
      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      <div className="flex justify-between items-center mb-2 px-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Secure Channel</span>
        {isPlaying && (
          <div className="flex items-center gap-2 text-primary animate-pulse">
            <Volume2 className="w-4 h-4" />
            <span className="text-xs font-bold">Voice Active</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden neumorphic-inset rounded-3xl mb-4 relative">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-6 pb-4">
            {state.chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-end gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "p-2 rounded-full neumorphic-flat shrink-0",
                  msg.role === 'assistant' ? "text-primary" : "text-accent"
                )}>
                  {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'assistant' 
                    ? "neumorphic-flat border-l-2 border-primary/50 bg-primary/5" 
                    : "bg-background border border-border"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse ml-12">
                <Loader2 className="w-3 h-3 animate-spin" /> AI Controller is typing...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex gap-2 items-center">
        <Input 
          placeholder="Message LockedIn AI..." 
          className="h-14 rounded-2xl neumorphic-flat bg-background border-0 focus-visible:ring-primary/30"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button 
          size="icon" 
          onClick={handleSendMessage}
          className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
