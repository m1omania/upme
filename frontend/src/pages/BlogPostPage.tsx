import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import type { BlogPost } from './BlogPage';
import { defaultPosts } from './BlogPage';

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);

  // Загружаем статьи из localStorage или используем дефолтные
  useEffect(() => {
    const savedPosts = localStorage.getItem('blogPosts');
    let allPosts: BlogPost[] = defaultPosts;
    
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allPosts = parsed;
        }
      } catch (e) {
        console.error('Error parsing blog posts from localStorage:', e);
      }
    }

    const foundPost = allPosts.find((p) => p.id === Number(id));
    setPost(foundPost || null);
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!post) {
    return (
      <Container maxWidth="lg">
        <div className="py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Статья не найдена</h1>
            <Button onClick={() => navigate('/blog')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к блогу
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <div className="py-8">
        {/* Кнопка назад */}
        <Button
          onClick={() => navigate('/blog')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к блогу
        </Button>

        {/* Заголовок статьи */}
        <article className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime} мин чтения</span>
              </div>
            </div>
          </div>

          {/* Изображение (если есть) */}
          {post.imageUrl && (
            <div className="w-full h-64 md:h-96 bg-muted rounded-lg overflow-hidden mb-8">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Содержание статьи */}
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              lineHeight: '1.8',
            }}
          />
          <style>{`
            .prose h2 {
              font-size: 1.5rem;
              font-weight: 700;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            .prose h3 {
              font-size: 1.25rem;
              font-weight: 600;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }
            .prose p {
              margin-bottom: 1rem;
            }
            .prose ul, .prose ol {
              margin-bottom: 1rem;
              padding-left: 1.5rem;
            }
            .prose li {
              margin-bottom: 0.5rem;
            }
          `}</style>
        </article>
      </div>
    </Container>
  );
}

