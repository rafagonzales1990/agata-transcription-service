import { appVersion } from '@/config/appVersion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VersionBadgeProps {
  showChangelog?: boolean;
  className?: string;
}

export function VersionBadge({ showChangelog = true, className = '' }: VersionBadgeProps) {
  const badge = (
    <span className={`text-[11px] text-muted-foreground font-mono select-none ${className}`}>
      Ágata {appVersion.version}
      <span className="mx-1 opacity-40">•</span>
      <span className="opacity-60">{appVersion.environmentLabel}</span>
    </span>
  );

  if (!showChangelog || !appVersion.changelog.length) return badge;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`text-[11px] text-muted-foreground font-mono select-none cursor-default inline-flex items-center gap-1.5 ${className}`}>
            Ágata {appVersion.version}
            <span className="opacity-40">•</span>
            <span className="opacity-60">{appVersion.environmentLabel}</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="What's new" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold text-xs mb-1">What's new in {appVersion.version}</p>
          <ul className="text-xs space-y-0.5 list-disc pl-3">
            {appVersion.changelog.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground mt-1.5">{appVersion.releaseDate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
