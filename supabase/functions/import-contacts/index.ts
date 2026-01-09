import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportRequest {
  data: Array<Record<string, string>>;
  column_mapping: {
    nome: string;
    whatsapp: string;
    matricula?: string;
    secretaria?: string;
    email?: string;
    cargo?: string;
    [key: string]: string | undefined;
  };
  validate_whatsapp?: boolean;
  skip_duplicates?: boolean;
}

// Format Brazilian phone number
function formatBrazilianNumber(number: string): string {
  let cleaned = number.replace(/\D/g, "");
  cleaned = cleaned.replace(/^0+/, "");
  
  if (!cleaned.startsWith("55")) {
    cleaned = "55" + cleaned;
  }
  
  if (cleaned.length === 12) {
    const firstDigit = cleaned.charAt(4);
    if (["6", "7", "8", "9"].includes(firstDigit)) {
      cleaned = cleaned.substring(0, 4) + "9" + cleaned.substring(4);
    }
  }
  
  return cleaned;
}

// Validate required fields
function validateContact(contact: Record<string, string>, mapping: ImportRequest["column_mapping"]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const nome = contact[mapping.nome];
  if (!nome || nome.trim().length === 0) {
    errors.push("Nome é obrigatório");
  }
  
  const whatsapp = contact[mapping.whatsapp];
  if (!whatsapp || whatsapp.trim().length === 0) {
    errors.push("WhatsApp é obrigatório");
  } else {
    const cleaned = whatsapp.replace(/\D/g, "");
    if (cleaned.length < 10) {
      errors.push("Número de WhatsApp inválido");
    }
  }
  
  return { valid: errors.length === 0, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      data, 
      column_mapping, 
      validate_whatsapp = false,
      skip_duplicates = true 
    }: ImportRequest = await req.json();

    if (!data || !Array.isArray(data)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: 'data' array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!column_mapping || !column_mapping.nome || !column_mapping.whatsapp) {
      return new Response(
        JSON.stringify({ error: "Invalid request: column_mapping with 'nome' and 'whatsapp' is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Import request:", { 
      rowCount: data.length, 
      mapping: column_mapping,
      validate: validate_whatsapp,
      skipDuplicates: skip_duplicates
    });

    const processed: Array<{
      row: number;
      original: Record<string, string>;
      mapped: Record<string, string>;
      valid: boolean;
      errors: string[];
      whatsapp_formatted: string;
    }> = [];

    const seenWhatsApp = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Map columns
      const mapped: Record<string, string> = {
        nome: row[column_mapping.nome] || "",
        whatsapp: row[column_mapping.whatsapp] || "",
        matricula: column_mapping.matricula ? row[column_mapping.matricula] || "" : "",
        secretaria: column_mapping.secretaria ? row[column_mapping.secretaria] || "" : "",
        email: column_mapping.email ? row[column_mapping.email] || "" : "",
        cargo: column_mapping.cargo ? row[column_mapping.cargo] || "" : "",
      };

      // Validate
      const validation = validateContact(row, column_mapping);
      
      // Format WhatsApp
      const whatsapp_formatted = mapped.whatsapp ? formatBrazilianNumber(mapped.whatsapp) : "";
      
      // Check duplicates
      if (skip_duplicates && whatsapp_formatted) {
        if (seenWhatsApp.has(whatsapp_formatted)) {
          validation.valid = false;
          validation.errors.push("Número duplicado na planilha");
        } else {
          seenWhatsApp.add(whatsapp_formatted);
        }
      }

      processed.push({
        row: i + 1,
        original: row,
        mapped,
        valid: validation.valid,
        errors: validation.errors,
        whatsapp_formatted,
      });
    }

    const valid = processed.filter(p => p.valid);
    const invalid = processed.filter(p => !p.valid);

    // Prepare contacts for database
    const contactsToInsert = valid.map(p => ({
      nome: p.mapped.nome.trim(),
      whatsapp: p.whatsapp_formatted,
      matricula: p.mapped.matricula?.trim() || null,
      secretaria: p.mapped.secretaria?.trim() || null,
      email: p.mapped.email?.trim() || null,
      cargo: p.mapped.cargo?.trim() || null,
    }));

    // TODO: When database is ready, insert contacts
    // For now, return what would be inserted
    console.log("Import processed:", { 
      total: data.length, 
      valid: valid.length, 
      invalid: invalid.length 
    });

    // Validate WhatsApp numbers if requested
    let validationResults = null;
    if (validate_whatsapp && valid.length > 0) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        
        const response = await fetch(`${supabaseUrl}/functions/v1/validate-whatsapp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            numbers: valid.map(p => p.whatsapp_formatted),
          }),
        });
        
        if (response.ok) {
          validationResults = await response.json();
        }
      } catch (error) {
        console.error("WhatsApp validation error:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: data.length,
          valid: valid.length,
          invalid: invalid.length,
          ready_to_insert: contactsToInsert.length,
        },
        contacts_preview: contactsToInsert.slice(0, 10), // Preview first 10
        invalid_rows: invalid.map(p => ({
          row: p.row,
          errors: p.errors,
          data: p.original,
        })),
        whatsapp_validation: validationResults,
        message: "Prévia da importação. Banco de dados não configurado para inserção.",
        mock: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
