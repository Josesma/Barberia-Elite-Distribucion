// packages/web/components/FinancesView.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Download, Plus, Trash2 } from "lucide-react";

export function FinancesView() {
  const [reportData, setReportData] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Service Form
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  // New Expense Form
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpensePaymentMethod, setNewExpensePaymentMethod] = useState("Efectivo");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportRes, servRes, expRes] = await Promise.all([
        fetch(`${apiUrl}/api/finances/report?period=month`),
        fetch(`${apiUrl}/api/services`),
        fetch(`${apiUrl}/api/expenses`),
      ]);
      setReportData(await reportRes.json());
      setServices(await servRes.json());
      setExpenses(await expRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddService = async (e: any) => {
    e.preventDefault();
    await fetch(`${apiUrl}/api/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newServiceName, price: Number(newServicePrice) })
    });
    setNewServiceName("");
    setNewServicePrice("");
    fetchData();
  };

  const handleDeleteService = async (id: string) => {
    await fetch(`${apiUrl}/api/services/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleAddExpense = async (e: any) => {
    e.preventDefault();
    await fetch(`${apiUrl}/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        description: newExpenseDesc, 
        amount: Number(newExpenseAmount),
        paymentMethod: newExpensePaymentMethod
      })
    });
    setNewExpenseDesc("");
    setNewExpenseAmount("");
    setNewExpensePaymentMethod("Efectivo");
    fetchData();
  };

  const handleDeleteExpense = async (id: string) => {
    await fetch(`${apiUrl}/api/expenses/${id}`, { method: "DELETE" });
    fetchData();
  };

  const downloadCSV = () => {
    if (!reportData) return;
    const csvContent = `data:text/csv;charset=utf-8,PERIODO,INGRESOS_TOTAL,INGRESOS_EFECTIVO,INGRESOS_TARJETA,GASTOS_TOTAL,GASTOS_EFECTIVO,GASTOS_TARJETA,GANANCIA_NETA\nMensual,${reportData.income},${reportData.incomeCash},${reportData.incomeCard},${reportData.expenseTotal},${reportData.expenseCash},${reportData.expenseCard},${reportData.profit}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_financiero_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!reportData) return <div className="text-center text-amber-500 py-10">Cargando datos financieros...</div>;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-bold text-white flex items-center gap-3">
             <DollarSign className="w-8 h-8 text-amber-500" /> Finanzas del Mes
           </h2>
           <p className="text-slate-400">Control de ingresos, gastos y configuración de precios.</p>
        </div>
        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold transition-colors border border-slate-700 hover:border-slate-500"
        >
          <Download className="w-4 h-4" /> Exportar Reporte
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#16191d] border-green-500/20 shadow-lg shadow-green-500/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><TrendingUp /></div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ingresos Totales (Citas)</p>
            <div className="text-4xl font-extrabold text-white mt-2">${reportData.income?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#16191d] border-red-500/20 shadow-lg shadow-red-500/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><TrendingDown /></div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gastos Operativos</p>
            <div className="text-4xl font-extrabold text-white mt-2">${reportData.expenseTotal?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Wallet /></div>
            </div>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Ganancia Neta</p>
            <div className="text-4xl font-extrabold text-amber-500 mt-2">${reportData.profit?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Services Manager */}
        <Card className="bg-[#16191d] border-slate-800/50">
          <CardHeader className="border-b border-slate-800/20 pb-4">
            <CardTitle className="text-xl text-white">Catálogo de Servicios</CardTitle>
            <CardDescription className="text-slate-500">Configura los precios para las citas del bot.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddService} className="flex flex-col md:flex-row gap-4 mb-6">
              <input 
                required
                type="text" 
                placeholder="Nombre (ej. Corte de Cabello)" 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 text-white placeholder:text-slate-500"
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
              />
              <input 
                required
                type="number" 
                placeholder="Precio $" 
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 text-white placeholder:text-slate-500"
                value={newServicePrice}
                onChange={e => setNewServicePrice(e.target.value)}
              />
              <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 rounded-lg font-bold flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/50">
                  <TableHead className="text-slate-400">Servicio</TableHead>
                  <TableHead className="text-right text-slate-400">Precio</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map(s => (
                  <TableRow key={s.id} className="border-slate-800/30">
                    <TableCell className="text-slate-200 font-bold">{s.name}</TableCell>
                    <TableCell className="text-right text-amber-500 font-mono">${s.price}</TableCell>
                    <TableCell>
                      <button onClick={() => handleDeleteService(s.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-slate-500 py-4">Sin servicios definidos</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expenses Manager */}
        <Card className="bg-[#16191d] border-slate-800/50">
          <CardHeader className="border-b border-slate-800/20 pb-4">
            <CardTitle className="text-xl text-white">Registro de Gastos</CardTitle>
            <CardDescription className="text-slate-500">Registra compras de materiales, rentas, etc.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddExpense} className="flex flex-col md:flex-row gap-4 mb-6">
              <input 
                required
                type="text" 
                placeholder="Descripción (ej. Luz)" 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 text-white placeholder:text-slate-500"
                value={newExpenseDesc}
                onChange={e => setNewExpenseDesc(e.target.value)}
              />
              <input 
                required
                type="number" 
                placeholder="Monto $" 
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 text-white placeholder:text-slate-500"
                value={newExpenseAmount}
                onChange={e => setNewExpenseAmount(e.target.value)}
              />
              <select 
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 text-white"
                value={newExpensePaymentMethod}
                onChange={e => setNewExpensePaymentMethod(e.target.value)}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
              <button type="submit" className="bg-red-500 hover:bg-red-400 text-white px-4 rounded-lg font-bold flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/50">
                  <TableHead className="text-slate-400">Gasto</TableHead>
                  <TableHead className="text-slate-400">Método</TableHead>
                  <TableHead className="text-right text-slate-400">Monto</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(exp => (
                  <TableRow key={exp.id} className="border-slate-800/30">
                    <TableCell className="text-slate-200 font-bold">{exp.description}</TableCell>
                    <TableCell className="text-slate-500 text-xs uppercase">{exp.paymentMethod || 'Efectivo'}</TableCell>
                    <TableCell className="text-right text-red-500 font-mono">-${exp.amount}</TableCell>
                    <TableCell>
                      <button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {expenses.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-slate-500 py-4">No hay gastos registrados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
