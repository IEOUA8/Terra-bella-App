import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link.
  // We wait for this event before showing the form so the session is active.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also handle the case where the page loads with an active recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ variant: 'destructive', title: 'Contraseña muy corta', description: 'Debe tener al menos 8 caracteres.' });
      return;
    }
    if (password !== confirm) {
      toast({ variant: 'destructive', title: 'Las contraseñas no coinciden', description: 'Verifica que ambas contraseñas sean iguales.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error al actualizar', description: error.message });
    } else {
      toast({ title: 'Contraseña actualizada', description: 'Ahora puedes iniciar sesión con tu nueva contraseña.' });
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <Helmet>
        <title>Nueva Contraseña - Terra Bella</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-indigo-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Terra Bella
            </h1>
          </div>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <KeyRound className="h-6 w-6 text-brand-400" />
                Nueva Contraseña
              </CardTitle>
              <CardDescription className="text-gray-300">
                Elige una contraseña segura de al menos 8 caracteres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!ready ? (
                <div className="flex items-center justify-center py-8 gap-3 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verificando enlace...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nueva contraseña</Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="bg-white/20 border-white/30 placeholder-gray-400"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmar contraseña</Label>
                    <PasswordInput
                      id="confirm"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="bg-white/20 border-white/30 placeholder-gray-400"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Nueva Contraseña
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
