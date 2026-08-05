import { useState } from "react";
import {
  Badge,
  BarChart,
  Breadcrumb,
  Button,
  Card,
  Drawer,
  Input,
  LineChart,
  Loader,
  Modal,
  Navbar,
  Pagination,
  QrCode,
  Select,
  Sidebar,
  Skeleton,
  Sparkline,
  Table,
  Tabs,
  Textarea,
} from "../../components/ui";
import { CheckIcon } from "../../components/ui/icons";
import { useToast } from "../../context/ToastContext";
import "./DesignSystemPage.css";

const SAMPLE_ROWS = [
  { id: 1, nom: "Fatou Diop", poste: "Médina Sabakh", statut: "actif" },
  { id: 2, nom: "Moussa Ndiaye", poste: "Falila", statut: "en attente" },
  { id: 3, nom: "Aïssatou Ba", poste: "Kohel", statut: "inactif" },
];

const SAMPLE_BAR_DATA = [
  { label: "Lun", value: 12 },
  { label: "Mar", value: 19 },
  { label: "Mer", value: 8 },
  { label: "Jeu", value: 24 },
  { label: "Ven", value: 16 },
];

export default function DesignSystemPage() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState("apercu");

  return (
    <div className="ds-page">
      <Navbar
        showSearch
        notifications={[
          { id: "1", label: "3 articles sous le seuil", description: "Pharmacie", to: "#" },
          { id: "2", label: "1 compte en attente", description: "Personnel", to: "#" },
        ]}
        user={{ name: "Aminata Sow", role: "Infirmier Chef de Poste" }}
        onSignOut={() => toast.info("Déconnexion (démonstration)")}
      />

      <div className="ds-layout">
        <Sidebar
          logo="UCDS"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          sections={[
            {
              title: "Navigation",
              items: [
                { label: "Accueil", to: "/design-system" },
                { label: "Tableau de bord", to: "/tableau-de-bord" },
              ],
            },
          ]}
          footer={<span>Poste : Médina Sabakh</span>}
        />

        <main className="ds-content container">
          <Breadcrumb
            items={[{ label: "UCDS", to: "/" }, { label: "Design System" }]}
          />
          <h1>Design System UCDS</h1>
          <p className="ds-subtitle">
            Composants réutilisables — étape 2 de la feuille de route. Palette, typographie et
            composants validés visuellement ci-dessous.
          </p>

          <section className="ds-section">
            <h2>Palette</h2>
            <div className="ds-palette">
              <div className="ds-swatch" style={{ background: "var(--color-primary)" }}>
                Primaire
                <br />
                #2AAE8A
              </div>
              <div className="ds-swatch" style={{ background: "var(--color-secondary)" }}>
                Secondaire
                <br />
                #124D41
              </div>
              <div
                className="ds-swatch"
                style={{ background: "var(--color-light)", color: "var(--color-secondary)" }}
              >
                Claire
                <br />
                #7FE3C6
              </div>
              <div
                className="ds-swatch"
                style={{ background: "var(--color-bg-light)", color: "var(--color-secondary)" }}
              >
                Fond clair
                <br />
                #CFF7EA
              </div>
              <div
                className="ds-swatch"
                style={{
                  background: "var(--color-white)",
                  color: "var(--color-secondary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                Blanc
                <br />
                #F2FFFB
              </div>
            </div>
          </section>

          <section className="ds-section">
            <h2>Buttons</h2>
            <div className="ds-row">
              <Button variant="primary">Primaire</Button>
              <Button variant="secondary">Secondaire</Button>
              <Button variant="outline">Contour</Button>
              <Button variant="ghost">Discret</Button>
              <Button variant="danger">Danger</Button>
              <Button loading>Chargement</Button>
              <Button disabled>Désactivé</Button>
              <Button iconLeft={<CheckIcon />}>Avec icône</Button>
            </div>
          </section>

          <section className="ds-section">
            <h2>Inputs</h2>
            <div className="ds-grid">
              <Input label="Nom complet" placeholder="Ex. Fatou Diop" required />
              <Input label="Email" type="email" placeholder="nom@ucds.sn" hint="Adresse professionnelle" />
              <Input label="Champ en erreur" defaultValue="valeur invalide" error="Ce champ est requis" />
              <Select
                label="Poste de santé"
                required
                options={[
                  { value: "medina-sabakh", label: "Médina Sabakh" },
                  { value: "falila", label: "Falila" },
                  { value: "kohel", label: "Kohel" },
                ]}
              />
              <Textarea label="Notes" placeholder="Observations complémentaires..." />
            </div>
          </section>

          <section className="ds-section">
            <h2>Badges</h2>
            <div className="ds-row">
              <Badge tone="neutral">Neutre</Badge>
              <Badge tone="primary">Primaire</Badge>
              <Badge tone="success" dot>Actif</Badge>
              <Badge tone="warning" dot>En attente</Badge>
              <Badge tone="danger" dot>Rupture</Badge>
              <Badge tone="info">Info</Badge>
            </div>
          </section>

          <section className="ds-section">
            <h2>Cards</h2>
            <div className="ds-grid">
              <Card hoverable>
                <Card.Header>
                  <Card.Title>Poste de santé</Card.Title>
                  <Badge tone="success" dot>Actif</Badge>
                </Card.Header>
                <Card.Body>
                  <Card.Description>
                    Médina Sabakh — 128 patients suivis ce mois-ci.
                  </Card.Description>
                </Card.Body>
                <Card.Footer>
                  <Button size="sm" variant="outline">Voir le détail</Button>
                </Card.Footer>
              </Card>
              <Card>
                <Card.Body>
                  <Skeleton.Text lines={3} />
                </Card.Body>
              </Card>
              <Skeleton.Card />
            </div>
          </section>

          <section className="ds-section">
            <h2>Table</h2>
            <Table
              columns={[
                { key: "nom", header: "Nom" },
                { key: "poste", header: "Poste de santé" },
                {
                  key: "statut",
                  header: "Statut",
                  render: (row) => (
                    <Badge
                      tone={row.statut === "actif" ? "success" : row.statut === "inactif" ? "danger" : "warning"}
                      dot
                    >
                      {row.statut}
                    </Badge>
                  ),
                },
              ]}
              rows={SAMPLE_ROWS}
            />
          </section>

          <section className="ds-section">
            <h2>Pagination</h2>
            <Pagination currentPage={page} totalPages={9} onPageChange={setPage} />
          </section>

          <section className="ds-section">
            <h2>Tabs</h2>
            <Tabs
              tabs={[
                { id: "apercu", label: "Aperçu" },
                { id: "historique", label: "Historique" },
                { id: "documents", label: "Documents", badge: 3 },
              ]}
              activeId={activeDemoTab}
              onChange={setActiveDemoTab}
            />
            <p className="ds-subtitle">Onglet actif : {activeDemoTab}</p>
          </section>

          <section className="ds-section">
            <h2>QR Code</h2>
            <div className="ds-row">
              <QrCode value="MSB-0001-20260804" size={140} />
            </div>
          </section>

          <section className="ds-section">
            <h2>Loader &amp; Skeleton</h2>
            <div className="ds-row">
              <Loader size="sm" />
              <Loader size="md" label="Chargement des patients..." />
              <Loader size="lg" />
            </div>
          </section>

          <section className="ds-section">
            <h2>Charts</h2>
            <div className="ds-grid">
              <Card>
                <Card.Title>Tickets émis (semaine)</Card.Title>
                <BarChart data={SAMPLE_BAR_DATA} height={180} />
              </Card>
              <Card>
                <Card.Title>Fréquentation (7 jours)</Card.Title>
                <LineChart data={SAMPLE_BAR_DATA} height={180} />
              </Card>
              <Card>
                <Card.Title>Tendance rapide</Card.Title>
                <Sparkline values={[4, 8, 6, 12, 9, 14, 20]} width={160} height={40} />
              </Card>
            </div>
          </section>

          <section className="ds-section">
            <h2>Modal, Drawer &amp; Toast</h2>
            <div className="ds-row">
              <Button onClick={() => setModalOpen(true)}>Ouvrir la modal</Button>
              <Button variant="outline" onClick={() => setDrawerOpen(true)}>
                Ouvrir le drawer
              </Button>
              <Button variant="ghost" onClick={() => toast.success("Enregistrement effectué")}>
                Toast succès
              </Button>
              <Button variant="ghost" onClick={() => toast.error("Une erreur est survenue")}>
                Toast erreur
              </Button>
              <Button variant="ghost" onClick={() => toast.warning("Stock faible détecté")}>
                Toast alerte
              </Button>
            </div>
          </section>
        </main>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirmer l'action"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => setModalOpen(false)}>Confirmer</Button>
          </>
        }
      >
        <p>Ceci est un exemple de contenu de modal du Design System UCDS.</p>
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Détail du patient">
        <p>Contenu d'exemple pour le composant Drawer.</p>
      </Drawer>
    </div>
  );
}
