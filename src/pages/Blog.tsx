import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LogoIcon } from '@/components/LogoIcon';

const categoryLabels: Record<string, string> = {
  produtividade: 'Produtividade',
  transcricao: 'Transcrição',
  reunioes: 'Reuniões',
  tecnologia: 'Tecnologia',
  'dicas-praticas': 'Dicas Práticas',
};

const categoryColors: Record<string, string> = {
  produtividade: 'bg-blue-100 text-blue-700',
  transcricao: 'bg-emerald-100 text-emerald-700',
  reunioes: 'bg-purple-100 text-purple-700',
  tecnologia: 'bg-amber-100 text-amber-700',
  'dicas-praticas': 'bg-rose-100 text-rose-700',
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  readTime: number;
  createdAt: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Blog | Ágata Transcription - Dicas de Produtividade e Reuniões';
    async function fetchPosts() {
      const { data } = await supabase
        .from('BlogPost')
        .select('slug, title, excerpt, coverImage, category, tags, readTime, createdAt')
        .eq('published', true)
        .order('createdAt', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <LogoIcon size={36} />
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">
                  Ágata
                </span>
                <span className="text-[10px] text-gray-500 -mt-0.5 tracking-wide">Transcription</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors">Home</Link>
              <Link to="/blog" className="text-emerald-600 font-medium">Blog</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  Teste Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700">
            <BookOpen className="h-3 w-3 mr-1" />
            Blog
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Dicas para{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              reuniões produtivas
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Artigos sobre transcrição automática, atas profissionais, produtividade e como
            usar inteligência artificial para otimizar seu dia a dia.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Carregando artigos...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Nenhum artigo publicado ainda. Volte em breve!</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featured && (
                <Link to={`/blog/${featured.slug}`} className="block mb-12">
                  <article className="group grid md:grid-cols-2 gap-8 p-6 rounded-2xl border hover:shadow-xl transition-all hover:border-emerald-200">
                    {featured.coverImage && (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={featured.coverImage}
                          alt={featured.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={categoryColors[featured.category] || 'bg-gray-100 text-gray-700'}>
                          {categoryLabels[featured.category] || featured.category}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {featured.readTime} min de leitura
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-3">{featured.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{formatDate(featured.createdAt)}</span>
                        <span className="text-emerald-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          Ler artigo <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              )}

              {/* Rest of Posts */}
              {rest.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map((post) => (
                    <Link key={post.slug} to={`/blog/${post.slug}`} className="block group">
                      <article className="h-full rounded-xl border hover:shadow-lg transition-all hover:border-emerald-200 overflow-hidden">
                        {post.coverImage && (
                          <div className="relative aspect-video bg-gray-100 overflow-hidden">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className={`text-xs ${categoryColors[post.category] || 'bg-gray-100 text-gray-700'}`}>
                              {categoryLabels[post.category] || post.category}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime} min
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.excerpt}</p>
                          <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Pronto para transformar suas reuniões?
          </h2>
          <p className="text-emerald-100 mb-6 max-w-xl mx-auto">
            Experimente a Ágata gratuitamente. Transcreva, resuma e gere atas profissionais em minutos.
          </p>
          <Link to="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Começar Grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <LogoIcon size={32} />
              <span className="font-bold text-white text-lg">Ágata <span className="font-normal text-gray-400">Transcription</span></span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm">
            <p>© 2026 Ágata Transcription. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
