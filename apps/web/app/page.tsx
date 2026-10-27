type Trace = {
  id: string; created_at: string; model: string; status: 'ok' | 'error';
  latency_ms: number; input_tokens: number; output_tokens: number; error: string | null;
};

// Week 1: plain server-rendered table. Week 2 replaces it with a virtualized TanStack grid + live updates.
export default async function Page() {
  const api = process.env.TRACELENS_URL ?? 'http://localhost:4000';
  const { traces } = (await fetch(`${api}/v1/traces?limit=100`, { cache: 'no-store' }).then((r) => r.json())) as { traces: Trace[] };

  return (
    <main>
      <h1>TraceLens</h1>
      <table cellPadding={6} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr><th align="left">Time</th><th align="left">Model</th><th>Status</th><th align="right">Latency</th><th align="right">Tokens in/out</th></tr>
        </thead>
        <tbody>
          {traces.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.created_at).toLocaleTimeString()}</td>
              <td>{t.model}</td>
              <td>{t.status}</td>
              <td align="right">{t.latency_ms} ms</td>
              <td align="right">{t.input_tokens} / {t.output_tokens}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
