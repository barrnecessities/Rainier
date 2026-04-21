type ChecklistItem = { id: number; label: string; done: boolean };

type Props = {
  goals: string[];
  items: ChecklistItem[];
  onToggle: (itemId: number) => void;
};

export function WeeklyPlanChecklist({ goals, items, onToggle }: Props) {
  return (
    <section className="card">
      <h2>This Week</h2>
      <ul>
        {goals.map((goal) => (
          <li key={goal}>{goal}</li>
        ))}
      </ul>
      <h3>Daily Checklist</h3>
      <div className="checklist">
        {items.map((item) => (
          <label key={item.id} className={item.done ? "done" : ""}>
            <input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} />
            {item.label}
          </label>
        ))}
      </div>
    </section>
  );
}
