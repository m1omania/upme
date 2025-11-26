import { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, X } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: number;
  tags: string[];
  imageUrl?: string;
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    // Загружаем статьи из localStorage при инициализации
    const savedPosts = localStorage.getItem('blogPosts');
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing blog posts from localStorage:', e);
      }
    }
    return [];
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: 'Команда UpMe',
    publishedAt: new Date().toISOString().split('T')[0],
    readTime: 5,
    tags: [] as string[],
    imageUrl: '',
    newTag: '',
  });

  const handleAddPost = () => {
    setIsEditing(true);
    setEditingPost(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      author: 'Команда UpMe',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: 5,
      tags: [],
      imageUrl: '',
      newTag: '',
    });
  };

  const handleEditPost = (post: BlogPost) => {
    setIsEditing(true);
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      publishedAt: post.publishedAt,
      readTime: post.readTime,
      tags: [...post.tags],
      imageUrl: post.imageUrl || '',
      newTag: '',
    });
  };

  const handleDeletePost = (id: number) => {
    if (confirm('Вы уверены, что хотите удалить эту статью?')) {
      const updatedPosts = posts.filter((p) => p.id !== id);
      setPosts(updatedPosts);
      // Сохраняем в localStorage
      localStorage.setItem('blogPosts', JSON.stringify(updatedPosts));
    }
  };

  const handleSavePost = () => {
    if (!formData.title || !formData.excerpt || !formData.content) {
      alert('Заполните все обязательные поля');
      return;
    }

    let updatedPosts: BlogPost[];

    if (editingPost) {
      // Редактирование существующей статьи
      updatedPosts = posts.map((p) =>
        p.id === editingPost.id
          ? {
              ...p,
              ...formData,
              tags: formData.tags,
            }
          : p
      );
    } else {
      // Создание новой статьи
      const newPost: BlogPost = {
        id: Date.now(),
        ...formData,
        tags: formData.tags,
      };
      updatedPosts = [...posts, newPost];
    }

    setPosts(updatedPosts);
    // Сохраняем в localStorage
    localStorage.setItem('blogPosts', JSON.stringify(updatedPosts));

    setIsEditing(false);
    setEditingPost(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      author: 'Команда UpMe',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: 5,
      tags: [],
      imageUrl: '',
      newTag: '',
    });
  };

  const handleAddTag = () => {
    if (formData.newTag.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag.trim()],
        newTag: '',
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <Container maxWidth="lg">
      <div className="py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Админка блога</h1>
            <p className="text-muted-foreground">Управление статьями блога</p>
          </div>
          <Button onClick={handleAddPost}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить статью
          </Button>
        </div>

        {isEditing ? (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingPost ? 'Редактировать статью' : 'Новая статья'}</CardTitle>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Заголовок *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Заголовок статьи"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Краткое описание *</label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Краткое описание статьи"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Содержание *</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Полный текст статьи (можно использовать HTML)"
                  rows={15}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Автор</label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Автор"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Дата публикации</label>
                  <Input
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Время чтения (мин)</label>
                  <Input
                    type="number"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">URL изображения</label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Теги</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={formData.newTag}
                    onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
                    placeholder="Новый тег"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Добавить
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSavePost}>Сохранить</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">Нет статей</p>
                <Button onClick={handleAddPost}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить первую статью
                </Button>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{post.title}</CardTitle>
                      <CardDescription className="mb-4">{post.excerpt}</CardDescription>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Автор: {post.author} | Дата: {post.publishedAt} | Время чтения: {post.readTime} мин
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Container>
  );
}

