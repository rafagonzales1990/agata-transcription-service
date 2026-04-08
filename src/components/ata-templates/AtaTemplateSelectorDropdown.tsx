import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAtaTemplates } from '@/hooks/useAtaTemplates';
import { ExternalLink } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AtaTemplateSelectorDropdown({ value, onChange, disabled, className }: Props) {
  const { templates, isLoading } = useAtaTemplates();

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Selecione um modelo" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__default__">Padrão (Ágata)</SelectItem>
        {templates.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name} {t.isDefault ? '⭐' : ''}
          </SelectItem>
        ))}
        <SelectItem value="__customize__">
          <span className="flex items-center gap-1.5">
            Personalizar agora <ExternalLink className="h-3 w-3" />
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
