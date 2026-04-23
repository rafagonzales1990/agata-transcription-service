import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/LogoIcon';

export default function Eula() {
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
              <Link to="/privacidade" className="text-gray-600 hover:text-emerald-600 transition-colors">Privacidade</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-[800px]">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">Contrato de Licença de Uso (EULA)</h1>
        <p className="text-sm text-gray-500 mb-10">Última atualização: Abril de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Licença de Uso</h2>
            <p>A RGM Consulting LTDA ("Licenciante"), CNPJ 39.288.530/0001-12, concede a você ("Licenciado") uma licença:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Limitada</strong> — restrita às funcionalidades do plano contratado</li>
              <li><strong>Não exclusiva</strong> — a mesma licença pode ser concedida a outros usuários</li>
              <li><strong>Intransferível</strong> — não pode ser cedida, sublicenciada ou compartilhada</li>
              <li><strong>Revogável</strong> — pode ser revogada em caso de violação deste contrato</li>
            </ul>
            <p>Esta licença permite o acesso e uso da plataforma Ágata Transcription exclusivamente para fins legítimos de transcrição e gerenciamento de reuniões.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Propriedade Intelectual</h2>
            <p>São de propriedade exclusiva da RGM Consulting LTDA:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Todo o código-fonte, algoritmos e modelos de IA da Plataforma</li>
              <li>A marca "Ágata", "Ágata Transcription", logotipos e identidade visual</li>
              <li>A interface do usuário, design e experiência de uso</li>
              <li>Documentação, manuais e materiais de treinamento</li>
              <li>Processos, métodos e fluxos de trabalho implementados na Plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Restrições Expressas</h2>
            <p>O Licenciado <strong>NÃO PODE</strong>, sob nenhuma circunstância:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Realizar engenharia reversa, descompilar ou desmontar qualquer parte da Plataforma</li>
              <li>Copiar, reproduzir ou criar obras derivadas do software</li>
              <li>Sublicenciar, alugar, vender ou distribuir a Plataforma a terceiros</li>
              <li>Utilizar a marca "Ágata" sem autorização prévia por escrito</li>
              <li>Remover avisos de direitos autorais ou propriedade intelectual</li>
              <li>Utilizar a API ou funcionalidades para competir diretamente com a Plataforma</li>
              <li>Tentar acessar servidores, bancos de dados ou infraestrutura da Plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Dados do Usuário</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Os arquivos de áudio e as transcrições geradas <strong>pertencem ao usuário</strong></li>
              <li>A Ágata <strong>NÃO utiliza</strong> conteúdo do usuário para treinar modelos de IA</li>
              <li>Os dados são processados exclusivamente para prestação do serviço contratado</li>
              <li>Após cancelamento, os dados ficam disponíveis para download por <strong>30 dias</strong></li>
              <li>Após o período de 30 dias, os dados são permanentemente excluídos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Violações e Penalidades</h2>
            <p>A violação deste EULA poderá resultar em:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Rescisão imediata</strong> da licença sem reembolso</li>
              <li><strong>Multa contratual</strong> de R$50.000,00 (cinquenta mil reais) por violação, sem prejuízo de indenização por perdas e danos</li>
              <li><strong>Responsabilidade criminal</strong> conforme a Lei 9.609/98 (Lei de Software), com pena de reclusão de 1 a 4 anos e multa</li>
              <li>Comunicação às autoridades competentes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Garantias e Limitação de Responsabilidade</h2>
            <p>A Plataforma é fornecida "COMO ESTÁ" (AS IS), sem garantias de qualquer tipo, expressas ou implícitas.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Não garantimos disponibilidade ininterrupta ou livre de erros</li>
              <li>Não garantimos 100% de precisão nas transcrições geradas por IA</li>
              <li>A responsabilidade total da Licenciante é limitada ao valor pago pelo Licenciado nos últimos <strong>3 meses</strong> de assinatura</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Vigência e Rescisão</h2>
            <p>Este contrato entra em vigor na data do aceite eletrônico e permanece válido enquanto o Licenciado utilizar a Plataforma.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>O Licenciado pode rescindir a qualquer momento cancelando sua conta</li>
              <li>A Licenciante pode rescindir em caso de violação, com notificação prévia de 15 dias (exceto em caso de violação grave)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Aceite Eletrônico</h2>
            <p>O aceite deste contrato é realizado eletronicamente no momento do cadastro na Plataforma, com validade jurídica nos termos da Medida Provisória 2.200-2/2001 e do Código Civil Brasileiro.</p>
            <p>O registro do aceite (data, hora, IP e versão do contrato) é armazenado como prova da manifestação de vontade.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Foro</h2>
            <p>Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias oriundas deste contrato, com exclusão de qualquer outro, por mais privilegiado que seja.</p>
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
