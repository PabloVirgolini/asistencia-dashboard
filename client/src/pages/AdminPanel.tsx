import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

import { TabPersonal } from './AdminTabs/TabPersonal';
import { TabSectores } from './AdminTabs/TabSectores';
import { TabCargos } from './AdminTabs/TabCargos';
import AdminTurnos from '@/components/AdminTurnos';
import { AdminNovedades } from '@/components/novedades/AdminNovedades';
import { PlanificadorTurnos } from '@/components/planificador/PlanificadorTurnos';

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const trpcContext = trpc.useContext();
  
  const { data: user, isLoading: isUserLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (!isUserLoading && !user) {
      toast.error('Acceso denegado. Por favor, inicia sesión.');
      navigate('/login');
    }
  }, [user, isUserLoading, navigate]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    await trpcContext.auth.me.invalidate();
    navigate('/login');
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-sm text-gray-500">Administrador: {user.name}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              Ver Dashboard
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full max-w-5xl grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="sectores">Sectores</TabsTrigger>
            <TabsTrigger value="cargos">Cargos</TabsTrigger>
            <TabsTrigger value="turnos">Reglas de Turnos</TabsTrigger>
            <TabsTrigger value="novedades">Licencias</TabsTrigger>
            <TabsTrigger value="planificador">Planificador Semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            <TabPersonal />
          </TabsContent>

          <TabsContent value="sectores" className="mt-6">
            <TabSectores />
          </TabsContent>

          <TabsContent value="cargos" className="mt-6">
            <TabCargos />
          </TabsContent>

          <TabsContent value="turnos" className="mt-6">
            <AdminTurnos />
          </TabsContent>

          <TabsContent value="novedades" className="mt-6">
            <AdminNovedades />
          </TabsContent>

          <TabsContent value="planificador" className="mt-6">
            <PlanificadorTurnos />
          </TabsContent>
        </Tabs>
        
        <div className="pt-8 pb-4 text-center text-xs text-slate-400 font-mono">
          v0.2
        </div>
      </div>
    </div>
  );
}
