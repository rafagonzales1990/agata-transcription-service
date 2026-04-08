import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/LogoIcon';

export default function Privacy() {
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

          <h2 className="text-xl font-semibold text-gray-900">1. Informações que Coletamos</h2>
          <p className="text-gray-700">Coletamos as seguintes informações para fornecer nossos serviços:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Dados de conta: nome, e-mail, CPF e senha (criptografada)</li>
            <li>Arquivos de áudio e vídeo enviados para transcrição</li>
            <li>Transcrições, resumos e atas geradas</li>
            <li>Dados de uso da plataforma (número de transcrições, plano contratado)</li>
            <li>Informações de pagamento processadas pelo Stripe (não armazenamos dados de cartão)</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">2. Como Usamos suas Informações</h2>
          <p className="text-gray-700">Utilizamos seus dados exclusivamente para:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Processar e transcrever arquivos de áudio/vídeo enviados</li>
            <li>Gerar resumos e atas de reunião com inteligência artificial</li>
            <li>Gerenciar sua conta e plano de assinatura</li>
            <li>Enviar notificações transacionais (confirmação de transcrição, alertas de uso)</li>
            <li>Melhorar a qualidade do serviço</li>
          </ul>
          <p className="text-gray-700">Não vendemos, compartilhamos nem utilizamos seus dados para treinamento de modelos de IA de terceiros.</p>

          <h2 className="text-xl font-semibold text-gray-900">3. Armazenamento e Exclusão de Dados</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Arquivos de áudio são excluídos automaticamente em até 24 horas após a transcrição (em conformidade com a LGPD)</li>
            <li>Transcrições e atas ficam armazenadas enquanto sua conta estiver ativa</li>
            <li>Você pode solicitar a exclusão completa da sua conta e dados a qualquer momento pelo e-mail <a href="mailto:privacidade@agatatranscription.com" className="text-emerald-600 hover:underline">privacidade@agatatranscription.com</a></li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">4. Compartilhamento com Terceiros</h2>
          <p className="text-gray-700">Utilizamos os seguintes provedores de serviço, todos com políticas de privacidade compatíveis com a LGPD:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li><strong>Google Gemini AI:</strong> processamento de transcrição e geração de resumos</li>
            <li><strong>Supabase:</strong> armazenamento seguro de dados (servidores nos EUA)</li>
            <li><strong>Stripe:</strong> processamento de pagamentos</li>
            <li><strong>Resend:</strong> envio de e-mails transacionais</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">5. Segurança</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Todos os dados são transmitidos com criptografia SSL/TLS</li>
            <li>Acesso aos dados restrito a pessoal autorizado</li>
            <li>Autenticação com tokens JWT de curta duração</li>
            <li>Row Level Security (RLS) ativo em todas as tabelas do banco de dados</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">6. Seus Direitos (LGPD)</h2>
          <p className="text-gray-700">De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Portabilidade dos seus dados</li>
          </ul>
          <p className="text-gray-700">Para exercer esses direitos, entre em contato: <a href="mailto:privacidade@agatatranscription.com" className="text-emerald-600 hover:underline">privacidade@agatatranscription.com</a></p>

          <h2 className="text-xl font-semibold text-gray-900">7. Extensão do Navegador (Chrome/Edge)</h2>
          <p className="text-gray-700">A extensão Ágata Transcription coleta:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Áudio da reunião (microfone + áudio da aba do navegador) apenas durante gravação ativa</li>
            <li>Sessão de autenticação armazenada localmente no navegador</li>
          </ul>
          <p className="text-gray-700">O áudio é enviado diretamente para nossos servidores seguros e excluído em 24 horas. Nenhum dado é coletado sem ação explícita do usuário.</p>

          <h2 className="text-xl font-semibold text-gray-900">8. Cookies e Analytics</h2>
          <p className="text-gray-700">Utilizamos Google Analytics (GA4) para análise de uso agregado e Google Tag Manager. Você pode desativar cookies nas configurações do seu navegador.</p>

          <h2 className="text-xl font-semibold text-gray-900">9. Contato</h2>
          <p className="text-gray-700">Controlador de dados: RGM Consulting</p>
          <p className="text-gray-700">E-mail: <a href="mailto:privacidade@agatatranscription.com" className="text-emerald-600 hover:underline">privacidade@agatatranscription.com</a></p>
          <p className="text-gray-700">Site: <a href="https://agatatranscription.com" className="text-emerald-600 hover:underline">agatatranscription.com</a></p>

          <h2 className="text-xl font-semibold text-gray-900">10. Atualizações desta Política</h2>
          <p className="text-gray-700">Podemos atualizar esta política periodicamente. Notificaremos usuários sobre mudanças significativas por e-mail.</p>
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
