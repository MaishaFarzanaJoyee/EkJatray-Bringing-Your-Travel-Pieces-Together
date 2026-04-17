import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const base = "/api/budget";

export default function BudgetPage() {
  const { user, token } = useAuth();

  const [tripName, setTripName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [createCollabs, setCreateCollabs] = useState("");

  const [budgetId, setBudgetId] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");

  const [summaryId, setSummaryId] = useState("");
  const [collabBudgetId, setCollabBudgetId] = useState("");
  const [collabEmail, setCollabEmail] = useState("");
  const [collabName, setCollabName] = useState("");

  const [output, setOutput] = useState({ ok: true, data: "Results will appear here." });
  const [historyList, setHistoryList] = useState([]);
  const [historyMessage, setHistoryMessage] = useState("History will appear here.");
  const [paidByList, setPaidByList] = useState([]);
  const [paidByOptions, setPaidByOptions] = useState([]);
  const [pieData, setPieData] = useState({ used: 0, remaining: 0 });

  const pieCanvasRef = useRef(null);
  const budgetTypeTimerRef = useRef(null);

  function getUserLabel() {
    return (user?.name && user.name.trim()) || (user?.email && user.email.trim()) || "User";
  }

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  function isBlank(value) {
    return !value || value.trim() === "";
  }

  async function readResponse(res) {
    const text = await res.text();
    try {
      return { ok: res.ok, data: JSON.parse(text) };
    } catch {
      return { ok: res.ok, data: text };
    }
  }

  function showInputWarning(message) {
    setOutput({ ok: false, data: message });
  }

  function updatePaidByFromCollaborators(collaborators) {
    const names = [getUserLabel()];

    (collaborators || []).forEach((member) => {
      const label = (member?.name && member.name.trim()) || (member?.email && member.email.trim()) || "";
      if (label) {
        names.push(label);
      }
    });

    const uniqueNames = [...new Set(names.map((x) => x.trim()).filter(Boolean))];
    setPaidByOptions(uniqueNames);
    setPaidBy((prev) => {
      if (prev && uniqueNames.includes(prev)) {
        return prev;
      }
      return uniqueNames[0] || "";
    });
  }

  async function refreshPaidByForBudget(nextBudgetId) {
    if (!nextBudgetId || !nextBudgetId.trim()) {
      updatePaidByFromCollaborators([]);
      return;
    }

    const res = await fetch(`${base}/summary/${nextBudgetId.trim()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await readResponse(res);

    if (result.ok) {
      updatePaidByFromCollaborators(result.data.collaborators || []);
    } else {
      updatePaidByFromCollaborators([]);
    }
  }

  async function loadHistory() {
    const res = await fetch(`${base}/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await readResponse(res);

    if (!result.ok || !result.data.history) {
      setHistoryList([]);
      setHistoryMessage("Could not load history.");
      return;
    }

    if (result.data.history.length === 0) {
      setHistoryList([]);
      setHistoryMessage("No budgets found.");
      return;
    }

    setHistoryList(result.data.history);
    setHistoryMessage("");
  }

  async function makeBudget() {
    if (isBlank(tripName) || isBlank(totalBudget)) {
      showInputWarning("Please provide Trip Name and Total Budget");
      return;
    }

    const res = await fetch(`${base}/create`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        tripName: tripName.trim(),
        totalBudget: Number(totalBudget),
        collaborators: createCollabs
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      }),
    });

    const result = await readResponse(res);
    setOutput(result);

    if (result.ok && result.data && result.data.budgetId) {
      setBudgetId(result.data.budgetId);
      setSummaryId(result.data.budgetId);
      setCollabBudgetId(result.data.budgetId);
      setTripName("");
      setTotalBudget("");
      setCreateCollabs("");
      updatePaidByFromCollaborators(result.data.collaborators || []);
      loadHistory();
    }
  }

  async function addCost() {
    if (isBlank(budgetId) || isBlank(expenseTitle) || isBlank(amount)) {
      showInputWarning("Please provide the correct Trip-ID, Expense Title, and Amount");
      return;
    }

    const res = await fetch(`${base}/expense`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        budgetId: budgetId.trim(),
        title: expenseTitle.trim(),
        amount: Number(amount),
        paidBy: paidBy?.trim() || getUserLabel(),
      }),
    });

    const result = await readResponse(res);
    setOutput(result);

    if (result.ok) {
      setExpenseTitle("");
      setAmount("");
      checkSummary();
    }
  }

  async function checkSummary(overrideBudgetId) {
    const targetId = (overrideBudgetId || summaryId || "").trim();

    if (isBlank(targetId)) {
      showInputWarning("Please provide the correct Trip-ID");
      return;
    }

    const res = await fetch(`${base}/summary/${targetId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await readResponse(res);
    setOutput(result);

    if (result.ok) {
      setPieData({
        used: Number(result.data.totalSpent || 0),
        remaining: Number(result.data.remaining || 0),
      });
      setPaidByList(Array.isArray(result.data.paidBy) ? result.data.paidBy : []);
      updatePaidByFromCollaborators(result.data.collaborators || []);
    }
  }

  async function addCollaborator() {
    if (!collabBudgetId.trim() || !collabEmail.trim()) {
      showInputWarning("Please provide Budget ID and collaborator email");
      return;
    }

    const res = await fetch(`${base}/collaborator`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        budgetId: collabBudgetId.trim(),
        email: collabEmail.trim(),
        name: collabName.trim(),
      }),
    });

    const result = await readResponse(res);
    setOutput(result);

    if (result.ok) {
      setCollabEmail("");
      setCollabName("");
      loadHistory();
    }
  }

  async function deleteBudget(id) {
    const ok = window.confirm(`Delete budget ${id}? This will remove all expenses.`);
    if (!ok) {
      return;
    }

    const res = await fetch(`${base}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await readResponse(res);
    setOutput(result);
    loadHistory();
  }

  useEffect(() => {
    updatePaidByFromCollaborators([]);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (budgetTypeTimerRef.current) {
      clearTimeout(budgetTypeTimerRef.current);
    }

    budgetTypeTimerRef.current = setTimeout(() => {
      refreshPaidByForBudget(budgetId);
    }, 450);

    return () => {
      if (budgetTypeTimerRef.current) {
        clearTimeout(budgetTypeTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetId]);

  useEffect(() => {
    const canvas = pieCanvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const used = Number(pieData.used || 0);
    const remaining = Number(pieData.remaining || 0);
    const total = used + remaining;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (total <= 0) {
      ctx.fillStyle = "#9aa4b2";
      ctx.beginPath();
      ctx.arc(120, 120, 90, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const usedAngle = (used / total) * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(120, 120);
    ctx.fillStyle = "#d97706";
    ctx.arc(120, 120, 90, 0, usedAngle);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(120, 120);
    ctx.fillStyle = "#16a34a";
    ctx.arc(120, 120, 90, usedAngle, Math.PI * 2);
    ctx.fill();
  }, [pieData]);

  const outputData = output.data;

  function renderOutput() {
    if (typeof outputData === "string") {
      return <p>{outputData}</p>;
    }

    if (!outputData || typeof outputData !== "object") {
      return <p>No data found.</p>;
    }

    if (outputData.message === "Budget created successfully") {
      return (
        <>
          <h4>Budget Created</h4>
          <div className="result-grid">
            <div className="result-item">
              <span>Simple Budget ID</span>
              <strong>{outputData.budgetId}</strong>
            </div>
            <div className="result-item">
              <span>Trip Name</span>
              <strong>{outputData.tripName}</strong>
            </div>
            <div className="result-item">
              <span>Total Budget</span>
              <strong>{outputData.totalBudget}</strong>
            </div>
          </div>
        </>
      );
    }

    if (outputData.message === "Expense added successfully") {
      return (
        <>
          <h4>Expense Added</h4>
          <div className="result-grid">
            <div className="result-item">
              <span>Budget ID</span>
              <strong>{outputData.budgetId}</strong>
            </div>
            <div className="result-item">
              <span>Title</span>
              <strong>{outputData.title}</strong>
            </div>
            <div className="result-item">
              <span>Remaining</span>
              <strong>{outputData.remaining}</strong>
            </div>
          </div>
        </>
      );
    }

    if (outputData.message) {
      return (
        <>
          <h4>{output.ok ? "Message" : "Error"}</h4>
          <p>{outputData.message}</p>
        </>
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(outputData, "totalBudget")
      && Object.prototype.hasOwnProperty.call(outputData, "totalSpent")
      && Object.prototype.hasOwnProperty.call(outputData, "remaining")
    ) {
      return (
        <>
          <h4>Budget Summary</h4>
          <div className="result-grid">
            <div className="result-item">
              <span>Budget ID</span>
              <strong>{outputData.budgetId || "N/A"}</strong>
            </div>
            <div className="result-item">
              <span>Total Budget</span>
              <strong>{outputData.totalBudget}</strong>
            </div>
            <div className="result-item">
              <span>Total Spent</span>
              <strong>{outputData.totalSpent}</strong>
            </div>
            <div className="result-item">
              <span>Remaining</span>
              <strong>{outputData.remaining}</strong>
            </div>
          </div>
        </>
      );
    }

    return <pre>{JSON.stringify(outputData, null, 2)}</pre>;
  }

  const total = (pieData.used || 0) + (pieData.remaining || 0);
  const usedPercent = total > 0 ? ((pieData.used / total) * 100).toFixed(1) : "0.0";
  const remainingPercent = total > 0 ? ((pieData.remaining / total) * 100).toFixed(1) : "0.0";

  return (
    <main>
      <section className="section">
        <div className="section-title compact">
          <p className="sub-title">Budget manager</p>
          <h2>Keep trip spending visible while you plan.</h2>
        </div>

        <div className="card-grid">
          <article className="card">
            <h3>Create Budget</h3>
            <input value={tripName} onChange={(event) => setTripName(event.target.value)} placeholder="Trip Name" />
            <input value={totalBudget} onChange={(event) => setTotalBudget(event.target.value)} placeholder="Total Budget" />
            <input
              value={createCollabs}
              onChange={(event) => setCreateCollabs(event.target.value)}
              placeholder="Collaborator emails (comma separated)"
            />
            <button className="button-main" onClick={makeBudget}>Create</button>
          </article>

          <article className="card">
            <h3>Add Expense</h3>
            <input value={budgetId} onChange={(event) => setBudgetId(event.target.value)} placeholder="Budget ID" />
            <input value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} placeholder="Expense Title" />
            <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" />
            <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)} aria-label="Paid By">
              <option value="">Select payer</option>
              {paidByOptions.map((name) => (
                <option value={name} key={name}>{name}</option>
              ))}
            </select>
            <button className="button-main" onClick={addCost}>Add</button>
          </article>

          <article className="card">
            <h3>Get Summary</h3>
            <input value={summaryId} onChange={(event) => setSummaryId(event.target.value)} placeholder="Budget ID" />
            <button className="button-main" onClick={checkSummary}>Show Summary</button>

            <h3>Add Collaborator</h3>
            <input value={collabBudgetId} onChange={(event) => setCollabBudgetId(event.target.value)} placeholder="Budget ID" />
            <input value={collabEmail} onChange={(event) => setCollabEmail(event.target.value)} placeholder="Collaborator Email" />
            <input value={collabName} onChange={(event) => setCollabName(event.target.value)} placeholder="Collaborator Name (optional)" />
            <button className="button-main" onClick={addCollaborator}>Add & Send Invite</button>
          </article>
        </div>

        <div className="section">
          <div className={output.ok ? "result-box" : "result-box result-error"}>
            {renderOutput()}
          </div>
        </div>

        <div className="card-grid">
          <article className="card">
            <h3>Budget tracking</h3>
            <p>Create a trip budget, add expenses, and see what remains at a glance.</p>
          </article>
          <article className="card">
            <h3>Group-friendly planning</h3>
            <p>Build trips with shared members so the financial side stays transparent.</p>
          </article>
          <article className="card">
            <h3>Simple trip workflow</h3>
            <p>Move from planning to execution without losing context across different pages.</p>
          </article>
        </div>

        <div className="card-grid">
          <article className="card">
            <h3>Used vs Remaining</h3>
            <canvas ref={pieCanvasRef} width="240" height="240" aria-label="Budget usage chart" />
            <div className="pie-legend">
              {total <= 0 ? (
                <div className="legend-row">
                  <span className="legend-color legend-empty"></span>
                  <span>No expenses yet</span>
                </div>
              ) : (
                <>
                  <div className="legend-row">
                    <span className="legend-color legend-used"></span>
                    <span>Used: {pieData.used} ({usedPercent}%)</span>
                  </div>
                  <div className="legend-row">
                    <span className="legend-color legend-remaining"></span>
                    <span>Remaining: {pieData.remaining} ({remainingPercent}%)</span>
                  </div>
                </>
              )}
            </div>
          </article>

          <article className="card">
            <h3>Paid By Collaborators</h3>
            <div className="result-box">
              {paidByList.length === 0 ? (
                <p>No data yet.</p>
              ) : (
                paidByList.map((item) => (
                  <p key={item.name}><strong>{item.name}:</strong> {item.amount}</p>
                ))
              )}
            </div>
          </article>

          <article className="card">
            <h3>Previous Travel Budgets</h3>
            <button className="button-main" onClick={loadHistory}>Load History</button>
            <div className="result-box">
              {historyList.length === 0 ? (
                <p>{historyMessage}</p>
              ) : (
                historyList.map((item) => (
                  <div className="result-item" key={item.budgetId}>
                    <p><strong>{item.tripName}</strong> ({item.budgetId})</p>
                    <p>Total: {item.totalBudget} | Used: {item.totalSpent} | Left: {item.remaining}</p>
                    <p>Collaborators: {item.collaborators.map((x) => x.email).join(", ") || "None"}</p>
                    <button
                      className="button-main"
                      onClick={() => {
                        setSummaryId(item.budgetId);
                        checkSummary(item.budgetId);
                      }}
                    >
                      Open
                    </button>
                    {item.isOwner && (
                      <button className="button-light" onClick={() => deleteBudget(item.budgetId)}>
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
