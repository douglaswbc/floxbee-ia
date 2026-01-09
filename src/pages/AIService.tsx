import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Activity,
  Settings,
  TestTube,
  Globe,
} from "lucide-react";
import { AIChat } from "@/components/ai/AIChat";
import { useAutomations } from "@/hooks/useAutomations";
import { ScrollArea } from "@/components/ui/scroll-area";

const AIService: React.FC = () => {
  const { rules } = useAutomations();
  const activeRules = rules.filter(r => r.ativo);

  const [testContext, setTestContext] = useState({
    servidor_nome: "João Silva",
    servidor_matricula: "12345",
    servidor_secretaria: "Secretaria de Administração",
  });

  return (
    // ScrollArea garante que o conteúdo do topo não suma e seja rolável em qualquer tela
    <ScrollArea className="h-full w-full">
      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header - Ajustado para empilhar no mobile se necessário */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Bot className="w-6 h-6 md:w-7 md:h-7 text-primary shrink-0" />
              IA de Atendimento
            </h1>
            <p className="text-sm text-muted-foreground">
              FloxBee - Assistente virtual para atendimento automatizado
            </p>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="gap-1 px-3 py-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Online
            </Badge>
          </div>
        </div>

        {/* Stats - Grid dinâmica: 1 col (mobile), 2 cols (tablet), 4 cols (desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Modelo</p>
                  <p className="text-base md:text-lg font-semibold">GPT-4o Mini</p>
                </div>
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Automações Ativas</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{activeRules.length}</p>
                </div>
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-green-600 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Gateway</p>
                  <p className="text-base md:text-lg font-semibold">FloxBee IA</p>
                </div>
                <Globe className="w-6 h-6 md:w-8 md:h-8 text-blue-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Status</p>
                  <p className="text-base md:text-lg font-semibold text-green-600">Operacional</p>
                </div>
                <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="test" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="w-full justify-start md:w-auto">
              <TabsTrigger value="test" className="gap-2 flex-1 md:flex-none">
                <TestTube className="w-4 h-4" />
                Testar IA
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2 flex-1 md:flex-none">
                <Settings className="w-4 h-4" />
                Configurações
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="test">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Test - Colspan ajustado para desktop */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <AIChat 
                  context={testContext}
                  onHumanTransferRequest={() => {
                    console.log("Transfer requested");
                  }}
                  className="h-[500px] md:h-[600px] w-full"
                />
              </div>

              {/* Test Context - Sobe para o topo no mobile ou fica ao lado no desktop */}
              <div className="order-1 lg:order-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contexto de Teste</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <input
                        type="text"
                        value={testContext.servidor_nome}
                        onChange={(e) => setTestContext(prev => ({ ...prev, servidor_nome: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Matrícula</label>
                      <input
                        type="text"
                        value={testContext.servidor_matricula}
                        onChange={(e) => setTestContext(prev => ({ ...prev, servidor_matricula: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Secretaria</label>
                      <input
                        type="text"
                        value={testContext.servidor_secretaria}
                        onChange={(e) => setTestContext(prev => ({ ...prev, servidor_secretaria: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Temas suportados:</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Contracheque</Badge>
                        <Badge variant="secondary">Férias</Badge>
                        <Badge variant="secondary">Licenças</Badge>
                        <Badge variant="secondary">Benefícios</Badge>
                        <Badge variant="secondary">Progressão</Badge>
                        <Badge variant="secondary">Documentos</Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t hidden sm:block">
                      <p className="text-sm font-medium mb-2">Exemplos de perguntas:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• "Como solicitar segunda via do contracheque?"</li>
                        <li>• "Quais são os benefícios disponíveis?"</li>
                        <li>• "Quando posso tirar férias?"</li>
                        <li>• "Preciso atualizar meu endereço"</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Modelo de IA</h3>
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">OpenAI GPT-4o Mini</p>
                          <p className="text-sm text-muted-foreground truncate">Via FloxBee IA Gateway</p>
                        </div>
                        <Badge className="shrink-0">Ativo</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Modelo configurado pelo administrador</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Integração WhatsApp</h3>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">Webhook Configurado</p>
                          <p className="text-sm text-muted-foreground truncate">Recebendo mensagens</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">Pronto</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Funcionalidades</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                        <span className="font-medium">Respostas Automáticas</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        IA responde automaticamente às mensagens dos servidores
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-primary shrink-0" />
                        <span className="font-medium text-sm">Transferência Inteligente</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Identifica quando encaminhar para atendente humano
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-5 h-5 text-primary shrink-0" />
                        <span className="font-medium">Contexto Personalizado</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Usa dados do servidor para respostas personalizadas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A IA está configurada para atender servidores públicos, responder dúvidas sobre 
                    contracheque, férias, licenças e benefícios. Quando necessário, encaminha automaticamente 
                    para atendimento humano.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

export default AIService;