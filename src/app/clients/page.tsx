import { getAllClientDocuments, getClients } from "@/lib/data";
import ClientForm from "@/components/ClientForm";
import ClientsMapLoader from "@/components/ClientsMapLoader";
import ClientsTable from "@/components/ClientsTable";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, documentsByClient] = await Promise.all([
    getClients(),
    getAllClientDocuments(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Clients & Carte</h1>
        <p className="text-sm text-gray-500">
          Répartition géographique du portefeuille de clients
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ClientForm />
        </div>
        <div className="lg:col-span-3">
          <div className="card h-[520px] !p-2">
            <ClientsMapLoader clients={clients} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Tous les clients ({clients.length})
        </h2>
        <ClientsTable clients={clients} documentsByClient={documentsByClient} />
      </div>
    </div>
  );
}
