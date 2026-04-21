import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { WeeklyPlanChecklist } from "../plan/WeeklyPlanChecklist";
import { MountainProgress } from "../mountain/MountainProgress";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });
  const toggle = useMutation({
    mutationFn: api.toggleChecklist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  });

  if (isLoading) return <main className="page"><p>Loading dashboard...</p></main>;
  if (error || !data) return <main className="page"><p>Could not load dashboard.</p></main>;

  return (
    <main className="page">
      <section className="card">
        <h1>Summit Readiness</h1>
        <p className={`status ${data.readiness.status}`}>
          {data.readiness.status.toUpperCase()} - score {data.readiness.score}
        </p>
        <p>{data.weeklyPlan.weekLabel} | {data.weeklyPlan.completedHours}/{data.weeklyPlan.totalTargetHours} hrs complete</p>
      </section>
      <WeeklyPlanChecklist
        goals={data.weeklyPlan.goals}
        items={data.weeklyPlan.checklist}
        onToggle={(id) => toggle.mutate(id)}
      />
      <MountainProgress {...data.mountain} />
      <section className="card">
        <a href="http://localhost:4000/whoop/connect">Connect WHOOP</a>
      </section>
    </main>
  );
}
