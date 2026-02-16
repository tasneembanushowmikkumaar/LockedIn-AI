"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { AppState } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Target, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  state: AppState;
}

export function CalendarView({ state }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Simulated data for markers
  const releaseDate = new Date(state.releaseDate);
  const punishmentDays = [new Date(Date.now() - 24 * 60 * 60 * 1000)]; // Yesterday failed?
  const streakDays = [new Date(Date.now() - 48 * 60 * 60 * 1000), new Date(Date.now() - 72 * 60 * 60 * 1000)];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-headline font-black tracking-tight">Timeline</h2>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Compliance Tracking</p>
      </div>

      <div className="neumorphic-flat rounded-[2rem] p-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-3xl pointer-events-none"
          modifiers={{
            punishment: punishmentDays,
            streak: streakDays,
            release: [releaseDate]
          }}
          modifiersClassNames={{
            punishment: "bg-red-500/20 text-red-500 border-red-500/30 rounded-full",
            streak: "bg-green-500/20 text-green-500 border-green-500/30 rounded-full",
            release: "bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30"
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl neumorphic-inset flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-[10px] font-bold uppercase opacity-60">Release Date</span>
        </div>
        <div className="p-3 rounded-2xl neumorphic-inset flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/40" />
          <span className="text-[10px] font-bold uppercase opacity-60">Violations</span>
        </div>
        <div className="p-3 rounded-2xl neumorphic-inset flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/40" />
          <span className="text-[10px] font-bold uppercase opacity-60">Streaks</span>
        </div>
        <div className="p-3 rounded-2xl neumorphic-inset flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-background border border-border" />
          <span className="text-[10px] font-bold uppercase opacity-60">Standard</span>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 opacity-60">
          <History className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-widest">Adjustment Log</h3>
        </div>
        
        <ScrollArea className="h-[200px] neumorphic-inset rounded-3xl p-4">
          <div className="space-y-4">
            <LogEntry time="Today" action="+4h Timer Extension" detail="Task failure - 'Cold Shower Denied'" type="punishment" />
            <LogEntry time="Feb 17" action="Streak Milestone" detail="4 days compliant rewarded" type="streak" />
            <LogEntry time="Feb 16" action="-2h Timer Reduction" detail="Hardcore Tier task completed early" type="success" />
            <LogEntry time="Feb 15" action="Tier Initialized" detail="Tier 3 Hardcore Protocol assigned" type="neutral" />
          </div>
        </ScrollArea>
      </section>
    </div>
  );
}

function LogEntry({ time, action, detail, type }: { time: string; action: string; detail: string; type: string }) {
  const getColors = () => {
    switch(type) {
      case 'punishment': return 'text-red-400';
      case 'streak': return 'text-green-400';
      case 'success': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  }

  return (
    <div className="flex gap-4 items-start">
      <div className="text-[10px] font-bold uppercase opacity-30 mt-1 w-12 shrink-0">{time}</div>
      <div>
        <div className={cn("text-xs font-black uppercase tracking-tight", getColors())}>{action}</div>
        <div className="text-[10px] opacity-50 font-medium">{detail}</div>
      </div>
    </div>
  );
}
