import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/LogoIcon';

export default function LegalLgpd() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <LogoIcon size={36} />
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">Ágata</span>
                <span className="text-[10px] text-gray-500 -mt-0.5 tracking-wide">Transcription</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors">Home</Link>
              <Link to="/blog" className="text-gray-600 hover:text-emerald-600 transition-colors">Blog</Link>
            </nav>
            <Link to="/auth/signup"><Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">Teste Grátis</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600"><strong>Última atualização:</strong> Abril de 2026</p>

          <h2 className="text-xl font-semibold text-gray-900">1. Introdução</h2>
          <p className="text-gray-700">A Ágata Transcription está comprometida com a proteção dos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>

          <h2 className="text-xl font-semibold text-gray-900">2. Dados Coletados</h2>
          <p className="text-gray-700">Coletamos os seguintes dados pessoais:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Nome e email (para cadastro e comunicação)</li>
            <li>CPF (opcional, para emissão de nota fiscal)</li>
            <li>Telefone (opcional, para suporte)</li>
            <li>Arquivos de áudio (para processamento de transcrição)</li>
            <li>Dados de uso da plataforma (para melhoria do serviço)</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">3. Finalidade do Tratamento</h2>
          <p className="text-gray-700">Seus dados são utilizados para:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Prestação do serviço de transcrição</li>
            <li>Geração de resumos e atas de reunião</li>
            <li>Comunicação sobre sua conta e serviço</li>
            <li>Melhoria contínua da plataforma</li>
            <li>Cumprimento de obrigações legais</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">4. Armazenamento e Segurança</h2>
          <p className="text-gray-700">Os arquivos de áudio são armazenados temporariamente e excluídos automaticamente após 24 horas do processamento. Utilizamos criptografia e infraestrutura segura para proteger seus dados.</p>

          <h2 className="text-xl font-semibold text-gray-900">5. Compartilhamento de Dados</h2>
          <p className="text-gray-700">Não vendemos seus dados pessoais. Compartilhamos dados apenas com:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Provedores de infraestrutura (hospedagem e processamento)</li>
            <li>Serviços de pagamento (Stripe, para processamento de assinaturas)</li>
            <li>Autoridades legais (quando exigido por lei)</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">6. Seus Direitos (LGPD)</h2>
          <p className="text-gray-700">Conforme a LGPD, você tem direito a:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Confirmação da existência de tratamento de dados</li>
            <li>Acesso aos seus dados pessoais</li>
            <li>Correção de dados incompletos ou desatualizados</li>
            <li>Eliminação de dados pessoais</li>
            <li>Portabilidade dos dados</li>
            <li>Revogação do consentimento</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">7. Retenção de Dados</h2>
          <p className="text-gray-700">Seus dados de conta são mantidos enquanto sua conta estiver ativa. Ao solicitar exclusão da conta, todos os dados pessoais serão removidos em até 30 dias.</p>

          <h2 className="text-xl font-semibold text-gray-900">8. Cookies</h2>
          <p className="text-gray-700">Utilizamos cookies essenciais para funcionamento da plataforma e manutenção da sessão de login. Não utilizamos cookies de rastreamento de terceiros.</p>

          <h2 className="text-xl font-semibold text-gray-900">9. Contato do Encarregado (DPO)</h2>
          <p className="text-gray-700">Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados, entre em contato: privacidade@agatatranscription.com.br</p>
        </div>
      </main>

      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© 2026 Ágata Transcription. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
