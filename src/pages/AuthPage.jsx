import React, { useState, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Input, PasswordInput } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Loader2 } from 'lucide-react';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useToast } from '@/components/ui/use-toast';

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
        registerPhone: ''
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
          toast({
            title: "Información Requerida",
            description: "Por favor, selecciona tu Torre y Apartamento para registrarte.",
            variant: "destructive"
          });
          return;
        }

        if (formData.registerPassword.length < 8) {
          toast({
            title: "Contraseña Débil",
            description: "La contraseña debe tener al menos 8 caracteres.",
            variant: "destructive",
          });
          return;
        }
        
        setLoading(true);

        await signUp(
          formData.registerEmail,
          formData.registerPassword,
          {
            name: formData.registerName,
            tower: formData.registerTower,
            apartment: formData.registerApt,
            phone: formData.registerPhone
          }
        );
        
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
      
      const tabsComponent = useMemo(() => (
        <Tabs defaultValue="login" className="w-[400px]">
          <div className="text-center mb-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Terra Bella
            </h1>
          </div>
          {!isForgotPassword && (
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
              <TabsTrigger value="login" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">Registrarse</TabsTrigger>
            </TabsList>
          )}

          {isForgotPassword ? (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
                <CardDescription className="text-gray-300">
                  Ingresa tu correo para enviarte un enlace de recuperación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordRecovery} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Correo Electrónico</Label>
                    <Input id="forgot-email" name="forgotPasswordEmail" type="email" placeholder="tu@email.com" value={formData.forgotPasswordEmail} onChange={handleInputChange} className="bg-white/20 border-white/30 placeholder-gray-400" required autoComplete="email" />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Correo
                  </Button>
                  <Button variant="link" className="w-full text-gray-300" onClick={() => setIsForgotPassword(false)}>
                    Volver a Iniciar Sesión
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="login">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="text-2xl">Bienvenido de vuelta</CardTitle>
                    <CardDescription className="text-gray-300">
                      Ingresa tus credenciales para acceder a tu panel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Correo Electrónico</Label>
                        <Input id="login-email" name="loginEmail" type="email" placeholder="tu@email.com" value={formData.loginEmail} onChange={handleInputChange} className="bg-white/20 border-white/30 placeholder-gray-400" required autoComplete="email" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Contraseña</Label>
                        <PasswordInput id="login-password" name="loginPassword" placeholder="••••••••" value={formData.loginPassword} onChange={handleInputChange} className="bg-white/20 border-white/30 placeholder-gray-400" required autoComplete="current-password" />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Iniciar Sesión
                      </Button>
                      <Button variant="link" className="w-full text-gray-300" onClick={() => setIsForgotPassword(true)}>
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="register">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="text-2xl">Crear una cuenta</CardTitle>
                    <CardDescription className="text-gray-300">Regístrate para empezar a reservar áreas sociales.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Nombre Completo</Label>
                        <Input id="register-name" name="registerName" placeholder="Tu Nombre Apellido" value={formData.registerName} onChange={handleInputChange} className="bg-white/20 border-white/30 placeholder-gray-400" required autoComplete="name" />
                      </div>
                      <div className="flex space-x-4">
                        <div className="space-y-2 flex-1">
                          <Label htmlFor="register-tower">Torre</Label>
                          <Select value={formData.registerTower} onValueChange={handleSelectChange('registerTower')} name="tower">
                            <SelectTrigger id="register-tower" className="w-full bg-white/20 border-white/30 text-white">
                              <SelectValue placeholder="Selecciona tu torre" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 text-white border-slate-700">
                              <SelectItem value="1">Torre 1</SelectItem>
                              <SelectItem value="2">Torre 2</SelectItem>
                              <SelectItem value="3">Torre 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 flex-1">
                          <Label htmlFor="register-apt">Apartamento</Label>
                          <Input id="register-apt" name="registerApt" placeholder="Ej: 101" value={formData.registerApt} onChange={handleInputChange} className="bg-white/20 border-white/30 placeholder-gray-400" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Correo Electrónico</Label>
                        <Input id="register-email" name="registerEmail" type="email" placeholder="tu@email.com" value={formData.registerEmail} onChange={handleInputChange} className="bg-white/20 border-white/30 placeholder-gray-400" required autoComplete="email" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-phone">Teléfono</Label>
                        <Input id="register-phone" name="registerPhone" type="tel" placeholder="Tu número de teléfono" value={formData.registerPhone} onChange={handleInputChange} className="bg-white/20 border-white/30 placeholder-gray-400" required autoComplete="tel" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Contraseña</Label>
                        <PasswordInput id="register-password" name="registerPassword" placeholder="••••••••" value={formData.registerPassword} onChange={handleInputChange} className="bg-white/20 border-white/30 placeholder-gray-400" required minLength="8" autoComplete="new-password" />
                        <p className="text-xs text-gray-400">Debe tener al menos 8 caracteres.</p>
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrarse
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ), [formData, isForgotPassword, loading]);
      
      return (
        <>
          <Helmet>
            <title>Bienvenido a Terra Bella</title>
            <meta name="description" content="Inicia sesión o regístrate para gestionar las áreas sociales de Terra Bella." />
          </Helmet>
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
            >
              {tabsComponent}
            </motion.div>
          </div>
        </>
      );
    };

    export default AuthPage;