import { motion } from 'framer-motion';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CHROME_STORE_URL = 'https://chrome.google.com/webstore/detail/agata-transcription';

function BrowserMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Browser frame */}
      <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border-b border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-gray-700 rounded-md px-3 py-1 text-xs text-gray-400 text-center truncate">
              meet.google.com/abc-defg-hij
            </div>
          </div>
        </div>

        {/* Meet screen */}
        <div className="relative bg-gray-900 aspect-[4/3] p-6 flex items-center justify-center gap-6">
          {/* Participant avatars */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-lg font-bold">MC</div>
            <span className="text-[10px] text-gray-500">Mariana C.</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-lg font-bold">RA</div>
            <span className="text-[10px] text-gray-500">Ricardo A.</span>
          </div>

          {/* Floating Ágata button */}
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
              <div className="w-4 h-4 rounded-sm bg-emerald-500" style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }} />
              <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">Gravar reunião</span>
            </div>
          </div>

          {/* Recording indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-[10px] text-red-400 font-medium">REC 02:34</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChromeExtensionSection() {
  const features = [
    'Captura microfone + áudio dos participantes',
    'Funciona no Google Meet, Zoom e Microsoft Teams',
    'Sincroniza automaticamente com sua conta Ágata',
  ];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: '#111827' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left side - 60% */}
          <motion.div
            className="lg:col-span-3 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
              NOVO • Extensão Chrome
            </span>

            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Grave reuniões diretamente no Meet, Zoom e Teams
            </h2>

            <p className="text-gray-400 text-lg">
              Instale a extensão e um botão aparece automaticamente em qualquer reunião. Um clique para gravar, transcrição pronta em minutos.
            </p>

            <ul className="space-y-3">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 pt-2">
              <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 text-base px-8">
                  Adicionar ao Chrome — É grátis
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </a>
              <p className="text-xs text-gray-500">Também funciona no Microsoft Edge</p>
              <div className="flex items-center gap-3 text-gray-500">
                {/* Chrome icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                  <circle cx="12" cy="12" r="4"/>
                </svg>
                {/* Edge icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-7a7 7 0 100 14 7 7 0 000-14z"/>
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Right side - 40% */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <BrowserMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
