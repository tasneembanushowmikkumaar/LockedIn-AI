"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLockedInStore, Tier } from "@/lib/store";
import { BottomNav } from "@/components/bottom-nav";
import { HomeView } from "@/components/views/home-view";
import { TasksView } from "@/components/views/tasks-view";
import { ChatView } from "@/components/views/chat-view";
import { CalendarView } from "@/components/views/calendar-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LockedInDashboard() {
  const { state, isLoaded, updateState, completeTask, failTask, addChatMessage } = useLockedInStore();
  const [activeTab, setActiveTab] = useState("home");

  // Auth Check
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile?.onboarding_completed) {
        router.push("/onboarding");
        return;
      }

      // Sync Supabase profile to local store
      if (profile && profile.tier) {
        // Fetch active session for timer
        const { data: session } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        updateState((prev) => ({
          ...prev,
          tier: profile.tier as Tier,
          timerEnd: session ? new Date(session.scheduled_end_time).getTime() : prev.timerEnd,
        }));
      }

      setAuthorized(true);
    };
    checkAuth();
  }, [router, supabase]);

  if (!isLoaded || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
