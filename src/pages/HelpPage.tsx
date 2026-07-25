import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, ListChecks, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  gettingStarted,
  glossary,
  helpTopics,
} from "@/lib/help";

export function HelpPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const topics = useMemo(() => {
    if (!q) return helpTopics;
    return helpTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(q) ||
        topic.summary.toLowerCase().includes(q) ||
        topic.tips.some((tip) => tip.toLowerCase().includes(q)),
    );
  }, [q]);

  const terms = useMemo(() => {
    if (!q) return glossary;
    return glossary.filter(
      (entry) =>
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q),
    );
  }, [q]);

  const nothingMatches = q && topics.length === 0 && terms.length === 0;

  return (
    <>
      <PageHeader
        title="Help Center"
        description="How every part of HomeVault works, plus a glossary of the terms it uses."
        actions={
          <div className="top-header__period" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Search size={15} style={{ color: "var(--text-secondary)" }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search help…"
              aria-label="Search help"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                font: "inherit",
                fontSize: "0.85rem",
                width: 180,
                color: "var(--text-primary)",
              }}
            />
          </div>
        }
      />

      {!q && (
        <Card
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <ListChecks size={17} /> Getting started
            </span>
          }
          className="page-section"
        >
          <ol style={{ margin: 0, paddingLeft: "1.2rem", display: "grid", gap: 8 }}>
            {gettingStarted.map((step, index) => (
              <li key={index} style={{ fontSize: "0.9rem" }}>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {nothingMatches && (
        <EmptyState
          title="No help topics match that search"
          detail="Try a different word, or clear the search to browse everything."
        />
      )}

      {topics.length > 0 && (
        <>
          <div className="sidebar-section__title" style={{ padding: 0, marginBottom: 8 }}>
            Module guides
          </div>
          <div className="two-col page-section">
            {topics.map((topic) => (
              <Card key={topic.path} title={topic.title}>
                <p
                  style={{
                    fontSize: "0.86rem",
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                  }}
                >
                  {topic.summary}
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.1rem",
                    display: "grid",
                    gap: 5,
                    fontSize: "0.83rem",
                  }}
                >
                  {topic.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(topic.path)}
                  style={{
                    marginTop: 10,
                    border: "none",
                    background: "transparent",
                    color: "var(--blue-600)",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 0,
                  }}
                >
                  Open {topic.title}
                  <ArrowRight size={13} />
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

      {terms.length > 0 && (
        <Card
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={17} /> Glossary
            </span>
          }
        >
          <div className="data-list">
            {terms.map((entry) => (
              <div key={entry.term} style={{ padding: "0.6rem 0" }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                  {entry.term}
                </div>
                <div
                  style={{
                    fontSize: "0.84rem",
                    color: "var(--text-secondary)",
                    marginTop: 2,
                  }}
                >
                  {entry.definition}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
