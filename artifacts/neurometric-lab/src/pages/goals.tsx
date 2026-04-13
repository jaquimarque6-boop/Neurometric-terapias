import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Target, Plus, CheckCircle2, Circle, ArrowRightCircle, AlertCircle
} from "lucide-react";
import { 
  useListGoals, 
  useCreateGoal,
  useUpdateGoal,
  useListPatients,
  getListGoalsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const createGoalSchema = z.object({
  patientId: z.coerce.number().min(1, "Patient is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["cognitive", "behavioral", "emotional", "social", "physical"]),
  status: z.enum(["pending", "in-progress", "achieved", "discontinued"]),
  targetDate: z.string().optional(),
});

export default function Goals() {
  const { data: goals, isLoading } = useListGoals();
  const updateGoal = useUpdateGoal();
  const queryClient = useQueryClient();

  // Group goals by patient for clinical view
  const groupedGoals = goals?.reduce((acc, goal) => {
    const key = goal.patientName || `Patient ${goal.patientId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(goal);
    return acc;
  }, {} as Record<string, typeof goals>);

  const handleStatusUpdate = (id: number, newStatus: any) => {
    updateGoal.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
      }
    });
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'achieved': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'in-progress': return <ArrowRightCircle className="h-5 w-5 text-accent" />;
      case 'discontinued': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground/40" />;
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Therapy Goals
            </h1>
            <p className="text-muted-foreground mt-1">Track treatment plan objectives and progress.</p>
          </div>
          <CreateGoalSheet />
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center p-12 text-muted-foreground animate-pulse">Loading treatment plans...</div>
          ) : !groupedGoals || Object.keys(groupedGoals).length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-border">
              <Target className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No active goals</h3>
              <p className="text-muted-foreground mt-1">Create treatment goals for your patients.</p>
            </div>
          ) : (
            Object.entries(groupedGoals).map(([patientName, patientGoals]) => (
              <Card key={patientName} className="border-border/50 shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-muted/50 border-b py-4">
                  <CardTitle className="text-lg font-display text-primary flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                      {patientName.charAt(0)}
                    </div>
                    {patientName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {patientGoals.map(goal => (
                      <div key={goal.id} className="p-5 hover:bg-muted/40/50 transition-colors flex flex-col md:flex-row gap-4 md:items-start justify-between group">
                        <div className="flex gap-4">
                          <div className="mt-0.5">
                            <StatusIcon status={goal.status} />
                          </div>
                          <div>
                            <h4 className={`font-semibold ${goal.status === 'achieved' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {goal.title}
                            </h4>
                            {goal.description && (
                              <p className="text-sm text-foreground/70 mt-1 max-w-2xl">{goal.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                              <Badge variant="secondary" className="capitalize bg-muted text-foreground/70 hover:bg-muted">
                                {goal.category}
                              </Badge>
                              {goal.targetDate && (
                                <span className="text-xs text-muted-foreground font-medium bg-white px-2 py-1 rounded border">
                                  Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity ml-9 md:ml-0">
                          <Select 
                            value={goal.status} 
                            onValueChange={(val) => handleStatusUpdate(goal.id, val)}
                            disabled={updateGoal.isPending}
                          >
                            <SelectTrigger className="h-8 w-[140px] bg-white text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="achieved">Achieved</SelectItem>
                              <SelectItem value="discontinued">Discontinued</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function CreateGoalSheet() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createGoal = useCreateGoal();
  const { data: patients } = useListPatients();

  const form = useForm<z.infer<typeof createGoalSchema>>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      patientId: undefined,
      title: "",
      description: "",
      category: "behavioral",
      status: "pending",
      targetDate: "",
    },
  });

  const onSubmit = (values: z.infer<typeof createGoalSchema>) => {
    // Only send targetDate if it exists to avoid type issues if empty string
    const payload = {
      ...values,
      targetDate: values.targetDate ? new Date(values.targetDate).toISOString() : undefined
    };

    createGoal.mutate({ data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        toast({
          title: "Goal created",
          description: "New clinical goal added to patient record.",
        });
        setOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create goal.",
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
          Add Goal
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-muted/50 border-l-0 shadow-2xl">
        <SheetHeader className="bg-white -mx-6 -mt-6 p-6 border-b shadow-sm mb-6">
          <SheetTitle className="font-display text-2xl text-primary">Treatment Goal</SheetTitle>
          <SheetDescription>
            Define a measurable clinical objective.
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            <div className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Patient</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/50">
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
            </div>

            <div className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Goal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Reduce panic attacks to <1/week" className="bg-muted/50 font-medium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Details / Measurement</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Patient will utilize grounding techniques..." 
                        className="bg-muted/50 min-h-[80px] resize-none text-sm" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Domain</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cognitive">Cognitive</SelectItem>
                          <SelectItem value="behavioral">Behavioral</SelectItem>
                          <SelectItem value="emotional">Emotional</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="physical">Physical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Target Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-muted/50" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 shadow-md" disabled={createGoal.isPending}>
                {createGoal.isPending ? "Saving..." : "Save Goal"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
