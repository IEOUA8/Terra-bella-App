import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const Field = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-gray-300">{label}</Label>
    {children}
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
);

const AuthPage = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [formData, setFormData] = useState({
    loginEmail: '',
    loginPassword: '',
    forgotPasswordEmail: '',
    registerName: '',
    registerTower: '',
    registerApt: '',
    registerEmail: '',
    registerPassword: '',
    registerPhone: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name) => (value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await signIn(formData.loginEmail, formData.loginPassword);
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.registerTower || !formData.registerApt) {
      toast({ title: 'Información requerida', description: 'Selecciona tu Torre y Apartamento.', variant: 'destructive' });
      return;
    }
    if (formData.registerPassword.length < 8) {
      toast({ title: 'Contraseña muy corta', description: 'Debe tener al menos 8 caracteres.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    await signUp(formData.registerEmail, formData.registerPassword, {
      name: formData.registerName,
      tower: formData.registerTower,
      apartment: formData.registerApt,
      phone: formData.registerPhone,
    });
    setLoading(false);
  };

  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    if (!formData.forgotPasswordEmail) return;
    setLoading(true);
    await resetPassword(formData.forgotPasswordEmail);
    setLoading(false);
    setIsForgotPassword(false);
  };

  const inputClass = 'bg-[#0C1412] border-surface-border text-white placeholder:text-gray-600 focus:border-brand-600 h-11 text-base';
  const primaryBtn = 'w-full h-11 text-base font-semibold bg-brand-600 hover:bg-brand-700 text-white';

  return (
    <>
      <Helmet>
        <title>Bienvenido a Terra Bella</title>
        <meta name="description" content="Inicia sesión o regístrate para gestionar las áreas sociales de Terra Bella." />
      </Helmet>

      <div className="flex items-center justify-center min-h-screen p-4 bg-[#0C1412]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-900/60 border border-brand-700/40 mb-4">
              <Building2 className="h-8 w-8 text-brand-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Terra <span className="text-brand-400">Bella</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Reserva tus áreas comunes fácilmente</p>
          </div>

          {/* Card */}
          <div className="terra-card p-6 shadow-xl shadow-black/40">
            {isForgotPassword ? (
              <div>
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-300 mb-5 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
                </button>
                <h2 className="text-xl font-semibold text-white mb-1">Recuperar contraseña</h2>
                <p className="text-sm text-gray-400 mb-5">
                  Te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <form onSubmit={handlePasswordRecovery} className="space-y-4">
                  <Field label="Correo electrónico">
                    <Input
                      name="forgotPasswordEmail"
                      type="email"
                      placeholder="tu@correo.com"
                      value={formData.forgotPasswordEmail}
                      onChange={handleInputChange}
                      className={inputClass}
                      required
                      autoComplete="email"
                    />
                  </Field>
                  <Button type="submit" className={primaryBtn} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar enlace
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#0C1412] border border-surface-border mb-6 p-0.5">
                  <TabsTrigger
                    value="login"
                    className="rounded-lg text-sm font-medium data-[state=active]:bg-brand-700 data-[state=active]:text-white text-gray-400"
                  >
                    Iniciar sesión
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="rounded-lg text-sm font-medium data-[state=active]:bg-brand-700 data-[state=active]:text-white text-gray-400"
                  >
                    Registrarse
                  </TabsTrigger>
                </TabsList>

                {/* LOGIN */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Field label="Correo electrónico">
                      <Input
                        id="login-email"
                        name="loginEmail"
                        type="email"
                        placeholder="tu@correo.com"
                        value={formData.loginEmail}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                        autoComplete="email"
                      />
                    </Field>
                    <Field label="Contraseña">
                      <PasswordInput
                        id="login-password"
                        name="loginPassword"
                        placeholder="••••••••"
                        value={formData.loginPassword}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                        autoComplete="current-password"
                      />
                    </Field>
                    <Button type="submit" className={primaryBtn} disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Iniciar sesión
                    </Button>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="w-full text-sm text-center text-gray-500 hover:text-brand-300 transition-colors pt-1"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </form>
                </TabsContent>

                {/* REGISTER */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <Field label="Nombre completo">
                      <Input
                        id="register-name"
                        name="registerName"
                        placeholder="Nombre Apellido"
                        value={formData.registerName}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                        autoComplete="name"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Torre">
                        <Select value={formData.registerTower} onValueChange={handleSelectChange('registerTower')}>
                          <SelectTrigger className={`${inputClass} w-full`}>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-card border-surface-border text-white">
                            <SelectItem value="1">Torre 1</SelectItem>
                            <SelectItem value="2">Torre 2</SelectItem>
                            <SelectItem value="3">Torre 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Apartamento">
                        <Input
                          id="register-apt"
                          name="registerApt"
                          placeholder="Ej: 101"
                          value={formData.registerApt}
                          onChange={handleInputChange}
                          className={inputClass}
                          required
                        />
                      </Field>
                    </div>

                    <Field label="Correo electrónico">
                      <Input
                        id="register-email"
                        name="registerEmail"
                        type="email"
                        placeholder="tu@correo.com"
                        value={formData.registerEmail}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                        autoComplete="email"
                      />
                    </Field>

                    <Field label="Teléfono">
                      <Input
                        id="register-phone"
                        name="registerPhone"
                        type="tel"
                        placeholder="Ej: 300 123 4567"
                        value={formData.registerPhone}
                        onChange={handleInputChange}
                        className={inputClass}
                        autoComplete="tel"
                      />
                    </Field>

                    <Field label="Contraseña" hint="Mínimo 8 caracteres">
                      <PasswordInput
                        id="register-password"
                        name="registerPassword"
                        placeholder="••••••••"
                        value={formData.registerPassword}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                        minLength="8"
                        autoComplete="new-password"
                      />
                    </Field>

                    <Button type="submit" className={primaryBtn} disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Crear cuenta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AuthPage;
