"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { X, Star, TrendingUp } from "lucide-react";

export function ClientDetailPanel({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/clients/${clientId}/history`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [clientId]);

  const tierColors: Record<string, string> = {
    Bronce: "bg-amber-700/20 text-amber-600 border-amber-700/30",
    Plata: "bg-slate-400/20 text-slate-300 border-slate-400/30",
    Oro: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-lg h-full bg-[#16191d] border-l border-slate-800 p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tier = data.loyaltyTier || "Bronce";
  const nextReward = 5 - (data.visitCount % 5);
  const progress = (data.visitCount % 5) / 5 * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#16191d] border-l border-slate-800 overflow-y-auto animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#16191d]/95 backdrop-blur-xl border-b border-slate-800/50 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white">{data.firstName} {data.lastName}</h2>
            <p className="text-sm text-slate-500 font-mono">@{data.username || "invitado"}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="pt-4 pb-4 text-center">
                <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500 font-bold uppercase">Total Gastado</p>
                <p className="text-2xl font-extrabold text-green-400">${data.totalSpent?.toFixed(0) || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="pt-4 pb-4 text-center">
                <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500 font-bold uppercase">Visitas</p>
                <p className="text-2xl font-extrabold text-amber-400">{data.totalVisits}</p>
              </CardContent>
            </Card>
          </div>

          {/* Loyalty Tier */}
          <Card className="bg-[#1a1d22] border-slate-800/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 font-bold uppercase">Programa de Lealtad</span>
                <Badge className={tierColors[tier] || tierColors.Bronce}>⭐ {tier}</Badge>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <p className="text-xs text-slate-500">
                {nextReward === 5 ? "¡Necesita 5 visitas más!" : `${nextReward} visitas para su próximo descuento`}
              </p>
            </CardContent>
          </Card>

          {/* Appointments History */}
          <Card className="bg-[#1a1d22] border-slate-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Historial de Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800/50 hover:bg-transparent">
                    <TableHead className="text-xs text-slate-500">Fecha</TableHead>
                    <TableHead className="text-xs text-slate-500">Servicio</TableHead>
                    <TableHead className="text-xs text-slate-500 text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.appointments?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-600 py-8">Sin historial</TableCell>
                    </TableRow>
                  ) : (
                    data.appointments?.map((appt: any) => (
                      <TableRow key={appt.id} className="border-slate-800/30 hover:bg-slate-800/10">
                        <TableCell className="text-sm text-slate-400">
                          {format(new Date(appt.startTime), "dd/MM/yy")}
                        </TableCell>
                        <TableCell className="text-sm text-slate-300">{appt.serviceName || "Corte"}</TableCell>
                        <TableCell className="text-sm text-right font-mono text-green-400">
                          ${Number(appt.price || 0).toFixed(0)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
