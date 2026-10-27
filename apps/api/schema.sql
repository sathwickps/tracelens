CREATE TABLE IF NOT EXISTS traces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  model         text NOT NULL,
  status        text NOT NULL CHECK (status IN ('ok', 'error')),
  latency_ms    integer NOT NULL CHECK (latency_ms >= 0),
  input_tokens  integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  prompt        jsonb NOT NULL,
  response      jsonb,
  error         text
);
CREATE INDEX IF NOT EXISTS traces_created_at_idx ON traces (created_at DESC, id DESC);
