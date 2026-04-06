import { AlertTriangle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  isNearLimit: boolean;
  isAtLimit: boolean;
  planId: string;
}

export function UsageBanner({ isNearLimit, isAtLimit, planId }: Props) {
  if (planId === 'enterprise' || (!isNearLimit && !isAtLimit)) return null;

  if (isAtLimit) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            Você atingiu o limite do seu plano este mês. Faça upgrade para continuar transcrevendo.
          </p>
        </div>
        <Link to="/plans" className="text-sm font-semibold text-red-700 hover:text-red-900 whitespace-nowrap underline">
          Ver planos
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">
          Você está próximo do limite do seu plano. Considere fazer upgrade.
        </p>
      </div>
      <Link to="/plans" className="text-sm font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap underline">
        Ver planos
      </Link>
    </div>
  );
}
