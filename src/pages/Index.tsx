import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setStatus('error');
          setErrorMsg(error.message);
        } else {
          setStatus('connected');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Erro desconhecido');
      }
    };
    testConnection();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 rounded-xl border bg-card shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold text-foreground">Teste de Conexão Supabase</h1>
        {status === 'loading' && (
          <p className="text-muted-foreground animate-pulse">Testando conexão...</p>
        )}
        {status === 'connected' && (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-500 text-2xl">✓</span>
            </div>
            <p className="text-green-600 font-medium">Conectado com sucesso!</p>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-500 text-2xl">✗</span>
            </div>
            <p className="text-red-600 font-medium">Erro na conexão</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
