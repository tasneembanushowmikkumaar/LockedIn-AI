"use client";

import { Home, ListTodo, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'tasks', icon: ListTodo, label: 'Tasks' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'calendar', icon: Calendar, label: 'Dates' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-md border-t border-border/50 px-6 pb-4 flex items-center justify-between z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300",
              isActive ? "neumorphic-pressed text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive && "animate-pulse")} />
            <span className="text-[10px] font-bold uppercase mt-1 tracking-tighter">{tab.label}</span>
            {isActive && (
              <div className="absolute -top-1 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
