import React, { useState } from "react";
import "./App.css";

const SECTION_CONFIG = [
  {
    key: "issues",
    label: "Issues Found",
    pattern: /\*\*Issues Found:\*\*([\s\S]*?)(?=\*\*Improvements:|$)/i,
    icon: "⚠️",
    colorClass: "card-issues",
  },
  {
    key: "improvements",
    label: "Improvements",
    pattern: /\*\*Improvements:\*\*([\s\S]*?)(?=\*\*Best Practices:|$)/i,
    icon: "💡",
    colorClass: "card-improvements",
  },
  {
    key: "bestPractices",
    label: "Best Practices",
    pattern: /\*\*Best Practices:\*\*([\s\S]*?)$/i,
    icon: "✅",
    colorClass: "card-best-practices",
  },
];

function parseReview(reviewText) {
  const sections = {};
  SECTION_CONFIG.forEach(({ key, pattern }) => {
    const match = reviewText.match(pattern);
    sections[key] = match ? match[1].trim() : "";
  });
  return sections;
}

// function ReviewCard({ icon, label, content, colorClass }) {
//   const lines = content
//     .split("\n")
//     .map((l) => l.trim())
//     .filter(Boolean);

//   return (
//     <div className={`review-card ${colorClass}`}>
//       <div className="card-header">
//         <span className="card-icon">{icon}</span>
//         <h3 className="card-title">{label}</h3>
//       </div>
//       <div className="card-body">
//         {lines.length === 0 ? (
//           <p className="card-empty">No items found.</p>
//         ) : (
//           <ul className="card-list">
//             {lines.map((line, i) => (
//               <li key={i} className="card-list-item">
//                 {line.replace(/^[-*•]\s*/, "")}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }

// function ReviewCard({ icon, label, content, colorClass }) {
//   const lines = content
//     .split("\n")
//     .map((l) => l.trim())
//     .filter(Boolean);

//   let inCodeBlock = false;
//   const items = [];

//   lines.forEach((line, index) => {
//     if (line.startsWith("```")) {
//       inCodeBlock = !inCodeBlock;
//       return;
//     }

//     if (inCodeBlock) {
//       items.push(
//         <pre key={index} className="code-block">
//           <code>{line}</code>
//         </pre>
//       );
//     } else {
//       items.push(
//         <li key={index} className="card-list-item">
//           {
//             line
//               .replace(/^[-*•]\s*/, "")
//               .replace(/\*/g, "").trim()
//           }
//         </li>
//       );
//     }
//   });

//   return (
//     <div className={`review-card ${colorClass}`}>
//       <div className="card-header">
//         <span className="card-icon">{icon}</span>
//         <h3 className="card-title">{label}</h3>
//       </div>

//       <div className="card-body">
//         {items.length === 0 ? (
//           <p className="card-empty">No items found.</p>
//         ) : (
//           <ul className="card-list">{items}</ul>
//         )}
//       </div>
//     </div>
//   );
// }

function ReviewCard({ icon, label, content, colorClass }) {
  const lines = content
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);

  let inCodeBlock = false;
  let codeBuffer = [];
  const items = [];

  const cleanLine = (text) =>
    text.replace(/^[-•]\s*/, "").replace(/\*/g, "").trim();

  const flushCodeBlock = (key) => {
    if (codeBuffer.length > 0) {
      items.push(
        <pre key={key} className="code-block">
          <code>{codeBuffer.join("\n")}</code>
        </pre>
      );
      codeBuffer = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock(index);
      }
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
    } else {
      items.push(
        <li key={index} className="card-list-item">
          {cleanLine(line)}
        </li>
      );
    }
  });

  flushCodeBlock("last");

  return (
    <div className={`review-card ${colorClass}`}>
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h3 className="card-title">{label}</h3>
      </div>

      <div className="card-body">
        {items.length === 0 ? (
          <p className="card-empty">No items found.</p>
        ) : (
          <ul className="card-list">{items}</ul>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [code, setCode] = useState("");
  const [review, setReview] = useState(null);
  const [rawReview, setRawReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReview = async () => {
    if (!code.trim()) {
      setError("Please paste some code before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setReview(null);
    setRawReview("");

    try {
      const response = await fetch(`${API}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Server returned an error.");
      }

      setRawReview(data.review);
      setReview(parseReview(data.review));
    } catch (err) {
      setError(err.message || "Failed to connect to the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setReview(null);
    setRawReview("");
    setError("");
    setLoading(false);
  };

  const hasParsedSections =
    review &&
    SECTION_CONFIG.some(({ key }) => review[key] && review[key].length > 0);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-icon">{"</>"}</span>
          </div>
          <div className="header-text">
            <h1 className="header-title">AI Code Reviewer</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="app-main">
        {/* Input section */}
        <section className="input-section">
          <div className="input-header">
            <label className="input-label" htmlFor="code-input">
              Paste your code below
            </label>
            <div className="input-actions">
              <button
                className="btn btn-clear"
                onClick={handleClear}
                disabled={loading}
                title="Clear everything"
              >
                Clear
              </button>
              <button
                className="btn btn-review"
                onClick={handleReview}
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner" />
                    Reviewing…
                  </span>
                ) : (
                  "Review Code"
                )}
              </button>
            </div>
          </div>

          <textarea
            id="code-input"
            className="code-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`// Paste any code here, e.g.:\nfunction greet(name) {\n  console.log("Hello " + name)\n}`}
            spellCheck={false}
            disabled={loading}
          />

          <div className="input-meta">
            <span className="char-count">{code.length} characters</span>
            <span className="lang-hint">Any language accepted</span>
          </div>
        </section>

        {/* Error message */}
        {error && (
          <div className="error-banner" role="alert">
            <span className="error-icon">⛔</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <section className="results-section">
            <div className="results-header">
              <h2 className="results-title">Analyzing your code…</h2>
            </div>
            <div className="skeleton-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-card">
                  <div className="skeleton-bar wide" />
                  <div className="skeleton-bar" />
                  <div className="skeleton-bar medium" />
                  <div className="skeleton-bar" />
                  <div className="skeleton-bar short" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results */}
        {review && !loading && (
          <section className="results-section">
            <div className="results-header">
              <h2 className="results-title">Review Complete</h2>
            </div>

            {hasParsedSections ? (
              <div className="cards-grid">
                {SECTION_CONFIG.map(({ key, label, icon, colorClass }) => (
                  <ReviewCard
                    key={key}
                    icon={icon}
                    label={label}
                    content={review[key]}
                    colorClass={colorClass}
                  />
                ))}
              </div>
            ) : (
              // Fallback: show raw text if parsing fails
              <div className="raw-review">
                <pre>{rawReview}</pre>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>Built with Spring Boot · React </p>
      </footer>
    </div>
  );
}
