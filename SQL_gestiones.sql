-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 10 CRM — Tabla de gestiones de cobranza
-- Ejecutar en Supabase SQL Editor antes de instalar el código
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gestiones_cobranza (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  credito_id        UUID NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,
  cliente_id        UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Tipo de gestión
  tipo              TEXT NOT NULL
    CHECK (tipo IN (
      'llamado',        -- llamado telefónico
      'visita',         -- visita domiciliaria
      'whatsapp',       -- mensaje por WhatsApp
      'email',          -- correo electrónico
      'carta',          -- carta documento o notificación
      'convenio',       -- acuerdo de pago
      'otro'            -- otro tipo
    )),

  -- Resultado de la gestión
  resultado         TEXT NOT NULL
    CHECK (resultado IN (
      'contactado',         -- se habló con el cliente
      'sin_respuesta',      -- no atendió / no contestó
      'numero_incorrecto',  -- número equivocado
      'promesa_pago',       -- prometió pagar
      'rechazo',            -- se negó a pagar
      'pago_recibido',      -- pagó en el momento
      'convenio_acordado',  -- acordaron plan de pago
      'otro'                -- otro resultado
    )),

  -- Detalle de la gestión
  observaciones     TEXT,

  -- Promesa de pago (si resultado = promesa_pago)
  promesa_fecha     DATE,          -- fecha en que prometió pagar
  promesa_monto     NUMERIC(12,2), -- monto que prometió pagar

  -- Auditoría
  gestionado_por    UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_gestiones_empresa ON gestiones_cobranza(empresa_id);
CREATE INDEX IF NOT EXISTS idx_gestiones_credito ON gestiones_cobranza(credito_id);
CREATE INDEX IF NOT EXISTS idx_gestiones_cliente ON gestiones_cobranza(cliente_id);
CREATE INDEX IF NOT EXISTS idx_gestiones_fecha ON gestiones_cobranza(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gestiones_promesa ON gestiones_cobranza(promesa_fecha)
  WHERE promesa_fecha IS NOT NULL;

-- RLS
ALTER TABLE gestiones_cobranza ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solo_empresa_propia_gestiones" ON gestiones_cobranza
  FOR ALL
  USING (empresa_id = get_empresa_id_usuario())
  WITH CHECK (empresa_id = get_empresa_id_usuario());
