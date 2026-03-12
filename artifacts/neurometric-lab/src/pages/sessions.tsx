import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  CalendarDays, Plus, Clock, FileText, User
} from "lucide-react";
import { 
  useListSessions, 
  useCreateSession,
  useListPatients,
  useListProfessionals,
  getListSessionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const createSessionSchema = z.object({
  patientId: z.coerce.number().min(1, "Patient is required"),
  professionalId: z.coerce.number().min(1, "Professional is required"),
  date: z.string().min(1, "Date is required"),
  duration: z.coerce.number().min(15, "Duration must be at least 15m"),
  type: z.enum(["individual", "group", "assessment", "follow-up"]),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

export default function Sessions() {
  const { data: sessions, isLoading } = useListSessions();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Session Records
            </h1>
            <p className="text-slate-500 mt-1">Track and manage all clinical encounters.</p>
          </div>
          <CreateSessionSheet />
        </div>

        <div className="bg-white border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-full"></div></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : sessions?.length ? (
                  sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {format(new Date(session.date), 'MMM d, yyyy - h:mm a')}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {session.patientName?.charAt(0) || 'P'}
                        </div>
                        <span className="font-medium">{session.patientName || `ID: ${session.patientId}`}</span>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-600">
                        {session.type}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="flex items-center gap-1.5 bg-slate-100 w-fit px-2 py-1 rounded-md border">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {session.duration}m
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`
                          ${session.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                          ${session.status === 'scheduled' ? 'bg-blue-50 text-primary border-primary/30' : ''}
                          ${session.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        `}>
                          {session.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary">
                          <FileText className="h-4 w-4 mr-2" />
                          Notes
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No sessions recorded. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function CreateSessionSheet() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSession = useCreateSession();
  
  const { data: patients } = useListPatients();
  const { data: professionals } = useListProfessionals();

  const form = useForm<z.infer<typeof createSessionSchema>>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      patientId: undefined,
      professionalId: undefined,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      duration: 60,
      type: "individual",
      status: "scheduled",
      notes: "",
    },
  });

  const onSubmit = (values: z.infer<typeof createSessionSchema>) => {
    // Convert local datetime to ISO format for API
    const isoDate = new Date(values.date).toISOString();
    
    createSession.mutate({ data: { ...values, date: isoDate } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        toast({
          title: "Session logged",
          description: "The clinical session has been saved.",
        });
        setOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Failed to log session",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Log Session
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-slate-50 border-l-0 shadow-2xl">
        <SheetHeader className="bg-white -mx-6 -mt-6 p-6 border-b shadow-sm mb-6">
          <SheetTitle className="font-display text-2xl text-primary">Log Session</SheetTitle>
          <SheetDescription>
            Record a new therapy or assessment session.
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Patient</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients?.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="professionalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Professional</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue placeholder="Assign professional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {professionals?.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-slate-700">Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="bg-slate-50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Duration (mins)</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-slate-50" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Session Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="group">Group</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Clinical Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add session observations..." 
                        className="bg-slate-50 min-h-[100px] resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 shadow-md" disabled={createSession.isPending}>
                {createSession.isPending ? "Saving..." : "Save Session"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
