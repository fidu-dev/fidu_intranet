-- Migração: Módulo de Gestão de Passeios (e-commerce)
-- IMPORTANTE: Renomeia colunas para preservar dados existentes

-- 1. Renomear colunas conforme mapeamento obrigatório
ALTER TABLE "Tour" RENAME COLUMN "servico" TO "title";
ALTER TABLE "Tour" RENAME COLUMN "resumo" TO "description";
ALTER TABLE "Tour" RENAME COLUMN "status" TO "statusOperativo";

-- 2. Remover coluna redundante (atualizadoEm é redundante com updatedAt)
ALTER TABLE "Tour" DROP COLUMN IF EXISTS "atualizadoEm";

-- 3. Adicionar campo de exclusão lógica
ALTER TABLE "Tour" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- 4. Adicionar novos campos operacionais
ALTER TABLE "Tour" ADD COLUMN "moeda" TEXT DEFAULT 'BRL';
ALTER TABLE "Tour" ADD COLUMN "valorNeto" TEXT;
ALTER TABLE "Tour" ADD COLUMN "precoConvertido" TEXT;

-- 5. Adicionar campo de status do e-commerce
ALTER TABLE "Tour" ADD COLUMN "status" TEXT DEFAULT 'draft';

-- 6. Adicionar campos do e-commerce
ALTER TABLE "Tour" ADD COLUMN "productId" TEXT;
ALTER TABLE "Tour" ADD COLUMN "handle" TEXT;
ALTER TABLE "Tour" ADD COLUMN "vendor" TEXT;
ALTER TABLE "Tour" ADD COLUMN "productType" TEXT;
ALTER TABLE "Tour" ADD COLUMN "featuredImage" TEXT;
ALTER TABLE "Tour" ADD COLUMN "price" DOUBLE PRECISION;
ALTER TABLE "Tour" ADD COLUMN "compareAtPrice" DOUBLE PRECISION;
ALTER TABLE "Tour" ADD COLUMN "inventoryQuantity" INTEGER DEFAULT 0;
ALTER TABLE "Tour" ADD COLUMN "inventoryPolicy" TEXT DEFAULT 'deny';
ALTER TABLE "Tour" ADD COLUMN "requiresShipping" BOOLEAN DEFAULT false;
ALTER TABLE "Tour" ADD COLUMN "taxable" BOOLEAN DEFAULT false;
ALTER TABLE "Tour" ADD COLUMN "options" JSONB;
ALTER TABLE "Tour" ADD COLUMN "imageAltText" TEXT;
ALTER TABLE "Tour" ADD COLUMN "adminGraphqlApiId" TEXT;
ALTER TABLE "Tour" ADD COLUMN "inventoryItemId" TEXT;
ALTER TABLE "Tour" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "Tour" ADD COLUMN "variantsCount" INTEGER DEFAULT 0;
ALTER TABLE "Tour" ADD COLUMN "imagesCount" INTEGER DEFAULT 0;
