import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/LogoIcon';

export default function LegalTerms() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Termos de Uso</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600"><strong>Última atualização:</strong> Abril de 2026</p>

          <h2 className="text-xl font-semibold text-gray-900">1. Aceitação dos Termos</h2>
          <p className="text-gray-700">Ao acessar e utilizar a plataforma Ágata Transcription, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não utilize nossos serviços.</p>

          <h2 className="text-xl font-semibold text-gray-900">2. Descrição do Serviço</h2>
          <p className="text-gray-700">A Ágata Transcription é uma plataforma de transcrição automática de reuniões que utiliza inteligência artificial para converter áudio em texto, gerar resumos e atas profissionais em PDF.</p>

          <h2 className="text-xl font-semibold text-gray-900">3. Conta de Usuário</h2>
          <p className="text-gray-700">Você é responsável por manter a confidencialidade da sua conta e senha. Todas as atividades realizadas na sua conta são de sua responsabilidade.</p>

          <h2 className="text-xl font-semibold text-gray-900">4. Uso Aceitável</h2>
          <p className="text-gray-700">Você se compromete a utilizar a plataforma apenas para fins legais e de acordo com estes termos. É proibido o uso para atividades ilegais, upload de conteúdo ofensivo ou tentativa de violar a segurança do sistema.</p>

          <h3 className="text-lg font-semibold text-gray-900">4.1 Gravação de Reuniões</h3>
          <p className="text-gray-700">O usuário é o único responsável por obter o consentimento dos participantes antes de gravar qualquer reunião. A plataforma Ágata Transcription fornece ferramentas de gravação e transcrição, mas não monitora nem controla o uso dessas funcionalidades.</p>
          <p className="text-gray-700">Ao usar a extensão de gravação, o usuário declara estar ciente das leis aplicáveis em sua jurisdição sobre gravação de conversas, incluindo a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e demais normas pertinentes.</p>
          <p className="text-gray-700">A Ágata disponibiliza um recurso opcional de notificação automática de gravação, mas sua utilização não é obrigatória nem garantida pela plataforma.</p>

          <h2 className="text-xl font-semibold text-gray-900">5. Armazenamento e Exclusão de Dados</h2>
          <p className="text-gray-700">Os arquivos de áudio enviados são processados e excluídos automaticamente após 24 horas do upload. Transcrições e resumos permanecem disponíveis enquanto sua conta estiver ativa.</p>

          <h2 className="text-xl font-semibold text-gray-900">6. Planos e Pagamentos</h2>
          <p className="text-gray-700">A Ágata oferece planos gratuitos e pagos. Os planos pagos são cobrados mensalmente ou anualmente conforme a opção escolhida. Você pode cancelar sua assinatura a qualquer momento, mantendo o acesso até o final do período pago.</p>

          <h2 className="text-xl font-semibold text-gray-900">7. LGPD - Proteção de Dados</h2>
          <p className="text-gray-700">Estamos em conformidade com a Lei Geral de Proteção de Dados (LGPD). Para mais informações sobre como tratamos seus dados, consulte nossa <Link to="/legal/lgpd" className="text-emerald-600 hover:underline">Política de Privacidade</Link>.</p>

          <h2 className="text-xl font-semibold text-gray-900">8. Limitação de Responsabilidade</h2>
          <p className="text-gray-700">A Ágata Transcription não garante 100% de precisão nas transcrições. O serviço é fornecido "como está" e não nos responsabilizamos por decisões tomadas com base nas transcrições geradas.</p>

          <h2 className="text-xl font-semibold text-gray-900">9. Alterações nos Termos</h2>
          <p className="text-gray-700">Reservamo-nos o direito de alterar estes termos a qualquer momento. Alterações significativas serão comunicadas por email.</p>

          <h2 className="text-xl font-semibold text-gray-900">10. Contato</h2>
          <p className="text-gray-700">Para dúvidas sobre estes termos, entre em contato pelo email: contato@agatatranscription.com.br</p>
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
