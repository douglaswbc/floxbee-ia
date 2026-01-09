import React, { useState, useRef } from "react";
import {
  Search,
  Plus,
  Upload,
  MoreHorizontal,
  Phone,
  Mail,
  Building2,
  Tag,
  FileSpreadsheet,
  CheckCircle,
  MessageSquare,
  Trash2,
  Edit,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useContacts, useImportContacts, useValidateWhatsApp, Contact } from "@/hooks/useContacts";
import { ContactForm } from "@/components/contacts/ContactForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Contacts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteConfirmContact, setDeleteConfirmContact] = useState<Contact | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  const { contacts, isLoading, createContact, updateContact, deleteContact } =
    useContacts();
  const { importContacts, isImporting } = useImportContacts();
  const { validateAndUpdateContacts, isValidating } = useValidateWhatsApp();

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.secretaria &&
        contact.secretaria.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.matricula && contact.matricula.includes(searchQuery))
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const result = await importContacts(file);
      if (result.success) {
        setIsImportModalOpen(false);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await importContacts(file);
      if (result.success) {
        setIsImportModalOpen(false);
      }
    }
  };

  const handleCreateContact = (data: any) => {
    createContact.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleUpdateContact = (data: any) => {
    if (editingContact) {
      updateContact.mutate(
        { id: editingContact.id, ...data },
        {
          onSuccess: () => {
            setEditingContact(null);
            setSelectedContact(null);
          },
        }
      );
    }
  };

  const handleDeleteContact = () => {
    if (deleteConfirmContact) {
      deleteContact.mutate(deleteConfirmContact.id, {
        onSuccess: () => {
          setDeleteConfirmContact(null);
          setSelectedContact(null);
        },
      });
    }
  };

  const formatWhatsApp = (whatsapp: string) => {
    const cleaned = whatsapp.replace(/\D/g, "");
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return whatsapp;
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Contatos</h1>
              <p className="text-sm text-muted-foreground">
                {contacts.length} servidores cadastrados
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const unvalidated = contacts.filter(c => !c.whatsapp_validated).map(c => c.id);
                  if (unvalidated.length > 0) {
                    validateAndUpdateContacts(unvalidated.slice(0, 100)); // Limit to 100 at a time
                  }
                }}
                disabled={isValidating}
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Validar WhatsApp
              </Button>
              <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Importar Planilha
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Importar Contatos</DialogTitle>
                    <DialogDescription>
                      Arraste um arquivo CSV, Excel ou LibreOffice (.ods)
                    </DialogDescription>
                  </DialogHeader>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      isDragging ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    {isImporting ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Importando contatos...
                        </p>
                      </div>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Arraste seu arquivo aqui ou
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls,.ods"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Selecionar Arquivo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4">
                          Formatos aceitos: .csv, .xlsx, .xls, .ods
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Colunas: nome, whatsapp, email, secretaria, matricula, cargo
                        </p>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button className="gap-2" onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4" />
                Novo Contato
              </Button>
            </div>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, secretaria ou matrícula..."
              className="pl-10 bg-secondary border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-card rounded-lg border border-border shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-1">
                  Nenhum contato encontrado
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery
                    ? "Tente uma busca diferente"
                    : "Comece adicionando seu primeiro contato"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Contato
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[250px]">Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Secretaria</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                              {contact.nome
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {contact.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {contact.email || "Sem email"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {formatWhatsApp(contact.whatsapp)}
                          </span>
                          {contact.whatsapp_validated ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <span className="text-xs text-amber-500">
                              Não validado
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {contact.secretaria || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {contact.matricula || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {contact.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingContact(contact);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmContact(contact);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Contact Detail Sheet */}
      <Sheet open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {selectedContact && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary/20 text-primary text-xl">
                      {selectedContact.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl">
                      {selectedContact.nome}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {selectedContact.secretaria || "Sem secretaria"}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Separator className="my-4" />

              {/* Quick Actions */}
              <div className="flex gap-2 mb-6">
                <Button variant="outline" className="flex-1 gap-2">
                  <Phone className="w-4 h-4" />
                  Ligar
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Mensagem
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Informações de Contato
                  </h4>
                  <div className="space-y-3 bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">WhatsApp</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatWhatsApp(selectedContact.whatsapp)}
                        </span>
                        {selectedContact.whatsapp_validated && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="text-sm font-medium">
                        {selectedContact.email || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Matrícula</span>
                      <span className="text-sm font-medium">
                        {selectedContact.matricula || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cargo</span>
                      <span className="text-sm font-medium">
                        {selectedContact.cargo || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Estatísticas
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {selectedContact.messages_sent_count || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Mensagens</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {selectedContact.last_message_at
                          ? format(
                              new Date(selectedContact.last_message_at),
                              "dd/MM",
                              { locale: ptBR }
                            )
                          : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">Último Contato</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditingContact(selectedContact)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setDeleteConfirmContact(selectedContact)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create/Edit Form */}
      <ContactForm
        open={isFormOpen || !!editingContact}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingContact(null);
          }
        }}
        contact={editingContact}
        onSubmit={editingContact ? handleUpdateContact : handleCreateContact}
        isLoading={createContact.isPending || updateContact.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmContact}
        onOpenChange={() => setDeleteConfirmContact(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contato{" "}
              <strong>{deleteConfirmContact?.nome}</strong> será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteContact.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contacts;
