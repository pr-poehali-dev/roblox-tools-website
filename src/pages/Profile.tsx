import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Ошибка',
          description: 'Размер файла не должен превышать 5MB',
          variant: 'destructive',
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите никнейм',
        variant: 'destructive',
      });
      return;
    }

    if (nickname.length < 3 || nickname.length > 20) {
      toast({
        title: 'Ошибка',
        description: 'Никнейм должен быть от 3 до 20 символов',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let uploadedAvatarUrl = avatarUrl;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const uploadResponse = await fetch('https://functions.poehali.dev/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedAvatarUrl = uploadData.url;
        }
      }

      const response = await fetch('https://functions.poehali.dev/c43cab11-b18a-476b-8724-e5478a6a9f57', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_token') || '',
        },
        body: JSON.stringify({
          action: 'update_profile',
          nickname,
          avatar_url: uploadedAvatarUrl || previewUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('user_nickname', nickname);
        localStorage.setItem('user_avatar', uploadedAvatarUrl || previewUrl);
        toast({
          title: 'Профиль обновлён!',
          description: 'Ваш профиль успешно настроен',
        });
        navigate('/');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить профиль',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Настрой свой профиль</h1>
          <p className="text-muted-foreground">Выбери аватарку и никнейм</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32 border-4 border-primary/20">
              <AvatarImage src={previewUrl || avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-4xl">
                <Icon name="User" size={48} className="text-primary" />
              </AvatarFallback>
            </Avatar>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-border hover:bg-card"
            >
              <Icon name="Upload" size={18} className="mr-2" />
              Загрузить фото
            </Button>
          </div>

          <div>
            <Input
              placeholder="Введи свой никнейм"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-background border-border text-center text-lg"
              maxLength={20}
              required
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              От 3 до 20 символов
            </p>
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить профиль'}
              {!loading && <Icon name="Check" size={18} className="ml-2" />}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
            >
              Пропустить
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
