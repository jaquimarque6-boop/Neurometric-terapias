import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Stethoscope, Plus, Mail, ShieldCheck, Users as UsersIcon 
} from "lucide-react";
import { 
  useListProfessionals, 
  useCreateProfessional,
  getListProfessionalsQueryKey
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
import { Input } from "@/components/ui/input";

const createProSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  specialty: z.string().min(2, "Specialty is required"),
  license: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

export default function Professionals() {
  const { data: professionals, isLoading } = useListProfessionals();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              Clinical Staff
            </h1>
            <p className="text-slate-500 mt-1">Manage therapists, clinicians, and practitioners.</p>
          </div>
          <CreateProSheet />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center p-12 text-slate-500">Loading staff directory...</div>
          ) : professionals?.map(pro => (
            <Card key={pro.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card-gradient overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-bold text-lg font-display shadow-sm">
                        {pro.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{pro.name}</h3>
                        <p className="text-sm font-medium text-primary mt-0.5">{pro.specialty}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400 mr-3" />
                      {pro.email}
                    </div>
                    {pro.license && (
                      <div className="flex items-center text-sm text-slate-600">
                        <ShieldCheck className="h-4 w-4 text-slate-400 mr-3" />
                        License: {pro.license}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium text-slate-600">
                    <UsersIcon className="h-4 w-4 text-primary mr-2" />
                    {pro.patientCount || 0} Patients
                  </div>
                  <Badge variant="outline" className={pro.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500'}>
                    {pro.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}

function CreateProSheet() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPro = useCreateProfessional();

  const form = useForm<z.infer<typeof createProSchema>>({
    resolver: zodResolver(createProSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialty: "",
      license: "",
      status: "active",
    },
  });

  const onSubmit = (values: z.infer<typeof createProSchema>) => {
    createPro.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() });
        toast({
          title: "Professional added",
          description: "New staff member has been registered.",
        });
        setOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to add professional.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Add Professional
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-slate-50 border-l-0 shadow-2xl">
        <SheetHeader className="bg-white -mx-6 -mt-6 p-6 border-b shadow-sm mb-6">
          <SheetTitle className="font-display text-2xl text-slate-900">New Professional</SheetTitle>
          <SheetDescription>
            Add a new clinician to the platform.
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
                      <Input placeholder="Dr. Sarah Connor" className="bg-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Clinical Specialty</FormLabel>
                    <FormControl>
                      <Input placeholder="Clinical Psychologist" className="bg-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="sarah@neurometric.com" className="bg-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="license"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PSY-12345" className="bg-slate-50" {...field} />
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
              <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 shadow-md text-white" disabled={createPro.isPending}>
                {createPro.isPending ? "Adding..." : "Add Staff"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
