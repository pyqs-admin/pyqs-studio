import { requireUser } from "@/server/auth/session";
import { taxonomyService } from "@/server/services/taxonomy.service";
import { TaxonomyPageClient } from "./taxonomy-browser";

export const dynamic = "force-dynamic";

export default async function TaxonomyPage() {
  await requireUser();
  const taxonomy = await taxonomyService.getTaxonomyOptions();
  return <TaxonomyPageClient initialTaxonomy={JSON.parse(JSON.stringify(taxonomy))} />;
}
