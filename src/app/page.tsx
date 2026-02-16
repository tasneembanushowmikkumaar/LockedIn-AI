"use client";

import { useState, useEffect } from "react";
import { useLockedInStore } from "@/lib/store";
import { BottomNav } from "@/components/bottom-nav";
import { TimerCard } from "@/components/timer-card";
import { StatGrid } from "@/components/stat-grid";
import { HomeView } from "@/components/views/home-view";
import { TasksView } from "@/components/views/tasks-view";
import { ChatView } from "@/components/views/chat-view";
import { CalendarView } from "@/components/views/calendar-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck } from "lucide-react";

export default function LockedInDashboard() {
  const { state, isLoaded, updateState, completeTask, failTask, addChatMessage } = useLockedInStore();
  const [activeTab, setActiveTab] = useState("home");

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground selection:bg-primary/30">
      {/* Top Bar */}
      <header className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl neumorphic-flat">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-black tracking-tight leading-none">LockedIn AI</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Version 2.4.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden xs:flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-accent tracking-tighter">Subject #1921</span>
            <span className="text-xs font-bold">{state.tier}</span>
          </div>
          <Avatar className="h-10 w-10 border-2 border-border neumorphic-flat">
            <AvatarImage src="https://picsum.photos/seed/user/100/100" />
            <AvatarFallback>SUB</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="px-6 py-4 max-w-lg mx-auto space-y-8">
        {activeTab === 'home' && (
          <HomeView 
            state={state} 
            completeTask={completeTask} 
            failTask={failTask} 
          />
        )}
        {activeTab === 'tasks' && (
          <TasksView 
            state={state} 
            completeTask={completeTask} 
            failTask={failTask}
            updateState={updateState}
          />
        )}
        {activeTab === 'chat' && (
          <ChatView 
            state={state} 
            addChatMessage={addChatMessage} 
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView 
            state={state} 
          />
        )}
      </main>

      {/* Persistent Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
