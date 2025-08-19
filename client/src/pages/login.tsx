import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ChartLine, Eye, EyeOff } from 'lucide-react';
import { useLocation } from 'wouter';
import PageTransition from '@/components/page-transition';

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión exitosamente',
      });
      setLocation('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al iniciar sesión',
        variant: 'destructive',
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary rounded-lg p-3">
                <ChartLine className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">FinPyME Pro</h1>
            <p className="text-muted-foreground">
              Gestión financiera inteligente para PyMEs
            </p>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
              <CardDescription className="text-center">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ejemplo@empresa.com"
                            type="email"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="••••••••"
                              type={showPassword ? 'text' : 'password'}
                              data-testid="input-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loginForm.formState.isSubmitting}
                    data-testid="button-login"
                  >
                    {loginForm.formState.isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 pt-6 border-t">
                <div className="text-center text-sm text-muted-foreground">
                  <p>¿Necesitas acceso al sistema?</p>
                  <p>Contacta al administrador de tu empresa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-muted-foreground">
            <p>© 2025 FinPyME Pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
