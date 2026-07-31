import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-default"
      title="Nature Dark Mode Enforced"
    >
      <Moon className="h-3.5 w-3.5 text-emerald-400" />
      <span className="hidden sm:inline"></span>
    </Button>
  );
}