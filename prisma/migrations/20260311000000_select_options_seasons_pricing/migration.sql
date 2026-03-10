-- CreateTable: SelectOption
CREATE TABLE "SelectOption" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelectOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Season
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TourPrice
CREATE TABLE "TourPrice" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "adu" TEXT,
    "chd" TEXT,
    "inf" TEXT,

    CONSTRAINT "TourPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SelectOption_group_value_key" ON "SelectOption"("group", "value");
CREATE INDEX "SelectOption_group_active_idx" ON "SelectOption"("group", "active");
CREATE UNIQUE INDEX "Season_code_key" ON "Season"("code");
CREATE UNIQUE INDEX "TourPrice_tourId_seasonId_key" ON "TourPrice"("tourId", "seasonId");
CREATE INDEX "TourPrice_tourId_idx" ON "TourPrice"("tourId");

-- AddForeignKey
ALTER TABLE "TourPrice" ADD CONSTRAINT "TourPrice_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TourPrice" ADD CONSTRAINT "TourPrice_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════
-- SEED: SelectOption
-- ═══════════════════════════════════════════════════

-- Destinos
INSERT INTO "SelectOption" ("id", "group", "value", "sortOrder") VALUES
  (gen_random_uuid(), 'destino', 'Atacama', 1),
  (gen_random_uuid(), 'destino', 'Bariloche', 2),
  (gen_random_uuid(), 'destino', 'Santiago', 3);

-- Categorias
INSERT INTO "SelectOption" ("id", "group", "value", "sortOrder") VALUES
  (gen_random_uuid(), 'categoria', 'PVD', 1),
  (gen_random_uuid(), 'categoria', 'REG', 2);

-- Operadores
INSERT INTO "SelectOption" ("id", "group", "value", "sortOrder") VALUES
  (gen_random_uuid(), 'operador', '2GO', 1),
  (gen_random_uuid(), 'operador', 'Bariloche Travel', 2),
  (gen_random_uuid(), 'operador', 'Beer Experience', 3),
  (gen_random_uuid(), 'operador', 'Centro de Ski Nórdico', 4),
  (gen_random_uuid(), 'operador', 'Cristian Fernandez', 5),
  (gen_random_uuid(), 'operador', 'Extremo Encantado', 6),
  (gen_random_uuid(), 'operador', 'Extremo Sur', 7),
  (gen_random_uuid(), 'operador', 'Fidu Viagens', 8),
  (gen_random_uuid(), 'operador', 'La Cueva Catedral', 9),
  (gen_random_uuid(), 'operador', 'La Frágua', 10),
  (gen_random_uuid(), 'operador', 'Patagonia Nieve', 11),
  (gen_random_uuid(), 'operador', 'Patagonia Ski School', 12),
  (gen_random_uuid(), 'operador', 'Refúgio Arelauquen', 13),
  (gen_random_uuid(), 'operador', 'Refúgio Neumeyer', 14),
  (gen_random_uuid(), 'operador', 'Roca Negra', 15),
  (gen_random_uuid(), 'operador', 'Si Turismo', 16),
  (gen_random_uuid(), 'operador', 'Tierra de Mestizos', 17),
  (gen_random_uuid(), 'operador', 'Turisur', 18),
  (gen_random_uuid(), 'operador', 'Ulli', 19),
  (gen_random_uuid(), 'operador', 'Wine House', 20),
  (gen_random_uuid(), 'operador', 'Winter Park', 21);

-- Temporadas
INSERT INTO "SelectOption" ("id", "group", "value", "sortOrder") VALUES
  (gen_random_uuid(), 'temporada', 'Ano Todo', 1),
  (gen_random_uuid(), 'temporada', 'Inverno', 2),
  (gen_random_uuid(), 'temporada', 'Verão', 3);

-- Moedas
INSERT INTO "SelectOption" ("id", "group", "value", "sortOrder") VALUES
  (gen_random_uuid(), 'moeda', 'BRL', 1),
  (gen_random_uuid(), 'moeda', 'USD', 2),
  (gen_random_uuid(), 'moeda', 'CLP', 3),
  (gen_random_uuid(), 'moeda', 'EUR', 4),
  (gen_random_uuid(), 'moeda', 'ARS', 5);

-- Tags
INSERT INTO "SelectOption" ("id", "group", "value", "sortOrder") VALUES
  (gen_random_uuid(), 'tag', 'Aluguel', 1),
  (gen_random_uuid(), 'tag', 'Aula', 2),
  (gen_random_uuid(), 'tag', 'Aventura', 3),
  (gen_random_uuid(), 'tag', 'Cultural', 4),
  (gen_random_uuid(), 'tag', 'Gastronômico', 5),
  (gen_random_uuid(), 'tag', 'Navegação', 6),
  (gen_random_uuid(), 'tag', 'Neve', 7),
  (gen_random_uuid(), 'tag', 'Noturno', 8),
  (gen_random_uuid(), 'tag', 'Panorâmico', 9),
  (gen_random_uuid(), 'tag', 'Ski', 10),
  (gen_random_uuid(), 'tag', 'Teleférico', 11),
  (gen_random_uuid(), 'tag', 'Terrestre', 12),
  (gen_random_uuid(), 'tag', 'Tradicionais', 13),
  (gen_random_uuid(), 'tag', 'Transfer', 14),
  (gen_random_uuid(), 'tag', 'Vinícola', 15),
  (gen_random_uuid(), 'tag', 'Vulcão', 16);

-- ═══════════════════════════════════════════════════
-- SEED: Season
-- ═══════════════════════════════════════════════════

INSERT INTO "Season" ("id", "code", "label", "sortOrder") VALUES
  (gen_random_uuid(), 'VER26', 'Verão 2026', 1),
  (gen_random_uuid(), 'INV26', 'Inverno 2026', 2);

-- ═══════════════════════════════════════════════════
-- MIGRATE: TourPrice from existing Tour columns
-- ═══════════════════════════════════════════════════

INSERT INTO "TourPrice" ("id", "tourId", "seasonId", "adu", "chd", "inf")
SELECT gen_random_uuid(), t."id", s."id", t."ver26Adu", t."ver26Chd", t."ver26Inf"
FROM "Tour" t, "Season" s
WHERE s."code" = 'VER26'
  AND (t."ver26Adu" IS NOT NULL OR t."ver26Chd" IS NOT NULL OR t."ver26Inf" IS NOT NULL);

INSERT INTO "TourPrice" ("id", "tourId", "seasonId", "adu", "chd", "inf")
SELECT gen_random_uuid(), t."id", s."id", t."inv26Adu", t."inv26Chd", t."inv26Inf"
FROM "Tour" t, "Season" s
WHERE s."code" = 'INV26'
  AND (t."inv26Adu" IS NOT NULL OR t."inv26Chd" IS NOT NULL OR t."inv26Inf" IS NOT NULL);
