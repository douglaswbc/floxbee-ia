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
  Power
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when selecting conversation
  useEffect(() => {
    if (selectedConversation && selectedConversation.unread_count > 0) {
      markAsRead.mutate(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

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
    return <Badge className="bg-status-away/20 text-status-away hover:bg-status-away/30 text-xs">Pendente</Badge>;
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
    
    // Reset file input
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
      // Send human message with optional attachment
      await sendMessage.mutateAsync({
        conversationId: selectedConversation.id,
        content,
        senderType: 'agente',
        senderId: user?.id,
        attachmentUrl: fileToSend?.url,
        attachmentType: fileToSend?.type,
        attachmentName: fileToSend?.name,
      });

      // If bot is active, get AI response (only for text messages)
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

  const handleGenerateSummary = async () => {
    if (!selectedConversation || messages.length === 0) return;
    
    setSummaryLoading(true);
    setShowSummary(true);
    
    try {
      // Create a summary from the messages
      const messageHistory = messages.map(m => {
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
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          />
        </a>
      );
    }

    if (fileType === 'audio') {
      return (
        <audio controls className="mt-2 max-w-xs">
          <source src={attachment_url} type={attachment_type} />
        </audio>
      );
    }

    if (fileType === 'video') {
      return (
        <video controls className="mt-2 max-w-xs rounded-lg">
          <source src={attachment_url} type={attachment_type} />
        </video>
      );
    }

    // Document
    const FileIcon = getFileIcon(attachment_type || '');
    return (
      <a 
        href={attachment_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
      >
        <FileIcon className="w-5 h-5 text-primary" />
        <span className="text-sm truncate">{attachment_name || 'Documento'}</span>
      </a>
    );
  };

  const getSenderInfo = (senderType: string) => {
    switch (senderType) {
      case 'ia':
        return { icon: Bot, label: 'FloxBee IA', color: 'text-primary' };
      case 'agente':
        return { icon: User, label: 'Atendente', color: 'text-accent' };
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Conversations List */}
      <div className="w-[380px] flex flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Inbox</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Filter className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-10 bg-secondary border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-border/50",
                  "hover:bg-secondary/80",
                  selectedConversation?.id === conv.id && "bg-secondary"
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {conv.contact?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground truncate">
                      {conv.contact?.nome || 'Contato Desconhecido'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.contact?.whatsapp || ''}
                    </p>
                    <div className="flex items-center gap-2">
                      {(conv.unread_count ?? 0) > 0 && (
                        <span className="flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    {getStatusBadge(conv)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {selectedConversation.contact?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-foreground">
                  {selectedConversation.contact?.nome || 'Contato Desconhecido'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.contact?.whatsapp}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  <DropdownMenuItem onClick={handleGenerateSummary} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4" />
                    Resumo da Conversa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowContactInfo(true)} className="gap-2 cursor-pointer">
                    <UserCircle className="w-4 h-4" />
                    Dados do Contato
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleToggleBot} className="gap-2 cursor-pointer">
                    <Power className={cn("w-4 h-4", selectedConversation.is_bot_active ? "text-status-online" : "text-muted-foreground")} />
                    {selectedConversation.is_bot_active ? 'Desativar IA' : 'Ativar IA'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Transferir
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="gap-2"
                onClick={handleResolve}
                disabled={resolveConversation.isPending || selectedConversation.status === 'resolvido'}
              >
                {resolveConversation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Resolver
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 chat-pattern scrollbar-thin">
            <div className="max-w-3xl mx-auto space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                </div>
              ) : (
                messages.map((message) => {
                  const senderInfo = getSenderInfo(message.sender_type);
                  const isFromUser = message.sender_type === 'servidor';
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex message-bubble",
                        isFromUser ? 'justify-start' : 'justify-end'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[65%] rounded-lg px-3 py-2 shadow-sm",
                          isFromUser && "bg-message-received",
                          message.sender_type === 'agente' && "bg-message-sent",
                          message.sender_type === 'ia' && "bg-message-ai"
                        )}
                      >
                        {senderInfo && (
                          <div className="flex items-center gap-1 mb-1">
                            <senderInfo.icon className={cn("w-3 h-3", senderInfo.color)} />
                            <span className={cn("text-xs font-medium", senderInfo.color)}>
                              {senderInfo.label}
                            </span>
                          </div>
                        )}
                        <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
                        {renderAttachment(message.metadata)}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                          </span>
                          {!isFromUser && message.status && (
                            <CheckCheck className={cn(
                              "w-4 h-4",
                              message.status === 'read' ? 'text-primary' : 'text-muted-foreground'
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

          {/* Message Input */}
          {selectedConversation.status !== 'resolvido' && (
            <div className="p-4 bg-card border-t border-border">
              {/* Pending file preview */}
              {pendingFile && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-secondary/50 rounded-lg max-w-3xl mx-auto">
                  {getFileType(pendingFile.type) === 'image' ? (
                    <img src={pendingFile.url} alt={pendingFile.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded">
                      {React.createElement(getFileIcon(pendingFile.type), { className: "w-6 h-6 text-primary" })}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(pendingFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setPendingFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3 max-w-3xl mx-auto">
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
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </Button>
                <TemplateQuickSelect
                  contactData={{
                    nome: selectedConversation.contact?.nome || undefined,
                    matricula: selectedConversation.contact?.matricula || undefined,
                    secretaria: selectedConversation.contact?.secretaria || undefined,
                    email: selectedConversation.contact?.email || undefined,
                    cargo: selectedConversation.contact?.cargo || undefined,
                  }}
                  onSelectTemplate={(content) => setMessageInput(content)}
                />
                <Input
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-secondary border-0"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={sendMessage.isPending || sendAIMessage.isPending || isUploading}
                />
                <Button 
                  size="icon" 
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleSendMessage}
                  disabled={(!messageInput.trim() && !pendingFile) || sendMessage.isPending || sendAIMessage.isPending || isUploading}
                >
                  {sendMessage.isPending || sendAIMessage.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-secondary/30">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">Selecione uma conversa</h3>
            <p className="text-muted-foreground">Escolha uma conversa para começar a atender</p>
          </div>
        </div>
      )}

      {/* Contact Info Dialog */}
      <Dialog open={showContactInfo} onOpenChange={setShowContactInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-primary" />
              Dados do Contato
            </DialogTitle>
          </DialogHeader>
          {selectedConversation?.contact && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/20 text-primary text-xl">
                    {selectedConversation.contact.nome?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedConversation.contact.nome}</h3>
                  <p className="text-sm text-muted-foreground">{selectedConversation.contact.whatsapp}</p>
                </div>
              </div>
              
              <div className="grid gap-3 pt-2 border-t">
                {selectedConversation.contact.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{selectedConversation.contact.email}</span>
                  </div>
                )}
                {selectedConversation.contact.matricula && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Matrícula</span>
                    <span className="text-sm font-medium">{selectedConversation.contact.matricula}</span>
                  </div>
                )}
                {selectedConversation.contact.secretaria && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Secretaria</span>
                    <span className="text-sm font-medium">{selectedConversation.contact.secretaria}</span>
                  </div>
                )}
                {selectedConversation.contact.cargo && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cargo</span>
                    <span className="text-sm font-medium">{selectedConversation.contact.cargo}</span>
                  </div>
                )}
                {selectedConversation.contact.tags && selectedConversation.contact.tags.length > 0 && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {selectedConversation.contact.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conversation Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Resumo da Conversa
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {summaryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Gerando resumo...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">{conversationSummary}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inbox;
