import { useState } from "react";
import { useParams } from "react-router-dom";
import { Badge, Button, Table, Tabs } from "../../components/ui";
import { getStatutLabel, getStatutTone } from "../../constants/tickets";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import { todayISO, useTickets } from "../../hooks/useTickets";
import { supabase } from "../../lib/supabaseClient";
import NewTicketModal from "./NewTicketModal";
import TicketPrintModal from "./TicketPrintModal";
import "./TicketsQueuePage.css";

const FILTERS = [
  { id: "actifs", label: "File active" },
  { id: "tous", label: "Tous" },
  { id: "en_attente", label: "En attente" },
  { id: "en_cours", label: "En cours" },
  { id: "termine", label: "Terminé" },
  { id: "annule", label: "Annulé" },
];

export default function TicketsQueuePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { poste } = usePosteBySlug(slug);
  const [date, setDate] = useState(todayISO());
  const { tickets, loading, counts, refetch } = useTickets(poste?.id, date);
  const [activeFilter, setActiveFilter] = useState("actifs");
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [printTicket, setPrintTicket] = useState(null);

  const isToday = date === todayISO();
  const totalRecettes = tickets.reduce((sum, ticket) => sum + (ticket.montant ?? 0), 0);

  const filteredTickets = tickets.filter((ticket) => {
    if (activeFilter === "tous") return true;
    if (activeFilter === "actifs") {
      return ticket.statut === "en_attente" || ticket.statut === "en_cours";
    }
    return ticket.statut === activeFilter;
  });

  const updateStatus = async (ticket, statut) => {
    const { error } = await supabase.from("tickets").update({ statut }).eq("id", ticket.id);
    if (error) {
      toast.error("Impossible de mettre à jour le statut.");
      return;
    }
    refetch();
  };

  return (
    <main className="container tickets-queue">
      <div className="tickets-queue__header">
        <div>
          <h1>Tickets — File d'attente</h1>
          <p className="tickets-queue__subtitle">Poste {poste?.nom ?? ""}</p>
        </div>
        <div className="tickets-queue__header-actions">
          <input
            type="date"
            className="tickets-queue__date-input"
            value={date}
            max={todayISO()}
            onChange={(event) => setDate(event.target.value)}
          />
          <Button onClick={() => setNewModalOpen(true)} disabled={!isToday}>
            Nouveau ticket
          </Button>
        </div>
      </div>

      {!isToday && (
        <p className="tickets-queue__history-note">
          Vous consultez l'historique du {new Date(date).toLocaleDateString("fr-FR")} — lecture
          seule.
        </p>
      )}

      <div className="tickets-queue__counts">
        <Badge tone="warning" dot>
          {counts.en_attente} en attente
        </Badge>
        <Badge tone="primary" dot>
          {counts.en_cours} en cours
        </Badge>
        <Badge tone="success" dot>
          {counts.termine} terminé(s)
        </Badge>
        <Badge tone="danger" dot>
          {counts.annule} annulé(s)
        </Badge>
        <Badge tone="neutral">
          Recettes : {totalRecettes.toLocaleString("fr-FR")} FCFA
        </Badge>
      </div>

      <Tabs tabs={FILTERS} activeId={activeFilter} onChange={setActiveFilter} />

      <Table
        columns={[
          { key: "numero", header: "N°" },
          { key: "nom_visiteur", header: "Visiteur" },
          { key: "motif", header: "Motif", render: (row) => row.motif || "—" },
          {
            key: "montant",
            header: "Montant",
            render: (row) => `${(row.montant ?? 0).toLocaleString("fr-FR")} FCFA`,
          },
          {
            key: "statut",
            header: "Statut",
            render: (row) => <Badge tone={getStatutTone(row.statut)}>{getStatutLabel(row.statut)}</Badge>,
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (row) => (
              <div className="tickets-queue__row-actions">
                <Button size="sm" variant="ghost" onClick={() => setPrintTicket(row)}>
                  Ticket
                </Button>
                {isToday && row.statut === "en_attente" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(row, "en_cours")}>
                    Appeler
                  </Button>
                )}
                {isToday && row.statut === "en_cours" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(row, "termine")}>
                    Terminer
                  </Button>
                )}
                {isToday && (row.statut === "en_attente" || row.statut === "en_cours") && (
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(row, "annule")}>
                    Annuler
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rows={filteredTickets}
        emptyMessage={loading ? "Chargement..." : "Aucun ticket pour cette sélection."}
      />

      <NewTicketModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        posteId={poste?.id}
        userId={user?.id}
        defaultMontant={poste?.prix_ticket}
        onCreated={(ticket) => setPrintTicket(ticket)}
      />

      <TicketPrintModal
        open={Boolean(printTicket)}
        onClose={() => setPrintTicket(null)}
        ticket={printTicket}
        posteSlug={slug}
        poste={poste}
      />
    </main>
  );
}
