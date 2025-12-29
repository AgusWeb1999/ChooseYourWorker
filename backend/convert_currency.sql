-- Función: public.convert_currency(amount numeric, from_currency text, to_currency text)
-- Requiere la extensión http para Postgres (CREATE EXTENSION IF NOT EXISTS http;)

CREATE OR REPLACE FUNCTION public.convert_currency(
    amount numeric,
    from_currency text,
    to_currency text
) RETURNS numeric AS $$
DECLARE
    url text;
    response json;
    rate numeric;
    converted numeric;
BEGIN
    -- Usar exchangerate.host API gratuita
    url := format('https://api.exchangerate.host/convert?from=%s&to=%s&amount=%s', from_currency, to_currency, amount);
    response := (
        SELECT content::json
        FROM http_get(url)
    );
    rate := (response->'info'->>'rate')::numeric;
    converted := (response->'result')::numeric;
    RETURN converted;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT public.convert_currency(20, 'UYU', 'ARS');
