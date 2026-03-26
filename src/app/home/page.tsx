"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
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

  // Auth Check via Clerk
  const { isSignedIn, isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const router = useRouter();

  // Fetch user profile from Convex
  const convexUser = useQuery(api.users.current);

  useEffect(() => {
    if (!clerkLoaded) return;

    if (!isSignedIn) {
      router.push("/login");
      return;
    }

    // Check onboarding via Convex user profile
    if (convexUser !== undefined && convexUser !== null) {
      if (!convexUser.onboarding_completed) {
        router.push("/onboarding");
        return;
      }

      // Sync Convex profile to local store
      if (convexUser.tier) {
        updateState((prev) => ({
          ...prev,
          tier: convexUser.tier as Tier,
        }));
      }
    }
  }, [clerkLoaded, isSignedIn, convexUser, router, updateState]);

  const authorized = clerkLoaded && isSignedIn && convexUser !== undefined;

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
            <AvatarImage src={clerkUser?.imageUrl || "https://picsum.photos/seed/user/100/100"} />
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
