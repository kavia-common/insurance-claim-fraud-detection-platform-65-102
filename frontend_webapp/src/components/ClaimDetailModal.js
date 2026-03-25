import React, { useEffect, useMemo, useState } from "react";
import { fetchClaimById, updateOutcome } from "../api/client";
import { Modal, Pill, formatMoney, formatScore, riskTier } from "./ui";

/**
 * PUBLIC_INTERFACE
 * Claim detail modal that fetches claim details from backend and shows fraud score + explanations.
 *
 * Props:
 * - claimId: string|null
 * - isOpen: boolean
 * - onClose: () => void
 * - onUpdated: () => void (after outcome update)
 */
export default function ClaimDetailModal({ claimId, isOpen, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [claim, setClaim] = useState(null);
  const [error, setError] = useState(null);

  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(null);

  const score = useMemo(() => claim?.fraudScore ?? claim?.fraud_score ?? claim?.score, [claim]);
  const tier = useMemo(() => riskTier(score ?? 0), [score]);

  useEffect(() => {
    if (!isOpen || !claimId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setClaim(null);
      setSaveError(null);
      setSaveOk(null);

      try {
        const data = await fetchClaimById(claimId);
        if (cancelled) return;
        setClaim(data);
        setOutcome(data?.outcome || "");
        setNotes(data?.outcomeNotes || data?.notes || "");
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Failed to load claim");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, claimId]);

  const explanations = useMemo(() => {
    const exp = claim?.explanations || claim?.fraudExplanations || claim?.reasons || [];
    if (Array.isArray(exp)) return exp;
    // sometimes backend returns object
    return Object.values(exp || {});
  }, [claim]);

  const signals = useMemo(() => {
    const s = claim?.signals || claim?.fraudSignals || claim?.flags || [];
    if (Array.isArray(s)) return s;
    return Object.values(s || {});
  }, [claim]);

  const safeId = claim?.id || claim?.claim_id || claimId;

  const onSaveOutcome = async () => {
    if (!safeId) return;
    setSavingOutcome(true);
    setSaveError(null);
    setSaveOk(null);
    try {
      await updateOutcome({ id: String(safeId), outcome, notes });
      setSaveOk("Outcome saved.");
      onUpdated?.();
    } catch (e) {
      setSaveError(e?.message || "Failed to update outcome");
    } finally {
      setSavingOutcome(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span>
          Claim details <span className="Mono">{safeId ? `#${safeId}` : ""}</span>
        </span>
      }
      footer={
        <>
          <button className="Btn" onClick={onClose}>
            Close
          </button>
          <button className="Btn BtnPrimary" onClick={onSaveOutcome} disabled={savingOutcome}>
            {savingOutcome ? "Saving…" : "Save outcome"}
          </button>
        </>
      }
    >
      {loading ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div className="Skeleton" style={{ height: 90 }} />
          <div className="Skeleton" style={{ height: 220 }} />
        </div>
      ) : error ? (
        <div className="Toast ToastError">{error}</div>
      ) : !claim ? (
        <div className="Toast">No claim selected.</div>
      ) : (
        <div className="TwoCol">
          <div className="Card" style={{ boxShadow: "none" }}>
            <div className="CardHeader">
              <div>
                <div className="CardTitle">Risk assessment</div>
                <div className="CardSub">Fraud score and key explanations</div>
              </div>
              <Pill variant={tier.variant}>{tier.label} risk</Pill>
            </div>

            <div className="MetricRow">
              <div className="Metric">{formatScore(score)}</div>
              <Pill variant="primary">Score</Pill>
            </div>

            <div className="Divider" />

            <div className="CardTitle" style={{ marginBottom: 6 }}>
              Explanations
            </div>
            {explanations.length ? (
              <ul className="List">
                {explanations.slice(0, 8).map((e, idx) => (
                  <li key={idx} className="QueueItem" style={{ gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <strong style={{ fontSize: 13 }}>{e?.title || e?.rule || e?.name || `Signal ${idx + 1}`}</strong>
                      {e?.weight != null ? <Pill variant="warn">Weight: {String(e.weight)}</Pill> : null}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      {e?.description || e?.message || e?.explanation || String(e)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="Toast">No explanations returned for this claim.</div>
            )}
          </div>

          <div className="Card" style={{ boxShadow: "none" }}>
            <div className="CardHeader">
              <div>
                <div className="CardTitle">Claim & investigation</div>
                <div className="CardSub">Core fields and investigator workflow</div>
              </div>
            </div>

            <dl style={{ margin: 0 }}>
              <div className="KV">
                <dt>Claimant</dt>
                <dd>{claim?.claimant || claim?.claimant_name || "—"}</dd>
              </div>
              <div className="KV">
                <dt>Policy</dt>
                <dd>{claim?.policyId || claim?.policy_id || "—"}</dd>
              </div>
              <div className="KV">
                <dt>Loss date</dt>
                <dd>{claim?.lossDate || claim?.loss_date || claim?.date || "—"}</dd>
              </div>
              <div className="KV">
                <dt>Amount</dt>
                <dd>{formatMoney(claim?.amount || claim?.claim_amount || claim?.loss_amount)}</dd>
              </div>
              <div className="KV">
                <dt>Status</dt>
                <dd>{claim?.status || "—"}</dd>
              </div>
            </dl>

            <div className="Divider" />

            <div className="CardTitle" style={{ marginBottom: 6 }}>
              Signals
            </div>
            {signals.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {signals.slice(0, 16).map((s, idx) => (
                  <Pill key={idx} variant="warn">
                    {s?.code || s?.name || s?.rule || String(s)}
                  </Pill>
                ))}
              </div>
            ) : (
              <div className="Toast">No signals provided.</div>
            )}

            <div className="Divider" />

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select
                  className="Input Select"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  aria-label="Investigation outcome"
                >
                  <option value="">Outcome…</option>
                  <option value="open">Open investigation</option>
                  <option value="review">Needs review</option>
                  <option value="cleared">Cleared (not fraud)</option>
                  <option value="confirmed_fraud">Confirmed fraud</option>
                  <option value="referred">Referred</option>
                </select>
                <button className="Btn BtnDanger BtnSmall" type="button" onClick={() => setOutcome("confirmed_fraud")}>
                  Mark fraud
                </button>
              </div>

              <textarea
                className="Input"
                style={{ width: "100%", minHeight: 90, resize: "vertical" }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Investigator notes…"
                aria-label="Investigator notes"
              />

              {saveError ? <div className="Toast ToastError">{saveError}</div> : null}
              {saveOk ? <div className="Toast ToastSuccess">{saveOk}</div> : null}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
