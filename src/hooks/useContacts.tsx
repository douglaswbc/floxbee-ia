import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type Contact = Tables<"contacts">;
export type ContactInsert = TablesInsert<"contacts">;
export type ContactUpdate = TablesUpdate<"contacts">;

export const useContacts = () => {
  const queryClient = useQueryClient();

  const {
    data: contacts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as Contact[];
    },
  });

  const createContact = useMutation({
    mutationFn: async (contact: ContactInsert) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert(contact)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contato criado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar contato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: ContactUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contato atualizado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar contato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contato excluído com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir contato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    contacts,
    isLoading,
    error,
    createContact,
    updateContact,
    deleteContact,
  };
};

export const useImportContacts = () => {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);

  const importContacts = async (file: File) => {
    setIsImporting(true);

    try {
      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith(".csv");
      const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
      const isODS = fileName.endsWith(".ods");

      let data: string[][];

      if (isCSV) {
        // Parse CSV
        const text = await file.text();
        const lines = text.split("\n").filter((line) => line.trim());
        data = lines.map(line => {
          // Handle CSV with quotes
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if ((char === ',' || char === ';') && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        });
      } else if (isExcel || isODS) {
        // Parse Excel/ODS using xlsx library
        const XLSX = await import("xlsx");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      } else {
        throw new Error("Formato não suportado. Use CSV, XLSX, XLS ou ODS");
      }

      if (data.length < 2) {
        throw new Error("Arquivo vazio ou sem dados válidos");
      }

      // Get headers
      const headers = data[0].map((h) => String(h || "").trim().toLowerCase());

      // Map columns
      const nameIndex = headers.findIndex((h) =>
        ["nome", "name", "servidor", "funcionario", "funcionário"].includes(h)
      );
      const whatsappIndex = headers.findIndex((h) =>
        ["whatsapp", "telefone", "celular", "phone", "tel", "fone"].includes(h)
      );
      const emailIndex = headers.findIndex((h) => ["email", "e-mail", "e_mail"].includes(h));
      const secretariaIndex = headers.findIndex((h) =>
        ["secretaria", "departamento", "setor", "lotação", "lotacao"].includes(h)
      );
      const matriculaIndex = headers.findIndex((h) =>
        ["matricula", "matrícula", "id", "registro", "código", "codigo"].includes(h)
      );
      const cargoIndex = headers.findIndex((h) =>
        ["cargo", "função", "funcao", "ocupacao", "ocupação"].includes(h)
      );
      const nascimentoIndex = headers.findIndex((h) =>
        ["nascimento", "data_nascimento", "aniversario", "aniversário", "dt_nasc"].includes(h)
      );

      if (nameIndex === -1 || whatsappIndex === -1) {
        throw new Error("Colunas 'nome' e 'whatsapp' são obrigatórias");
      }

      const contacts: ContactInsert[] = [];

      for (let i = 1; i < data.length; i++) {
        const values = data[i].map((v) => String(v || "").trim());

        if (!values[nameIndex] || !values[whatsappIndex]) continue;

        // Format Brazilian phone number
        let whatsapp = values[whatsappIndex].replace(/\D/g, "");
        if (whatsapp.length === 11) {
          whatsapp = `55${whatsapp}`;
        } else if (whatsapp.length === 10) {
          whatsapp = `55${whatsapp.slice(0, 2)}9${whatsapp.slice(2)}`;
        } else if (whatsapp.length === 8 || whatsapp.length === 9) {
          // Missing area code - skip or use default
          continue;
        }

        // Parse birth date if present
        let dataNascimento: string | null = null;
        if (nascimentoIndex !== -1 && values[nascimentoIndex]) {
          const dateValue = values[nascimentoIndex];
          // Try to parse various date formats
          const dateMatch = dateValue.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, "0");
            const month = dateMatch[2].padStart(2, "0");
            let year = dateMatch[3];
            if (year.length === 2) {
              year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
            }
            dataNascimento = `${year}-${month}-${day}`;
          }
        }

        contacts.push({
          nome: values[nameIndex],
          whatsapp,
          email: emailIndex !== -1 ? values[emailIndex] || null : null,
          secretaria: secretariaIndex !== -1 ? values[secretariaIndex] || null : null,
          matricula: matriculaIndex !== -1 ? values[matriculaIndex] || null : null,
          cargo: cargoIndex !== -1 ? values[cargoIndex] || null : null,
          data_nascimento: dataNascimento,
          tags: ["importado"],
        });
      }

      if (contacts.length === 0) {
        throw new Error("Nenhum contato válido encontrado no arquivo");
      }

      // Insert contacts in batches
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        const { error } = await supabase.from("contacts").upsert(batch, {
          onConflict: "whatsapp",
          ignoreDuplicates: false,
        });

        if (error) throw error;
        inserted += batch.length;
      }

      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({
        title: "Importação concluída!",
        description: `${inserted} contatos importados com sucesso.`,
      });

      return { success: true, count: inserted };
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsImporting(false);
    }
  };

  return { importContacts, isImporting };
};

// Hook for validating WhatsApp numbers
export const useValidateWhatsApp = () => {
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);

  const validateNumbers = async (numbers: string[]) => {
    setIsValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke("validate-whatsapp", {
        body: { numbers },
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      toast({
        title: "Erro na validação",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const validateAndUpdateContacts = async (contactIds: string[]) => {
    setIsValidating(true);

    try {
      // Get contacts to validate
      const { data: contacts, error: fetchError } = await supabase
        .from("contacts")
        .select("id, whatsapp")
        .in("id", contactIds);

      if (fetchError) throw fetchError;
      if (!contacts || contacts.length === 0) {
        throw new Error("Nenhum contato encontrado");
      }

      const numbers = contacts.map((c) => c.whatsapp);

      // Validate numbers
      const { data: validationData, error: validationError } = await supabase.functions.invoke(
        "validate-whatsapp",
        { body: { numbers } }
      );

      if (validationError) throw validationError;

      // Update contacts with validation results
      const results = validationData.results;
      let updatedCount = 0;

      for (const result of results) {
        const contact = contacts.find((c) => c.whatsapp === result.formatted || c.whatsapp === result.number);
        if (contact && result.valid) {
          await supabase
            .from("contacts")
            .update({
              whatsapp: result.formatted,
              whatsapp_validated: result.exists === true || result.valid,
            })
            .eq("id", contact.id);
          updatedCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["contacts"] });

      toast({
        title: "Validação concluída!",
        description: `${updatedCount} contatos validados. ${validationData.summary.invalid} inválidos.`,
      });

      return validationData;
    } catch (error: any) {
      toast({
        title: "Erro na validação",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  return { validateNumbers, validateAndUpdateContacts, isValidating };
};
