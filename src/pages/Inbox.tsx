import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Paperclip, 
  Send,
  Bot,
  User,
  CheckCheck,
  ArrowRightLeft,
  CheckCircle,
  MessageSquare,
  Loader2,
  X,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  FileSpreadsheet,
  UserCircle,
  Power,
  ArrowLeft // Novo ícone para navegação mobile
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TemplateQuickSelect from '@/components/inbox/TemplateQuickSelect';
import { 
  useConversations, 
  useMessages, 
  useSendMessage,
  useSendAIMessage,
  useResolveConversation,
  useMarkAsRead,
  type ConversationWithContact 
} from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useFileUpload, type UploadedFile } from '@/hooks/useFileUpload';
import { useIsMobile } from '@/hooks/use-mobile'; // Hook de responsividade
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile(); // Detecta se é dispositivo móvel
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithContact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingFile, setPendingFile] = useState<UploadedFile | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [conversationSummary, setConversationSummary] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const { data: messages = [], isLoading: loadingMessages } = useMessages(selectedConversation?.id || null);
  const sendMessage = useSendMessage();
  const sendAIMessage = useSendAIMessage();
  const resolveConversation = useResolveConversation();
  const markAsRead = useMarkAsRead();
  const { uploadFile, isUploading, getFileType, allowedTypes } = useFileUpload();

  const filteredConversations = conversations.filter(conv =>
    conv.contact?.nome?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && selectedConversation.unread_count > 0) {
      markAsRead.mutate(selectedConversation.id);
    }
  }, [selectedConversation?.id, markAsRead, selectedConversation]);

  const getStatusBadge = (conv: ConversationWithContact) => {
    if (conv.status === 'resolvido') {
      return <Badge className="bg-muted text-muted-foreground text-xs"><CheckCircle className="w-3 h-3 mr-1" />Resolvido</Badge>;
    }
    if (conv.is_bot_active) {
      return <Badge className="bg-primary/20 text-primary hover:bg-primary/30 text-xs"><Bot className="w-3 h-3 mr-1" />Bot</Badge>;
    }
    if (conv.assigned_to) {
      return <Badge className="bg-accent/20 text-accent-foreground hover:bg-accent/30 text-xs"><User className="w-3 h-3 mr-1" />Humano</Badge>;
    }
    return <Badge className="bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 text-xs">Pendente</Badge>;
  };

  const formatTimestamp = (date: string | null) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(d, 'HH:mm', { locale: ptBR });
    }
    return format(d, 'dd/MM', { locale: ptBR });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploaded = await uploadFile(file);
    if (uploaded) {
      setPendingFile(uploaded);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !pendingFile) || !selectedConversation) return;

    const content = messageInput.trim() || (pendingFile ? `📎 ${pendingFile.name}` : '');
    setMessageInput('');
    const fileToSend = pendingFile;
    setPendingFile(null);

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversation.id,
        content,
        senderType: 'agente',
        senderId: user?.id,
        attachmentUrl: fileToSend?.url,
        attachmentType: fileToSend?.type,
        attachmentName: fileToSend?.name,
      });

      if (selectedConversation.is_bot_active && !fileToSend) {
        await sendAIMessage.mutateAsync({
          conversationId: selectedConversation.id,
          userMessage: content,
          context: {
            servidor_nome: selectedConversation.contact?.nome,
            servidor_matricula: selectedConversation.contact?.matricula || undefined,
            servidor_secretaria: selectedConversation.contact?.secretaria || undefined,
          },
        });
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleResolve = async () => {
    if (!selectedConversation) return;
    
    try {
      await resolveConversation.mutateAsync(selectedConversation.id);
      toast.success('Conversa resolvida');
      setSelectedConversation(null);
    } catch (error) {
      toast.error('Erro ao resolver conversa');
    }
  };

  const handleToggleBot = async () => {
    if (!selectedConversation) return;
    
    try {
      const newBotState = !selectedConversation.is_bot_active;
      const { error } = await supabase
        .from('conversations')
        .update({ is_bot_active: newBotState })
        .eq('id', selectedConversation.id);
      
      if (error) throw error;
      
      setSelectedConversation({
        ...selectedConversation,
        is_bot_active: newBotState,
      });
      
      toast.success(newBotState ? 'IA ativada' : 'IA desativada');
    } catch (error) {
      toast.error('Erro ao alterar status da IA');
    }
  };

  // Melhoria: Limitar histórico para o resumo de IA
  const handleGenerateSummary = async () => {
    if (!selectedConversation || messages.length === 0) return;
    
    setSummaryLoading(true);
    setShowSummary(true);
    
    try {
      // Pega apenas as últimas 30 mensagens para um resumo mais focado e rápido
      const recentMessages = messages.slice(-30); 
      const messageHistory = recentMessages.map(m => {
        const sender = m.sender_type === 'servidor' ? 'Cidadão' : 
                       m.sender_type === 'ia' ? 'IA' : 'Agente';
        return `${sender}: ${m.content}`;
      }).join('\n');
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { 
              role: 'user', 
              content: `Faça um resumo conciso desta conversa de atendimento. Destaque os pontos principais, solicitações do cidadão e status atual:\n\n${messageHistory}` 
            }
          ],
        },
      });
      
      if (error) throw error;
      setConversationSummary(data.message || 'Não foi possível gerar o resumo.');
    } catch (error) {
      setConversationSummary('Erro ao gerar resumo da conversa.');
      toast.error('Erro ao gerar resumo');
    } finally {
      setSummaryLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.startsWith('audio/')) return Music;
    if (type.startsWith('video/')) return Video;
    return FileText;
  };

  const renderAttachment = (metadata: any) => {
    if (!metadata?.attachment_url) return null;
    
    const { attachment_url, attachment_type, attachment_name } = metadata;
    const fileType = getFileType(attachment_type || '');

    if (fileType === 'image') {
      return (
        <a href={attachment_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img 
            src={attachment_url} 
            alt={attachment_name || 'Imagem'} 
            className="max-w-full md:max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          />
        </a>
      );
    }

    if (fileType === 'audio') {
      return (
        <audio controls className="mt-2 w-full max-w-[240px] md:max-w-xs">
          <source src={attachment_url} type={attachment_type} />
        </audio>
      );
    }

    if (fileType === 'video') {
      return (
        <video controls className="mt-2 w-full max-w-xs rounded-lg">
          <source src={attachment_url} type={attachment_type} />
        </video>
      );
    }

    const FileIcon = getFileIcon(attachment_type || '');
    return (
      <a 
        href={attachment_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
      >
        <FileIcon className="w-5 h-5 text-primary shrink-0" />
        <span className="text-sm truncate">{attachment_name || 'Documento'}</span>
      </a>
    );
  };

  const getSenderInfo = (senderType: string) => {
    switch (senderType) {
      case 'ia':
        return { icon: Bot, label: 'FloxBee IA', color: 'text-primary' };
      case 'agente':
        return { icon: User, label: 'Atendente', color: 'text-accent-foreground' };
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden relative h-[calc(100vh-theme(spacing.16))] md:h-full">
      {/* Conversations List - Responsivo */}
      <div className={cn(
        "w-full md:w-[380px] flex flex-col border-r border-border bg-card transition-all",
        isMobile && selectedConversation ? "hidden" : "flex"
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Inbox</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Filtrar" className="text-muted-foreground">
                <Filter className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Mais opções" className="text-muted-foreground">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-10 bg-secondary border-0 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border/40",
                  "hover:bg-secondary/50",
                  selectedConversation?.id === conv.id && "bg-secondary"
                )}
              >
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {conv.contact?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground truncate">
                      {conv.contact?.nome || 'Contato Desconhecido'}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                      {formatTimestamp(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.contact?.whatsapp || ''}
                    </p>
                    {(conv.unread_count ?? 0) > 0 && (
                      <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-primary text-[10px]">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {getStatusBadge(conv)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area - Responsivo */}
      <div className={cn(
        "flex-1 flex flex-col bg-background h-full transition-all",
        isMobile && !selectedConversation ? "hidden" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header com botão Voltar no mobile */}
            <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-sm z-10">
              <div className="flex items-center gap-3 min-w-0">
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedConversation(null)}
                    className="mr-1 shrink-0"
                    aria-label="Voltar para lista"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selectedConversation.contact?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate leading-tight">
                    {selectedConversation.contact?.nome || 'Contato Desconhecido'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {selectedConversation.contact?.whatsapp}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Menu de opções" className="text-muted-foreground">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleGenerateSummary} className="gap-2 cursor-pointer">
                      <FileSpreadsheet className="w-4 h-4" /> Resumo da Conversa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowContactInfo(true)} className="gap-2 cursor-pointer">
                      <UserCircle className="w-4 h-4" /> Dados do Contato
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleToggleBot} className="gap-2 cursor-pointer">
                      <Power className={cn("w-4 h-4", selectedConversation.is_bot_active ? "text-green-500" : "text-muted-foreground")} />
                      {selectedConversation.is_bot_active ? 'Desativar IA' : 'Ativar IA'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Botões simplificados no mobile para economizar espaço */}
                <Button variant="outline" size={isMobile ? "icon" : "sm"} className="gap-2 shrink-0">
                  <ArrowRightLeft className="w-4 h-4" />
                  {!isMobile && "Transferir"}
                </Button>
                <Button 
                  variant="default" 
                  size={isMobile ? "icon" : "sm"} 
                  className="gap-2 shrink-0"
                  onClick={handleResolve}
                  disabled={resolveConversation.isPending || selectedConversation.status === 'resolvido'}
                >
                  {resolveConversation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {!isMobile && "Resolver"}
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 chat-pattern scrollbar-thin">
              <div className="max-w-4xl mx-auto space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                    <p>Inicie o atendimento enviando uma mensagem.</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const senderInfo = getSenderInfo(message.sender_type);
                    const isFromUser = message.sender_type === 'servidor';
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex w-full mb-1",
                          isFromUser ? 'justify-start' : 'justify-end'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative",
                            isFromUser ? "bg-card rounded-tl-none border border-border" : "rounded-tr-none",
                            message.sender_type === 'agente' && "bg-primary text-primary-foreground",
                            message.sender_type === 'ia' && "bg-indigo-600 text-white"
                          )}
                        >
                          {senderInfo && !isFromUser && (
                            <div className="flex items-center gap-1.5 mb-1 opacity-90">
                              <senderInfo.icon className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                {senderInfo.label}
                              </span>
                            </div>
                          )}
                          <p className="text-[13.5px] md:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          {renderAttachment(message.metadata)}
                          <div className={cn(
                            "flex items-center justify-end gap-1.5 mt-1.5 opacity-70",
                            !isFromUser && "text-white/80"
                          )}>
                            <span className="text-[10px] font-medium">
                              {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                            </span>
                            {!isFromUser && message.status && (
                              <CheckCheck className={cn(
                                "w-3.5 h-3.5",
                                message.status === 'read' ? 'text-blue-300' : 'text-white/60'
                              )} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input Area */}
            {selectedConversation.status !== 'resolvido' && (
              <div className="p-4 bg-card border-t border-border mt-auto">
                {pendingFile && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-secondary rounded-xl max-w-4xl mx-auto animate-in slide-in-from-bottom-2">
                    <div className="shrink-0">
                      {getFileType(pendingFile.type) === 'image' ? (
                        <img src={pendingFile.url} alt={pendingFile.name} className="w-12 h-12 object-cover rounded-lg border border-border" />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-lg">
                          {React.createElement(getFileIcon(pendingFile.type), { className: "w-6 h-6 text-primary" })}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{pendingFile.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {(pendingFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setPendingFile(null)}
                      aria-label="Remover anexo"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-end gap-2 md:gap-3 max-w-4xl mx-auto">
                  <div className="flex items-center mb-0.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept={allowedTypes.join(',')}
                      className="hidden"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-muted-foreground shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      aria-label="Anexar arquivo"
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </Button>
                    <TemplateQuickSelect
                      contactData={selectedConversation.contact || {}}
                      onSelectTemplate={(content) => setMessageInput(content)}
                    />
                  </div>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Digite uma mensagem..."
                      className="bg-secondary border-0 h-10 pr-4 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/30"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendMessage.isPending || sendAIMessage.isPending || isUploading}
                    />
                  </div>

                  <Button 
                    size="icon" 
                    className="h-10 w-10 rounded-full shrink-0 shadow-lg"
                    onClick={handleSendMessage}
                    disabled={(!messageInput.trim() && !pendingFile) || sendMessage.isPending || sendAIMessage.isPending || isUploading}
                    aria-label="Enviar mensagem"
                  >
                    {sendMessage.isPending || sendAIMessage.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Estado Vazio */
          <div className="flex-1 flex items-center justify-center bg-secondary/20 p-8 text-center">
            <div className="max-w-sm">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/5 flex items-center justify-center">
                <MessageSquare className="w-12 h-12 text-primary/30" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Seu Inbox</h3>
              <p className="text-muted-foreground leading-relaxed">
                Escolha uma conversa na lista ao lado para gerenciar o atendimento.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs - Mantidos para manter funcionalidade */}
      <Dialog open={showContactInfo} onOpenChange={setShowContactInfo}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <div className="bg-primary/5 p-6 flex flex-col items-center text-center border-b border-border">
            <Avatar className="w-20 h-20 mb-4 border-2 border-primary/20 p-1 bg-background">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl uppercase">
                {selectedConversation?.contact?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-xl text-foreground mb-1">{selectedConversation?.contact?.nome}</h3>
            <p className="text-primary font-medium text-sm">{selectedConversation?.contact?.whatsapp}</p>
          </div>
          
          <div className="p-6 space-y-4">
             {/* Campos dinâmicos do contato */}
            {selectedConversation?.contact && (
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Email', value: selectedConversation.contact.email },
                  { label: 'Matrícula', value: selectedConversation.contact.matricula },
                  { label: 'Secretaria', value: selectedConversation.contact.secretaria },
                  { label: 'Cargo', value: selectedConversation.contact.cargo }
                ].filter(f => f.value).map((field, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{field.label}</span>
                    <span className="text-sm font-medium">{field.value}</span>
                  </div>
                ))}
                
                {selectedConversation.contact.tags && selectedConversation.contact.tags.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedConversation.contact.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="px-2 py-0.5 text-[10px] rounded-md">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Bot className="w-6 h-6 text-primary" />
              Resumo Inteligente
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {summaryLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                <p className="text-muted-foreground text-sm animate-pulse">Analisando histórico da conversa...</p>
              </div>
            ) : (
              <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{conversationSummary}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inbox;