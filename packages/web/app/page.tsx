"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, CheckCircle2, Clock, Scissors, LayoutDashboard, XCircle, DollarSign, ShieldBan, ListOrdered, Bell } from "lucide-react";
import { FinancesView } from "@/components/FinancesView";
import { BlockedSlotsView } from "@/components/BlockedSlotsView";
import { WaitlistView } from "@/components/WaitlistView";
import { ClientDetailPanel } from "@/components/ClientDetailPanel";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'clients' | 'finances' | 'blocked' | 'waitlist'>('dashboard');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ todayCount: 0, pendingCount: 0, finishedCount: 0, clientCount: 0 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  // Checkout Modal State
  const [checkoutAppt, setCheckoutAppt] = useState<any | null>(null);
  const [finalPrice, setFinalPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setDate(new Date());
    fetchStats();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Setup Server-Sent Events for Real-Time Updates
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const eventSource = new EventSource(`${apiUrl}/api/stream`);

    eventSource.addEventListener('dashboard-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setToast({ message: data.message, id: Date.now() });

          // Auto-hide toast after 5s
          setTimeout(() => setToast(null), 5000);

          // Auto-refresh data
          fetchStats();
          setDate((currentDate) => {
            if (currentDate) fetchAppointments(currentDate);
            return currentDate;
          });
        }
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    });

    return () => {
      clearInterval(timer);
      eventSource.close();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAppointments = async (selectedDate: Date) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(`${apiUrl}/api/appointments?date=${formattedDate}`);
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm("¿Seguro que deseas cancelar esta cita? Se enviará una notificación por Telegram al cliente.")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/appointments/${id}/cancel`, { method: "POST" });
      if (date) fetchAppointments(date);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinishAppointment = async () => {
    if (!checkoutAppt) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/appointments/${checkoutAppt.id}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalPrice: Number(finalPrice),
          paymentMethod
        })
      });
      setCheckoutAppt(null);
      if (date) fetchAppointments(date);
      fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date) fetchAppointments(date);
  }, [date]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Confirmada</Badge>;
      case "PENDING": return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Pendiente</Badge>;
      case "FINISHED": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Finalizada</Badge>;
      case "CANCELLED": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Cancelada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-sans selection:bg-amber-500/30">
      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 md:top-0 left-0 w-full md:w-20 h-16 md:h-screen bg-[#16191d]/90 md:bg-[#16191d] backdrop-blur-xl border-t md:border-t-0 md:border-r border-slate-800/50 flex flex-row md:flex-col items-center justify-around md:justify-start md:py-8 z-50 transition-all duration-300 pb-safe">
        <div className="hidden md:flex w-12 h-12 bg-amber-500 rounded-xl items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20 mb-8">
          <Scissors className="w-6 h-6" />
        </div>
        <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-6 w-full px-2 md:px-0 justify-around md:justify-center items-center">
          <button onClick={() => setActiveTab('dashboard')} className={`p-3 md:p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-200'}`} title="Dashboard">
            <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button onClick={() => setActiveTab('finances')} className={`p-3 md:p-3 rounded-xl transition-all ${activeTab === 'finances' ? 'bg-green-500/10 text-green-500' : 'text-slate-500 hover:text-slate-200'}`} title="Finanzas">
            <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`p-3 md:p-3 rounded-xl transition-all ${activeTab === 'calendar' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-200'}`} title="Calendario">
            <CalendarDays className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button onClick={() => setActiveTab('clients')} className={`p-3 md:p-3 rounded-xl transition-all ${activeTab === 'clients' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-200'}`} title="Clientes">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button onClick={() => setActiveTab('blocked')} className={`p-3 md:p-3 rounded-xl transition-all ${activeTab === 'blocked' ? 'bg-red-500/10 text-red-400' : 'text-slate-500 hover:text-slate-200'}`} title="Horarios Bloqueados">
            <ShieldBan className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button onClick={() => setActiveTab('waitlist')} className={`p-3 md:p-3 rounded-xl transition-all ${activeTab === 'waitlist' ? 'bg-purple-500/10 text-purple-400' : 'text-slate-500 hover:text-slate-200'}`} title="Lista de Espera">
            <ListOrdered className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </nav>

      {/* Auto-dismissing Beautiful Toast Notification */}
      {toast && (
        <div
          key={toast.id}
          className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-amber-500/30 text-white px-5 py-4 rounded-xl shadow-2xl shadow-amber-500/10 animate-in slide-in-from-right-8 fade-in duration-300 max-w-sm"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-0.5">Notificación</p>
            <p className="text-sm font-medium text-slate-200 leading-snug">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white transition-colors shrink-0 p-1">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="md:pl-20 pb-20 md:pb-0">
        {/* Header */}
        <header className="px-6 md:px-10 py-6 md:py-10 border-b border-slate-800/30 bg-[#0f1115]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end max-w-7xl mx-auto gap-4 md:gap-0">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2 md:gap-3">
                <Scissors className="w-6 h-6 md:hidden text-amber-500" />
                Barbería <span className="text-amber-500 font-serif italic">Elite</span>
              </h1>
              <p className="text-slate-400 mt-1 md:mt-2 text-xs md:text-sm tracking-wide font-medium">Control operativo en tiempo real</p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-2xl md:text-3xl font-mono font-bold text-white tracking-widest suppress-hydration-warning">
                {mounted ? format(currentTime, "HH:mm:ss") : "00:00:00"}
              </div>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">{format(new Date(), "EEEE, d MMM yyyy", { locale: es })}</p>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-10">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={<CalendarDays className="w-5 h-5" />} label="Citas Hoy" value={stats.todayCount} trend="Actual" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Pendientes" value={stats.pendingCount} trend="Total" color="text-amber-500" />
                <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Finalizadas" value={stats.finishedCount} trend="Total" color="text-green-500" />
                <StatCard icon={<Users className="w-5 h-5" />} label="Clientes" value={stats.clientCount} trend="Registrados" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Calendar Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                  <Card className="bg-[#16191d] border-slate-800/50 shadow-2xl overflow-hidden group">
                    <CardHeader className="border-b border-slate-800/20 pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-amber-500" /> Explorador de Fechas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 flex justify-center scale-105 group-hover:scale-110 transition-transform duration-500">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="calendar-custom !bg-transparent"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-500/5 border-amber-500/20 p-6 relative overflow-hidden group shadow-amber-500/5 shadow-xl">
                    <Scissors className="absolute -bottom-10 -right-10 w-40 h-40 text-amber-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                    <h4 className="text-lg font-bold text-amber-500 mb-2">Tip del día</h4>
                    <p className="text-sm text-slate-400 leading-relaxed italic">"Mantén los slots de 30 minutos actualizados para una mayor fluidez con el Bot de Telegram."</p>
                  </Card>
                </div>

                {/* Appointment Table */}
                <div className="lg:col-span-8">
                  <Card className="bg-[#16191d] border-slate-800/50 shadow-2xl min-h-[500px]">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/20 pb-6">
                      <div>
                        <CardTitle className="text-2xl font-bold text-white">
                          Agenda: <span className="text-amber-500">{date ? format(date, "d 'de' MMMM", { locale: es }) : "Hoy"}</span>
                        </CardTitle>
                        <CardDescription className="text-slate-500">Listado cronológico de servicios reservados</CardDescription>
                      </div>
                      {loading && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>}
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="overflow-x-auto">
                        <Table className="min-w-full">

                          <TableHeader>
                            <TableRow className="border-slate-800/50 hover:bg-transparent">
                              <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Hora</TableHead>
                              <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Cliente</TableHead>
                              <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Servicio</TableHead>
                              <TableHead className="text-right text-slate-400 font-bold uppercase tracking-wider text-xs">Estado</TableHead>
                              <TableHead className="text-right text-slate-400 font-bold uppercase tracking-wider text-xs">Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {appointments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                  <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                                    <CalendarDays className="w-16 h-16" />
                                    <p className="text-lg font-medium">Sin citas programadas</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              appointments.map((appt) => (
                                <TableRow key={appt.id} className="border-slate-800/30 hover:bg-slate-800/20 transition-all group">
                                  <TableCell className="py-5 font-mono text-amber-500 font-bold text-lg">
                                    {format(new Date(appt.startTime), "HH:mm")}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-bold text-slate-100 group-hover:text-white transition-colors">
                                      {appt.user.firstName} {appt.user.lastName}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono tracking-tighter">@{appt.user.username || "invitado"}</div>
                                  </TableCell>
                                  <TableCell className="text-sm font-medium text-slate-400">
                                    {appt.serviceName || "Corte Tradicional"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {getStatusBadge(appt.status)}
                                  </TableCell>
                                  <TableCell className="text-right flex justify-end gap-2">
                                    {appt.status !== 'CANCELLED' && appt.status !== 'FINISHED' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setCheckoutAppt(appt);
                                            setFinalPrice(appt.price || "0");
                                            setPaymentMethod("Efectivo");
                                          }}
                                          className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors"
                                          title="Cobrar y Finalizar"
                                        >
                                          <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                        <button
                                          onClick={() => handleCancelAppointment(appt.id)}
                                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                          title="Cancelar cita y notificar"
                                        >
                                          <XCircle className="w-5 h-5" />
                                        </button>
                                      </>
                                    )}
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
              </div>
            </>
          )}

          {/* Checkout Modal */}
          {checkoutAppt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <Card className="bg-[#16191d] border-slate-700 w-full max-w-md shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Finalizar Cita</CardTitle>
                  <CardDescription className="text-slate-400">Servicio de {checkoutAppt.user.firstName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Precio Final a Cobrar ($)</label>
                    <input
                      type="number"
                      value={finalPrice}
                      onChange={e => setFinalPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-lg font-mono focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Método de Pago</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaymentMethod("Efectivo")}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${paymentMethod === 'Efectivo' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      >Efectivo</button>
                      <button
                        onClick={() => setPaymentMethod("Tarjeta")}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${paymentMethod === 'Tarjeta' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      >Tarjeta</button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-800 mt-6">
                    <button onClick={() => setCheckoutAppt(null)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg font-bold hover:bg-slate-700">Cancelar</button>
                    <button disabled={loading} onClick={handleFinishAppointment} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500 flex justify-center items-center gap-2">
                      {loading ? 'Cargando...' : <><CheckCircle2 className="w-5 h-5" /> Cobrar y Cerrar</>}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'calendar' && (
            <Card className="bg-[#16191d] border-slate-800/50 shadow-2xl overflow-hidden h-[700px] flex flex-col">
              <CardHeader className="border-b border-slate-800/20 pb-4 shrink-0">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <CalendarDays className="w-6 h-6 text-amber-500" /> Seguimiento en Google Calendar
                </CardTitle>
                <CardDescription className="text-slate-500">Visualización en vivo de la agenda (inicia sesión en Google si no ves tu calendario)</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-grow">
                <iframe
                  src="https://calendar.google.com/calendar/embed?src=joseia9610%40gmail.com&ctz=America%2FMexico_City&wkst=1&bgcolor=%23ffffff&color=%23F6BF26&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0&mode=WEEK"
                  style={{ border: 0 }}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  title="Google Calendar"
                ></iframe>
              </CardContent>
            </Card>
          )}

          {activeTab === 'clients' && <ClientsView onSelectClient={(id: string) => setSelectedClientId(id)} />}

          {activeTab === 'finances' && <FinancesView />}

          {activeTab === 'blocked' && <BlockedSlotsView />}

          {activeTab === 'waitlist' && <WaitlistView />}

        </main>
      </div>

      {/* Client Detail Side Panel */}
      {selectedClientId && (
        <ClientDetailPanel clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />
      )}
    </div>
  );
}

function ClientsView({ onSelectClient }: { onSelectClient: (id: string) => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/clients`);
        const data = await res.json();
        setClients(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  return (
    <Card className="bg-[#16191d] border-slate-800/50 shadow-2xl min-h-[500px]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/20 pb-6">
        <div>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-500" /> Directorio de Clientes
          </CardTitle>
          <CardDescription className="text-slate-500">Listado de todos los clientes registrados por el Bot de Telegram</CardDescription>
        </div>
        {loading && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>}
      </CardHeader>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/50 hover:bg-transparent">
              <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Cliente</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs">Identificador</TableHead>
              <TableHead className="text-center text-slate-400 font-bold uppercase tracking-wider text-xs">Total de Citas</TableHead>
              <TableHead className="text-right text-slate-400 font-bold uppercase tracking-wider text-xs">Última Visita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                    <Users className="w-16 h-16" />
                    <p className="text-lg font-medium">No hay clientes aún</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="border-slate-800/30 hover:bg-slate-800/20 transition-all group cursor-pointer" onClick={() => onSelectClient(client.id)}>
                  <TableCell>
                    <div className="font-bold text-slate-100 group-hover:text-white transition-colors">
                      {client.firstName} {client.lastName}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {client.username ? `@${client.username}` : client.telegramId}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">{client._count?.appointments || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-400">
                    {client.appointments && client.appointments.length > 0
                      ? format(new Date(client.appointments[0].startTime), "dd/MM/yyyy")
                      : "Nunca"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value, trend, color = "text-slate-400" }: { icon: any, label: string, value: any, trend: string, color?: string }) {
  return (
    <Card className="bg-[#16191d] border-slate-800/50 hover:border-amber-500/30 hover:shadow-amber-500/5 transition-all group overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 bg-slate-800/50 rounded-lg group-hover:scale-110 transition-transform ${color}`}>{icon}</div>
          <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{trend}</span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
          <div className="text-3xl font-extrabold text-white">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
