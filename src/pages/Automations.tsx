import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bot,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Zap,
  MessageSquare,
  Clock,
  Users,
  Calendar,
  Ticket,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { 
  useAutomations, 
  AutomationRuleWithTemplate, 
  TriggerConfig,
  TRIGGER_TYPES 
} from "@/hooks/useAutomations";
import { useTemplates } from "@/hooks/useTemplates";
import { AutomationForm } from "@/components/automations/AutomationForm";

const getTriggerIcon = (type: string) => {
  switch (type) {
    case "keyword":
      return MessageSquare;
    case "new_contact":
      return Users;
    case "first_message":
      return Zap;
    case "no_response":
      return Clock;
    case "business_hours":
      return Calendar;
    case "ticket_created":
      return Ticket;
    default:
      return Bot;
  }
};

const getTriggerLabel = (type: string) => {
  return TRIGGER_TYPES.find(t => t.value === type)?.label || type;
};

const Automations: React.FC = () => {
  const { toast } = useToast();
  const { 
    rules, 
    logs, 
    isLoading, 
    createRule, 
    updateRule, 
    deleteRule,
    toggleRuleStatus 
  } = useAutomations();
  const { templates } = useTemplates();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRuleWithTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const handleCreate = async (data: Parameters<typeof createRule.mutateAsync>[0]) => {
    try {
      await createRule.mutateAsync(data);
      toast({ title: "Automação criada com sucesso!" });
      setFormOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao criar automação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (data: Parameters<typeof createRule.mutateAsync>[0]) => {
    if (!selectedRule) return;
    try {
      await updateRule.mutateAsync({ id: selectedRule.id, ...data });
      toast({ title: "Automação atualizada!" });
      setFormOpen(false);
      setSelectedRule(null);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteRule.mutateAsync(ruleToDelete);
      toast({ title: "Automação excluída!" });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string, ativo: boolean) => {
    try {
      await toggleRuleStatus.mutateAsync({ id, ativo });
      toast({ title: ativo ? "Automação ativada" : "Automação desativada" });
    } catch (error) {
      toast({
        title: "Erro ao alterar status",
        variant: "destructive",
      });
    }
  };

  const openEditForm = (rule: AutomationRuleWithTemplate) => {
    setSelectedRule(rule);
    setFormOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setRuleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const activeRules = rules.filter(r => r.ativo);
  const inactiveRules = rules.filter(r => !r.ativo);

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" />
            Automações
          </h1>
          <p className="text-muted-foreground">
            Configure respostas automáticas e gatilhos
          </p>
        </div>
        <Button onClick={() => { setSelectedRule(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Regras</p>
                <p className="text-2xl font-bold">{rules.length}</p>
              </div>
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{activeRules.length}</p>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativas</p>
                <p className="text-2xl font-bold text-muted-foreground">{inactiveRules.length}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Execuções (últimas 100)</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Regras ({rules.length})</TabsTrigger>
          <TabsTrigger value="logs">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Carregando automações...
              </CardContent>
            </Card>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma automação configurada</p>
                <Button 
                  className="mt-4" 
                  onClick={() => { setSelectedRule(null); setFormOpen(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira automação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => {
                const config = rule.trigger_config as unknown as TriggerConfig;
                const TriggerIcon = getTriggerIcon(config?.type || "");

                return (
                  <Card key={rule.id} className={!rule.ativo ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <TriggerIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{rule.nome}</h3>
                              <Badge variant={rule.ativo ? "default" : "secondary"}>
                                {rule.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Badge variant="outline">
                                {getTriggerLabel(config?.type || "")}
                              </Badge>
                              {config?.type === "keyword" && config.keywords?.length > 0 && (
                                <span>
                                  Palavras: {config.keywords.slice(0, 3).join(", ")}
                                  {config.keywords.length > 3 && ` +${config.keywords.length - 3}`}
                                </span>
                              )}
                              {config?.type === "no_response" && (
                                <span>Após {config.delay_minutes} min</span>
                              )}
                              {config?.type === "business_hours" && config.business_hours && (
                                <span>
                                  Fora de {config.business_hours.start} - {config.business_hours.end}
                                </span>
                              )}
                            </div>
                            {rule.template ? (
                              <p className="text-sm text-muted-foreground">
                                Template: <span className="font-medium">{rule.template.nome}</span>
                              </p>
                            ) : rule.mensagem ? (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {rule.mensagem}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={rule.ativo ?? false}
                            onCheckedChange={(checked) => handleToggleStatus(rule.id, checked)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => openEditForm(rule)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(rule.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Execuções</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma execução registrada
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Regra</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{log.rule?.nome || "-"}</TableCell>
                        <TableCell>{log.contact?.nome || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === "sucesso" ? "default" : "destructive"}>
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <AutomationForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedRule(null);
        }}
        onSubmit={selectedRule ? handleUpdate : handleCreate}
        isLoading={createRule.isPending || updateRule.isPending}
        rule={selectedRule}
        templates={templates}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Automação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta automação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Automations;
