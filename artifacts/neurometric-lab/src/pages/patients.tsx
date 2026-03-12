import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { 
  Users, Plus, Search, Mail, Phone, FileText, UserCircle, ChevronRight
} from "lucide-react";
import { 
  useListPatients, 
  useCreatePatient,
  getListPatientsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";

const createPatientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.coerce.number().min(0, "Invalid age"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  diagnosis: z.string().optional(),
  status: z.enum(["active", "inactive", "discharged"]),
  professionalId: z.coerce.number().optional(),
});

const STATUS_FILTERS = ["all", "active", "inactive", "discharged"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [, navigate] = useLocation();
  const { data: patients, isLoading } = useListPatients();

  const counts = {
    all: patients?.length ?? 0,
    active: patients?.filter(p => p.status === "active").length ?? 0,
    inactive: patients?.filter(p => p.status === "inactive").length ?? 0,
    discharged: patients?.filter(p => p.status === "discharged").length ?? 0,
  };
  
  const filteredPatients = (patients ?? []).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Patient Directory
              </h1>
              <p className="text-slate-500 mt-1">Manage and view all registered patients.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search patients..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-56 bg-slate-50 border-slate-200 focus-visible:ring-primary/20"
                />
              </div>
              <CreatePatientSheet />
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 border-t border-slate-100 pt-4 overflow-x-auto">
            {STATUS_FILTERS.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="capitalize">{status === "all" ? "All Patients" : status}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  statusFilter === status ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {counts[status]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="overflow-hidden border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <CardContent className="p-0">
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg font-display ring-4 ring-white shadow-sm">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-primary transition-colors">{patient.name}</h3>
                          <p className="text-sm text-slate-500">Age {patient.age}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={
                        patient.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                        patient.status === 'discharged' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-slate-100 text-slate-700'
                      }>
                        {patient.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center text-sm text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400 mr-2.5" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400 mr-2.5" />
                        <span>{patient.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-start text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 mt-3">
                        <FileText className="h-4 w-4 text-primary shrink-0 mr-2.5 mt-0.5" />
                        <span className="line-clamp-2">{patient.diagnosis || "No diagnosis recorded"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span>Added {format(new Date(patient.createdAt), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                      View Record <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <UserCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">No patients found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search or add a new patient.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function CreatePatientSheet() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPatient = useCreatePatient();

  const form = useForm<z.infer<typeof createPatientSchema>>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      name: "",
      age: undefined,
      email: "",
      phone: "",
      diagnosis: "",
      status: "active",
    },
  });

  const onSubmit = (values: z.infer<typeof createPatientSchema>) => {
    createPatient.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        toast({
          title: "Patient created",
          description: "The new patient record has been successfully added.",
        });
        setOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Failed to create patient",
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
          Add Patient
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-slate-50 border-l-0 shadow-2xl">
        <SheetHeader className="bg-white -mx-6 -mt-6 p-6 border-b shadow-sm mb-6">
          <SheetTitle className="font-display text-2xl text-primary">New Patient</SheetTitle>
          <SheetDescription>
            Enter the clinical details to register a new patient.
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" className="bg-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="34" className="bg-slate-50" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Initial Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" className="bg-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" className="bg-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Primary Diagnosis / Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Generalized Anxiety Disorder..." className="bg-slate-50" {...field} />
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
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 shadow-md" disabled={createPatient.isPending}>
                {createPatient.isPending ? "Saving..." : "Register Patient"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
