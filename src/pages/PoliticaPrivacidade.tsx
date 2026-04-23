import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/LogoIcon';

export default function PoliticaPrivacidade() {
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
              <Link to="/termos" className="text-gray-600 hover:text-emerald-600 transition-colors">Termos</Link>
              <Link to="/eula" className="text-gray-600 hover:text-emerald-600 transition-colors">EULA</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-[800px]">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-10">Última atualização: Abril de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Controlador de Dados</h2>
            <p><strong>RGM Consulting LTDA</strong><br />
            CNPJ: 39.288.530/0001-12<br />
            Encarregado de Proteção de Dados (DPO): Rafael Gonzales<br />
            E-mail: <a href="mailto:privacidade@agatatranscription.com" className="text-emerald-600 hover:underline">privacidade@agatatranscription.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Dados Coletados</h2>
            <p>Coletamos os seguintes dados pessoais para prestação do serviço:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, e-mail, CPF (para emissão de nota fiscal)</li>
              <li><strong>Dados de conteúdo:</strong> arquivos de áudio/vídeo, transcrições e resumos gerados</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional</li>
              <li><strong>Dados de uso:</strong> número de transcrições, plano contratado, funcionalidades utilizadas</li>
              <li><strong>Cookies:</strong> cookies essenciais de sessão e cookies analíticos (Google Analytics 4)</li>
              <li><strong>Dados de pagamento:</strong> processados diretamente pelo Stripe (não armazenamos dados de cartão)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Base Legal (LGPD Art. 7º)</h2>
            <p>O tratamento de dados pessoais é realizado com base nas seguintes hipóteses legais:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Execução de contrato</strong> (Art. 7º, V) — para prestação do serviço contratado</li>
              <li><strong>Consentimento</strong> (Art. 7º, I) — para envio de comunicações de marketing</li>
              <li><strong>Legítimo interesse</strong> (Art. 7º, IX) — para melhoria do serviço e prevenção de fraudes</li>
              <li><strong>Cumprimento de obrigação legal</strong> (Art. 7º, II) — para obrigações fiscais e regulatórias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Compartilhamento com Terceiros</h2>
            <p>Utilizamos provedores de serviço com políticas de privacidade compatíveis com a LGPD:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> — armazenamento de dados e autenticação (servidores nos EUA)</li>
              <li><strong>Stripe</strong> — processamento de pagamentos (PCI DSS Level 1)</li>
              <li><strong>Google Gemini AI</strong> — processamento de transcrição e geração de resumos</li>
              <li><strong>OpenAI</strong> — serviço de fallback para transcrição (Whisper) e resumos (GPT-4o-mini)</li>
              <li><strong>Resend</strong> — envio de e-mails transacionais</li>
              <li><strong>Google Analytics 4</strong> — análise agregada de uso da plataforma</li>
            </ul>
            <p>Não vendemos, compartilhamos ou utilizamos seus dados para treinamento de modelos de IA de terceiros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Retenção de Dados</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dados da conta são mantidos enquanto a conta estiver ativa</li>
              <li>Arquivos de áudio originais são excluídos automaticamente em até 24 horas após a transcrição</li>
              <li>Transcrições e resumos permanecem disponíveis enquanto a conta estiver ativa</li>
              <li>Após cancelamento, os dados ficam disponíveis por 90 dias para download</li>
              <li>Após solicitação de exclusão, todos os dados são removidos em até 30 dias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Direitos do Titular (LGPD)</h2>
            <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados a outro fornecedor</li>
              <li>Eliminação dos dados tratados com consentimento</li>
              <li>Informação sobre compartilhamento de dados com terceiros</li>
              <li>Revogação do consentimento a qualquer momento</li>
            </ul>
            <p>Para exercer esses direitos, entre em contato: <a href="mailto:privacidade@agatatranscription.com" className="text-emerald-600 hover:underline">privacidade@agatatranscription.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Cookies e Google Analytics 4</h2>
            <p>Utilizamos cookies essenciais para o funcionamento da plataforma e manutenção da sessão de login. Também utilizamos Google Analytics 4 (GA4) e Google Tag Manager para análise de uso agregado.</p>
            <p>Você pode desativar cookies nas configurações do seu navegador, mas isso pode afetar funcionalidades da Plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Transferência Internacional</h2>
            <p>Seus dados podem ser transferidos para servidores nos Estados Unidos (Supabase, Stripe, Google, OpenAI). Essas transferências são realizadas com base em cláusulas contratuais padrão e em conformidade com o Art. 33 da LGPD.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Contato do DPO</h2>
            <p>Encarregado de Proteção de Dados: Rafael Gonzales<br />
            E-mail: <a href="mailto:privacidade@agatatranscription.com" className="text-emerald-600 hover:underline">privacidade@agatatranscription.com</a><br />
            Site: <a href="https://agatatranscription.com" className="text-emerald-600 hover:underline">agatatranscription.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Alterações nesta Política</h2>
            <p>Podemos atualizar esta Política de Privacidade periodicamente. Alterações significativas serão comunicadas por e-mail com antecedência mínima de 15 dias. A versão mais recente estará sempre disponível nesta página.</p>
          </section>

          <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-6 mt-10">
            <p className="text-sm text-gray-700">
              <strong>RGM Consulting LTDA</strong><br />
              CNPJ: 39.288.530/0001-12<br />
              DPO: Rafael Gonzales — privacidade@agatatranscription.com<br />
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
