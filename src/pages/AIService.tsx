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

const AIService: React.FC = () => {
  const { rules } = useAutomations();
  const activeRules = rules.filter(r => r.ativo);

  const [testContext, setTestContext] = useState({
    servidor_nome: "João Silva",
    servidor_matricula: "12345",
    servidor_secretaria: "Secretaria de Administração",
  });

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" />
            IA de Atendimento
          </h1>
          <p className="text-muted-foreground">
            FloxBee - Assistente virtual para atendimento automatizado
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Online
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="text-lg font-semibold">GPT-4o Mini</p>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Automações Ativas</p>
                <p className="text-2xl font-bold text-green-600">{activeRules.length}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gateway</p>
                <p className="text-lg font-semibold">FloxBee IA</p>
              </div>
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-green-600">Operacional</p>
              </div>
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test" className="gap-2">
            <TestTube className="w-4 h-4" />
            Testar IA
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Test */}
            <div className="lg:col-span-2">
              <AIChat 
                context={testContext}
                onHumanTransferRequest={() => {
                  console.log("Transfer requested");
                }}
                className="h-[600px]"
              />
            </div>

            {/* Test Context */}
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
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Matrícula</label>
                  <input
                    type="text"
                    value={testContext.servidor_matricula}
                    onChange={(e) => setTestContext(prev => ({ ...prev, servidor_matricula: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Secretaria</label>
                  <input
                    type="text"
                    value={testContext.servidor_secretaria}
                    onChange={(e) => setTestContext(prev => ({ ...prev, servidor_secretaria: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
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

                <div className="pt-4 border-t">
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">OpenAI GPT-4o Mini</p>
                        <p className="text-sm text-muted-foreground">Via FloxBee IA Gateway</p>
                      </div>
                      <Badge>Ativo</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Modelo configurado pelo administrador</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Integração WhatsApp</h3>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Webhook Configurado</p>
                        <p className="text-sm text-muted-foreground">Recebendo mensagens</p>
                      </div>
                      <Badge variant="outline">Pronto</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Funcionalidades</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <span className="font-medium">Respostas Automáticas</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      IA responde automaticamente às mensagens dos servidores
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="font-medium">Transferência Inteligente</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Identifica quando encaminhar para atendente humano
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-5 h-5 text-primary" />
                      <span className="font-medium">Contexto Personalizado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Usa dados do servidor para respostas personalizadas
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
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
  );
};

export default AIService;
