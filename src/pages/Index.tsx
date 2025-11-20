import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [activeTab, setActiveTab] = useState('voice');

  const services = [
    {
      id: 'voice',
      title: 'Voice chat без id бесплатно!',
      icon: 'Mic',
    },
    {
      id: 'copy',
      title: 'Копирование плейсов из роблокса с скриптами бесплатно!',
      icon: 'Copy',
    },
    {
      id: 'followers',
      title: 'Накрутка followers в ваш роблокс аккаунт бесплатно!',
      icon: 'Users',
    },
    {
      id: 'players',
      title: 'Накрутка игроков для вашего плейса роблокс бесплатно!',
      icon: 'UserPlus',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Roblox Services
          </h1>
          <p className="text-muted-foreground text-lg">
            Бесплатные сервисы для твоего Roblox опыта
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent p-0 mb-8">
            {services.map((service) => (
              <TabsTrigger
                key={service.id}
                value={service.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-card hover:bg-card/80 transition-all duration-200 h-auto py-4 px-3 rounded-lg border-2 border-transparent data-[state=active]:border-primary"
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon name={service.icon} size={24} />
                  <span className="text-xs font-medium hidden md:block">
                    {service.id === 'voice' && 'Voice Chat'}
                    {service.id === 'copy' && 'Копирование'}
                    {service.id === 'followers' && 'Followers'}
                    {service.id === 'players' && 'Игроки'}
                  </span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {services.map((service) => (
            <TabsContent
              key={service.id}
              value={service.id}
              className="animate-fade-in"
            >
              <Card className="p-8 bg-card border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon name={service.icon} size={28} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">{service.title}</h2>
                </div>

                <div className="mb-8">
                  <p className="text-muted-foreground mb-6">
                    Следуй инструкциям по видео снизу
                  </p>
                  
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
                    <div className="text-center">
                      <Icon name="Video" size={48} className="mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Видео-инструкция</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-8">
                  <h3 className="text-lg font-semibold mb-4">Вставляй это сюда</h3>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <Textarea
                        placeholder="Ваше сообщение"
                        className="bg-background border-border min-h-[100px]"
                      />
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Отправить
                      <Icon name="Send" size={18} className="ml-2" />
                    </Button>
                  </form>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;