import React, { useEffect, useState } from "react";
import { fetchHighRiskQueue } from "../api/client";
import { Pill, formatMoney, formatScore, riskTier } from "../components/ui";
import ClaimDetailModal from "../components/ClaimDetailModal";

/**
 * PUBLIC_INTERFACE
 * Investigator queue view focusing on high-risk claims.
 */
export default function QueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHighRiskQueue();
      setQueue(Array.isArray(data) ? data : data?.queue || data?.claims || []);
    } catch (e) {
      setError(e?.message || "Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openClaim = (id) => {
    setSelectedClaimId(String(id));
    setDetailOpen(true);
  };

  return (
    <div>
      <div className="PageHeader">
        <div className="PageTitle">
          <h1>High-risk queue</h1>
          <p>Prioritized claims awaiting SIU review.</p>
        </div>
        <div className="HeaderActions">
          <button className="Btn" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error ? <div className="Toast ToastError">{error}</div> : null}

      <div className="TableWrap">
        <table className="Table" aria-label="High-risk queue table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Claimant</th>
              <th>Amount</th>
              <th>Fraud score</th>
              <th>Risk</th>
              <th>Status</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx}>
                  <td colSpan={7}>
                    <div className="Skeleton" style={{ height: 28 }} />
                  </td>
                </tr>
              ))
            ) : queue.length ? (
              queue.slice(0, 200).map((c, idx) => {
                const id = c?.id || c?.claim_id || c?.claimId || `row-${idx}`;
                const score = c?.fraudScore ?? c?.fraud_score ?? c?.score ?? 0;
                const tier = riskTier(score);
                const amount = c?.amount || c?.claim_amount || c?.loss_amount;
                return (
                  <tr key={String(id)} className="TrHover">
                    <td className="Mono">{id}</td>
                    <td>{c?.claimant || c?.claimant_name || "—"}</td>
                    <td>{formatMoney(amount)}</td>
                    <td>{formatScore(score)}</td>
                    <td>
                      <Pill variant={tier.variant}>{tier.label}</Pill>
                    </td>
                    <td>{c?.status || "—"}</td>
                    <td>
                      <button className="Btn BtnSmall BtnPrimary" onClick={() => openClaim(id)}>
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ color: "var(--muted)" }}>
                  Queue is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ClaimDetailModal claimId={selectedClaimId} isOpen={detailOpen} onClose={() => setDetailOpen(false)} onUpdated={load} />
    </div>
  );
}
