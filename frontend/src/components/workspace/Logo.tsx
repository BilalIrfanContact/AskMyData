import { Sparkles } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">
        <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="font-semibold tracking-tight">
        AskMyData<span className="font-normal text-muted-foreground"> · ai</span>
      </span>
    </div>
  );
}
