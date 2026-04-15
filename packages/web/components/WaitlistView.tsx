"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ListOrdered, User } from "lucide-react";

export function WaitlistView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/waitlist`);
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  return (
    <Card className="bg-[#16191d] border-slate-800/50 shadow-2xl min-h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/20 pb-6">
        <div>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <ListOrdered className="w-6 h-6 text-purple-400" /> Lista de Espera
          </CardTitle>
          <CardDescription className="text-slate-500">Clientes que esperan un horario disponible</CardDescription>
        </div>
        {loading && <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
            <TableRow className="border-slate-800/50 hover:bg-transparent">
              <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Cliente</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Fecha Solicitada</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Registrado</TableHead>
              <TableHead className="text-right text-slate-400 font-bold uppercase tracking-wider text-xs">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                    <ListOrdered className="w-12 h-12" />
                    <p>No hay clientes en lista de espera</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id} className="border-slate-800/30 hover:bg-slate-800/20 transition-all">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{entry.user?.firstName} {entry.user?.lastName}</p>
                        <p className="text-xs text-slate-500 font-mono">@{entry.user?.username || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-300">
                    {format(new Date(entry.date), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(entry.createdAt), "dd/MM HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={entry.notified ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-purple-500/20 text-purple-400 border-purple-500/30"}>
                      {entry.notified ? "Notificado" : "En espera"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
  );
}
