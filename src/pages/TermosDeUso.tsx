import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/LogoIcon';

export default function TermosDeUso() {
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
            <nav className="hidden md:flex items-center space-x-6 text-sm">
              <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors">Home</Link>
              <Link to="/privacidade" className="text-gray-600 hover:text-emerald-600 transition-colors">Privacidade</Link>
              <Link to="/eula" className="text-gray-600 hover:text-emerald-600 transition-colors">EULA</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-[800px]">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">Termos de Uso</h1>
        <p className="text-sm text-gray-500 mb-10">Última atualização: Abril de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Aceitação dos Termos</h2>
            <p>Ao acessar ou utilizar a plataforma Ágata Transcription ("Plataforma"), operada pela RGM Consulting LTDA, CNPJ 39.288.530/0001-12, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso.</p>
            <p>Caso não concorde com qualquer disposição, você não deve utilizar nossos serviços. O uso contínuo da Plataforma constitui aceite integral e irrestrito dos presentes Termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Descrição do Serviço</h2>
            <p>A Ágata Transcription é uma plataforma SaaS de transcrição automática de reuniões com inteligência artificial, que converte áudio em texto, gera resumos executivos e atas profissionais em PDF.</p>
            <p>Planos disponíveis:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Trial Gratuito</strong> — 14 dias, 5 transcrições, sem cartão de crédito</li>
              <li><strong>Essencial</strong> — R$53/mês (ou R$530/ano), 30 transcrições/mês</li>
              <li><strong>Pro</strong> — R$196/mês (ou R$1.960/ano), 100 transcrições/mês, templates customizáveis</li>
              <li><strong>Enterprise</strong> — sob consulta, transcrições ilimitadas, suporte dedicado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Cadastro e Responsabilidades</h2>
            <p>Para utilizar a Plataforma, você deve criar uma conta fornecendo informações verdadeiras e atualizadas. Você é responsável por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Manter a confidencialidade de sua senha e credenciais de acesso</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
              <li>Obter o consentimento dos participantes antes de gravar reuniões</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Pagamento, Renovação e Cancelamento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Os planos pagos são cobrados antecipadamente (mensal ou anual) via Stripe</li>
              <li>A renovação é automática ao final de cada período, salvo cancelamento prévio</li>
              <li>O cancelamento pode ser realizado a qualquer momento pelo painel do usuário</li>
              <li>Após o cancelamento, o acesso é mantido até o final do período já pago</li>
              <li>Não há reembolso proporcional para períodos parciais</li>
              <li>A RGM Consulting reserva-se o direito de reajustar preços com aviso de 30 dias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Política de Uso Aceitável</h2>
            <p>É expressamente proibido:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar a Plataforma para fins ilegais ou em violação a leis aplicáveis</li>
              <li>Fazer upload de conteúdo ofensivo, difamatório, discriminatório ou ilegal</li>
              <li>Tentar violar a segurança do sistema ou acessar dados de outros usuários</li>
              <li>Gravar reuniões sem o consentimento dos participantes</li>
              <li>Revender, sublicenciar ou redistribuir o serviço sem autorização</li>
              <li>Utilizar bots, scrapers ou ferramentas automatizadas para acessar a Plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Limitação de Responsabilidade</h2>
            <p>A Plataforma é fornecida "como está" (as is). A RGM Consulting:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Não garante 100% de precisão nas transcrições geradas por IA</li>
              <li>Não se responsabiliza por decisões tomadas com base nas transcrições</li>
              <li>Não é responsável por indisponibilidades temporárias do serviço</li>
              <li>Limita sua responsabilidade ao valor pago pelo usuário nos últimos 3 meses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Suspensão e Encerramento</h2>
            <p>A RGM Consulting pode suspender ou encerrar o acesso do usuário em caso de:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Violação destes Termos de Uso ou do EULA</li>
              <li>Uso abusivo ou fraudulento da Plataforma</li>
              <li>Inadimplência por período superior a 30 dias</li>
              <li>Determinação judicial ou administrativa</li>
            </ul>
            <p>Em caso de encerramento, os dados do usuário ficarão disponíveis para download por 30 dias.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Alterações nos Termos</h2>
            <p>A RGM Consulting pode alterar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail com antecedência mínima de 15 dias. O uso contínuo da Plataforma após a vigência das alterações constitui aceite dos novos Termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Disposições Gerais</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Estes Termos são regidos pela legislação brasileira</li>
              <li>Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias</li>
              <li>A tolerância de qualquer parte em exigir o cumprimento de qualquer disposição não constituirá renúncia</li>
              <li>Se qualquer disposição for considerada inválida, as demais permanecerão em vigor</li>
            </ul>
          </section>

          <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-6 mt-10">
            <p className="text-sm text-gray-700">
              <strong>RGM Consulting LTDA</strong><br />
              CNPJ: 39.288.530/0001-12<br />
              Contato: contato@agatatranscription.com<br />
              São Paulo/SP — Brasil
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 text-center text-sm space-y-2">
          <div className="flex justify-center gap-6">
            <Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link to="/eula" className="hover:text-white transition-colors">EULA</Link>
          </div>
          <p>© 2026 Ágata Transcription. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
