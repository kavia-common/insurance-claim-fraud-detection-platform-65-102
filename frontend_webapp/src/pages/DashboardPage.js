import React, { useEffect, useMemo, useState } from "react";
import { fetchClaims, fetchHighRiskQueue } from "../api/client";
import { Pill, formatMoney, formatScore, riskTier } from "../components/ui";
import UploadCsvModal from "../components/UploadCsvModal";
import ClaimDetailModal from "../components/ClaimDetailModal";

/**
 * PUBLIC_INTERFACE
 * Main dashboard page: summary cards + claims table + high-risk queue + CSV upload.
 */
export default function DashboardPage() {
  const [claims, setClaims] = useState([]);
  const [queue, setQueue] = useState([]);

  const [loadingClaims, setLoadingClaims] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const [errorClaims, setErrorClaims] = useState(null);
  const [errorQueue, setErrorQueue] = useState(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [minRisk, setMinRisk] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadClaims = async () => {
    setLoadingClaims(true);
    setErrorClaims(null);
    try {
      const minFraudScore = minRisk ? Number(minRisk) : undefined;
      const data = await fetchClaims({ q: q.trim() || undefined, status: status || undefined, minFraudScore });
      setClaims(Array.isArray(data) ? data : data?.claims || []);
    } catch (e) {
      setErrorClaims(e?.message || "Failed to load claims");
    } finally {
      setLoadingClaims(false);
    }
  };

  const loadQueue = async () => {
    setLoadingQueue(true);
    setErrorQueue(null);
    try {
      const data = await fetchHighRiskQueue();
      setQueue(Array.isArray(data) ? data : data?.queue || data?.claims || []);
    } catch (e) {
      setErrorQueue(e?.message || "Failed to load high-risk queue");
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    loadClaims();
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClaims = useMemo(() => {
    // If backend doesn't support filtering params, still filter client-side.
    const text = q.trim().toLowerCase();
    const min = minRisk ? Number(minRisk) : null;

    return (claims || []).filter((c) => {
      const id = String(c?.id || c?.claim_id || "");
      const claimant = String(c?.claimant || c?.claimant_name || "");
      const hay = `${id} ${claimant}`.toLowerCase();
      if (text && !hay.includes(text)) return false;

      const st = String(c?.status || "");
      if (status && st !== status) return false;

      if (min !== null && !Number.isNaN(min)) {
        const score = c?.fraud?.score ?? c?.fraudScore ?? c?.fraud_score ?? c?.score ?? 0;
        const pct = Number(score) <= 1 ? Number(score) * 100 : Number(score);
        if (pct < min) return false;
      }
      return true;
    });
  }, [claims, q, status, minRisk]);

  const summary = useMemo(() => {
    const total = claims.length;
    const avg =
      total === 0
        ? 0
        : claims.reduce((acc, c) => {
            const s = c?.fraud?.score ?? c?.fraudScore ?? c?.fraud_score ?? c?.score ?? 0;
            const pct = Number(s) <= 1 ? Number(s) * 100 : Number(s);
            return acc + (Number.isFinite(pct) ? pct : 0);
          }, 0) / total;

    const high = claims.filter((c) => {
      const s = c?.fraud?.score ?? c?.fraudScore ?? c?.fraud_score ?? c?.score ?? 0;
      const pct = Number(s) <= 1 ? Number(s) * 100 : Number(s);
      return pct >= 80;
    }).length;

    const open = claims.filter((c) => String(c?.status || "").toLowerCase() === "open").length;

    const amountSum = claims.reduce((acc, c) => {
      const a = c?.amount || c?.claim_amount || c?.loss_amount || 0;
      const n = Number(a);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);

    return { total, avg, high, open, amountSum };
  }, [claims]);

  const openClaim = (id) => {
    setSelectedClaimId(String(id));
    setDetailOpen(true);
  };

  return (
    <div>
      <div className="PageHeader">
        <div className="PageTitle">
          <h1>Fraud Detection Dashboard</h1>
          <p>Prioritize suspicious claims, review signals, and manage investigation outcomes.</p>
        </div>
        <div className="HeaderActions">
          <button className="Btn" onClick={() => loadClaims()} disabled={loadingClaims}>
            {loadingClaims ? "Refreshing…" : "Refresh"}
          </button>
          <button className="Btn BtnPrimary" onClick={() => setUploadOpen(true)}>
            Upload CSV
          </button>
        </div>
      </div>

      <div className="SummaryGrid">
        <div className="Card">
          <div className="CardHeader">
            <div>
              <div className="CardTitle">Claims ingested</div>
              <div className="CardSub">Total available</div>
            </div>
            <Pill variant="primary">Portfolio</Pill>
          </div>
          <div className="Metric">{summary.total}</div>
        </div>

        <div className="Card">
          <div className="CardHeader">
            <div>
              <div className="CardTitle">Avg. fraud score</div>
              <div className="CardSub">Across all claims</div>
            </div>
            <Pill>Baseline</Pill>
          </div>
          <div className="Metric">{formatScore(summary.avg)}</div>
        </div>

        <div className="Card">
          <div className="CardHeader">
            <div>
              <div className="CardTitle">High-risk</div>
              <div className="CardSub">Score ≥ 80%</div>
            </div>
            <Pill variant="danger">Priority</Pill>
          </div>
          <div className="Metric">{summary.high}</div>
        </div>

        <div className="Card">
          <div className="CardHeader">
            <div>
              <div className="CardTitle">Exposure</div>
              <div className="CardSub">Total claim amounts</div>
            </div>
            <Pill variant="warn">Financial</Pill>
          </div>
          <div className="Metric">{formatMoney(summary.amountSum)}</div>
        </div>
      </div>

      <div className="Grid2">
        <div>
          <div className="Card" style={{ marginBottom: 12 }}>
            <div className="CardHeader">
              <div>
                <div className="CardTitle">Claims</div>
                <div className="CardSub">Search, filter, and open a claim to view explanations</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  className="Input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by claim id / claimant…"
                  aria-label="Search claims"
                />
                <select className="Input Select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="review">Review</option>
                  <option value="closed">Closed</option>
                </select>
                <select className="Input Select" value={minRisk} onChange={(e) => setMinRisk(e.target.value)}>
                  <option value="">Any risk</option>
                  <option value="50">≥ 50%</option>
                  <option value="80">≥ 80%</option>
                </select>
                <button className="Btn BtnSmall" onClick={loadClaims} disabled={loadingClaims}>
                  Apply
                </button>
              </div>
            </div>

            {errorClaims ? <div className="Toast ToastError">{errorClaims}</div> : null}

            <div className="TableWrap">
              <table className="Table" aria-label="Claims table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Claimant</th>
                    <th>Loss date</th>
                    <th>Amount</th>
                    <th>Fraud score</th>
                    <th>Risk</th>
                    <th>Status</th>
                    <th style={{ width: 200 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingClaims ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx}>
                        <td colSpan={8}>
                          <div className="Skeleton" style={{ height: 28 }} />
                        </td>
                      </tr>
                    ))
                  ) : filteredClaims.length ? (
                    filteredClaims.slice(0, 200).map((c) => {
                      const id = c?.id || c?.claim_id || c?.claimId;
                      const claimant = c?.claimant || c?.claimant_name || "—";
                      const lossDate = c?.lossDate || c?.loss_date || c?.date || "—";
                      const amount = c?.amount || c?.claim_amount || c?.loss_amount;
                      const score = c?.fraud?.score ?? c?.fraudScore ?? c?.fraud_score ?? c?.score ?? 0;
                      const tier = riskTier(score);

                      return (
                        <tr key={String(id)} className="TrHover">
                          <td className="Mono">{id ?? "—"}</td>
                          <td>{claimant}</td>
                          <td>{lossDate}</td>
                          <td>{formatMoney(amount)}</td>
                          <td>{formatScore(score)}</td>
                          <td>
                            <Pill variant={tier.variant}>{tier.label}</Pill>
                          </td>
                          <td>{c?.status || "—"}</td>
                          <td>
                            <div className="RowActions">
                              <button className="Btn BtnSmall BtnPrimary" onClick={() => openClaim(id)}>
                                Open
                              </button>
                              <button
                                className="Btn BtnSmall"
                                onClick={() => navigator.clipboard?.writeText?.(String(id))}
                              >
                                Copy ID
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ color: "var(--muted)" }}>
                        No claims found. Upload a CSV to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="Card">
            <div className="CardHeader">
              <div>
                <div className="CardTitle">High-risk queue</div>
                <div className="CardSub">Top prioritized claims for SIU review</div>
              </div>
              <button className="Btn BtnSmall" onClick={loadQueue} disabled={loadingQueue}>
                {loadingQueue ? "Loading…" : "Refresh"}
              </button>
            </div>

            {errorQueue ? <div className="Toast ToastError">{errorQueue}</div> : null}

            <div className="QueueList">
              {loadingQueue ? (
                Array.from({ length: 5 }).map((_, idx) => <div key={idx} className="Skeleton" style={{ height: 74 }} />)
              ) : queue.length ? (
                queue.slice(0, 10).map((c, idx) => {
                  const id = c?.id || c?.claim_id || c?.claimId || `row-${idx}`;
                  const score = c?.fraud?.score ?? c?.fraudScore ?? c?.fraud_score ?? c?.score ?? 0;
                  const tier = riskTier(score);
                  const amount = c?.amount || c?.claim_amount || c?.loss_amount;
                  return (
                    <div key={String(id)} className="QueueItem">
                      <div className="QueueTop">
                        <div className="QueueMeta">
                          <strong className="Mono">{id}</strong>
                          <span>{c?.claimant || c?.claimant_name || "Claimant —"}</span>
                        </div>
                        <Pill variant={tier.variant}>{formatScore(score)}</Pill>
                      </div>
                      <div className="QueueBottom">
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>Amount: {formatMoney(amount)}</span>
                        <button className="Btn BtnSmall BtnPrimary" onClick={() => openClaim(id)}>
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="Toast">Queue is empty. Once scored, high-risk claims will appear here.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UploadCsvModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          // Refresh both panels after upload
          loadClaims();
          loadQueue();
        }}
      />

      <ClaimDetailModal
        claimId={selectedClaimId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={() => {
          loadClaims();
          loadQueue();
        }}
      />
    </div>
  );
}
