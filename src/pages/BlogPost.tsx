import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Calendar, Tag } from 'lucide-react';
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

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  readTime: number;
  createdAt: string;
}

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  createdAt: string;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;
      const { data } = await supabase
        .from('BlogPost')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (!data) {
        navigate('/blog');
        return;
      }

      setPost(data);
      document.title = `${data.title} | Ágata Transcription Blog`;

      // Fetch related
      const { data: relatedData } = await supabase
        .from('BlogPost')
        .select('slug, title, excerpt, category, readTime, createdAt')
        .eq('published', true)
        .eq('category', data.category)
        .neq('id', data.id)
        .order('createdAt', { ascending: false })
        .limit(3);

      setRelated(relatedData || []);
      setLoading(false);
    }
    fetchPost();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!post) return null;

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

      {/* Article */}
      <article className="py-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="max-w-3xl mx-auto mb-8">
            <Link to="/blog" className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Blog
            </Link>
          </div>

          {/* Header */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className={categoryColors[post.category] || 'bg-gray-100 text-gray-700'}>
                {categoryLabels[post.category] || post.category}
              </Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime} min de leitura
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.createdAt)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-xl text-gray-600">{post.excerpt}</p>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div
            className="max-w-3xl mx-auto prose prose-lg prose-emerald prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-emerald-600 prose-strong:text-gray-900 prose-li:text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="max-w-3xl mx-auto mt-12 pt-8 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-gray-400" />
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA inline */}
          <div className="max-w-3xl mx-auto mt-12 p-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Experimente a Ágata gratuitamente
              </h3>
              <p className="text-gray-600 mb-6">
                Transcreva suas reuniões automaticamente, gere resumos inteligentes e atas profissionais em PDF.
              </p>
              <Link to="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  Teste Grátis por 14 Dias <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-xs text-gray-500 mt-3">Sem cartão de crédito necessário</p>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Artigos relacionados</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                  <article className="bg-white rounded-xl border p-5 hover:shadow-lg transition-all hover:border-emerald-200 h-full">
                    <Badge className={`text-xs mb-3 ${categoryColors[r.category] || 'bg-gray-100 text-gray-700'}`}>
                      {categoryLabels[r.category] || r.category}
                    </Badge>
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {r.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{r.excerpt}</p>
                    <span className="text-xs text-gray-500">{r.readTime} min · {formatDate(r.createdAt)}</span>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
              <Link to="/legal/terms" className="hover:text-white transition-colors">Termos</Link>
              <Link to="/legal/lgpd" className="hover:text-white transition-colors">Privacidade</Link>
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
