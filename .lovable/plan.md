

## Plano: Configurar Cliente Supabase no Projeto

### O que será feito

Criar a integração do Supabase no projeto com o cliente configurado e os tipos TypeScript básicos.

### Arquivos a criar/modificar

1. **`src/integrations/supabase/client.ts`** — Cliente Supabase usando `@supabase/supabase-js` com a URL e chave pública fornecidas (hardcoded, pois são chaves públicas/publishable)

2. **`src/integrations/supabase/types.ts`** — Arquivo de tipos básico (placeholder para futura geração de tipos do banco)

3. **Instalar dependência** — `@supabase/supabase-js`

### Credenciais

- **URL**: `https://texsqmmoevyfvittqmxm.supabase.co`
- **Anon Key**: `sb_publishable_gUaVeG-CiZYA7Lw2xH1QIA_fI98SjeM`

Como são chaves públicas (publishable), é seguro armazená-las diretamente no código.

### Detalhes técnicos

- O cliente será exportado como instância singleton
- Usará `createClient` do `@supabase/supabase-js`
- Pronto para uso em qualquer componente ou hook do projeto

