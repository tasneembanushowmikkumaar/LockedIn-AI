"use client";

import { Check, X, Lock, Play, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onFail: () => void;
}

export function TaskCard({ task, onComplete, onFail }: TaskCardProps) {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'JOI/CEI': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'CBT': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'DENIAL': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-primary/10 text-primary-foreground/70 border-primary/20';
    }
  };

  const isCompleted = task.status === 'Completed';
  const isFailed = task.status === 'Failed';

  return (
    <div className={cn(
      "p-6 rounded-3xl neumorphic-flat transition-all duration-300",
      isCompleted && "opacity-50 grayscale",
      isFailed && "border-2 border-red-900/50 bg-red-900/5"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={cn("text-[10px] tracking-widest uppercase font-bold px-2 py-0.5", getCategoryColor(task.category))}>
            {task.category}
          </Badge>
          {isCompleted && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">COMPLETED</Badge>}
          {isFailed && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">FAILED</Badge>}
        </div>
        <div className="p-1.5 rounded-full neumorphic-inset">
          <Activity className="w-4 h-4 opacity-30" />
        </div>
      </div>

      <p className="text-base font-medium leading-relaxed mb-6">
        {task.description}
      </p>

      {task.status === 'Pending' && (
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={onFail} 
            variant="outline" 
            className="h-12 rounded-2xl border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Surrender
          </Button>
          <Button 
            onClick={onComplete} 
            className="h-12 rounded-2xl bg-primary hover:bg-primary/80 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Check className="w-4 h-4 mr-2" />
            Submit Proof
          </Button>
        </div>
      )}
    </div>
  );
}
