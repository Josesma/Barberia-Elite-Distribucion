"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, Plus, ShieldBan } from "lucide-react";

export function BlockedSlotsView() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: format(new Date(), "yyyy-MM-dd"), startTime: "09:00", endTime: "10:00", reason: "" });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/blocked-slots`);
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleCreate = async () => {
    try {
      await fetch(`${apiUrl}/api/blocked-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ date: format(new Date(), "yyyy-MM-dd"), startTime: "09:00", endTime: "10:00", reason: "" });
      fetchSlots();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este bloqueo?")) return;
    try {
      await fetch(`${apiUrl}/api/blocked-slots/${id}`, { method: "DELETE" });
      fetchSlots();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#16191d] border-slate-800/50 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/20 pb-6">
          <div>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <ShieldBan className="w-6 h-6 text-red-400" /> Bloqueo de Horarios
            </CardTitle>
            <CardDescription className="text-slate-500">Bloquea horarios para que no aparezcan en el Bot de Telegram</CardDescription>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg font-bold transition-all"
          >
            <Plus className="w-4 h-4" /> Bloquear Horario
          </button>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Form */}
          {showForm && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Hora Inicio</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Hora Fin</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Almuerzo, descanso..."
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg font-bold hover:bg-slate-700">Cancelar</button>
                <button onClick={handleCreate} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500 flex items-center gap-2">
                  <ShieldBan className="w-4 h-4" /> Bloquear
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
              <TableRow className="border-slate-800/50 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Fecha</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Horario</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Motivo</TableHead>
                <TableHead className="text-right text-slate-400 font-bold uppercase tracking-wider text-xs">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                      <Clock className="w-12 h-12" />
                      <p>No hay horarios bloqueados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                slots.map((slot) => (
                  <TableRow key={slot.id} className="border-slate-800/30 hover:bg-slate-800/20 transition-all">
                    <TableCell className="font-medium text-slate-300">
                      {format(new Date(slot.date), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-mono">
                        {slot.startTime} - {slot.endTime}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">{slot.reason || "—"}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleDelete(slot.id)}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                        title="Eliminar bloqueo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
