import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../../lib/api";

export function LoginPage() {
  const [email, setEmail] = useState("athlete@example.com");
  const [password, setPassword] = useState("rainier123");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.login(email, password);
      setToken(result.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Rainier Training Login</h1>
        <p>Connect your account to view your weekly summit plan.</p>
        <form onSubmit={onSubmit} className="form">
          <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit">Sign In</button>
        </form>
      </section>
    </main>
  );
}
