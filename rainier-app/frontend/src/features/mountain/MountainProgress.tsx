type Milestone = { id: string; label: string; targetFeet: number; completed: boolean };

type Props = {
  summitFeet: number;
  currentProgressFeet: number;
  milestones: Milestone[];
};

export function MountainProgress({ summitFeet, currentProgressFeet, milestones }: Props) {
  const progressPercent = Math.min(100, Math.round((currentProgressFeet / summitFeet) * 100));

  return (
    <section className="card">
      <h2>Rainier Progress</h2>
      <div className="mountain">
        <div className="mountain-fill" style={{ height: `${progressPercent}%` }} />
      </div>
      <p>{currentProgressFeet} / {summitFeet} ft ({progressPercent}%)</p>
      <ul>
        {milestones.map((m) => (
          <li key={m.id}>
            <strong>{m.label}</strong> - {m.targetFeet} ft {m.completed ? "✅" : "⬜"}
          </li>
        ))}
      </ul>
    </section>
  );
}
