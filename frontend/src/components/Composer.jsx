import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import "./Composer.css";

function JargonHighlight() {
  return {
    name: "jargonHighlight",
    addProseMirrorPlugins() {
      return [
        new this.editor.view.Plugin({
          props: {
            decorations: (state) => {
              const spans = state.tr.getMeta("jargonSpans") || state.storedMarks?.jargonSpans || [];
              const { Decoration, DecorationSet } = this.editor.view;
              const decos = spans.map(s => 
                Decoration.inline(s.start, s.end, { 
                  class: "jargon-highlight",
                  title: s.suggestion || "Potential jargon detected"
                })
              );
              return DecorationSet.create(state.doc, decos);
            }
          }
        })
      ];
    }
  };
}

export default function Composer({ onSend }) {
  const { token } = useAuth();
  const [rewritten, setRewritten] = useState("");
  const [audience, setAudience] = useState("PMs");
  const [tone, setTone] = useState("Neutral");
  const [banner, setBanner] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [glossary, setGlossary] = useState([]);
  const [jargonSpans, setJargonSpans] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit.configure({ 
      code: false, 
      bold: true, 
      italic: true,
      heading: false,
      blockquote: false,
      horizontalRule: false,
      hardBreak: true,
      history: true,
    }), JargonHighlight()],
    content: "",
    editorProps: {
      attributes: {
        class: "composer-editor-content",
      },
    },
  });

  // Load organization glossary
  useEffect(() => {
    const loadGlossary = async () => {
      try {
        const org = await apiFetch('/organizations/me', { token });
        setGlossary(org.glossary || []);
      } catch (err) {
        console.error('Failed to load glossary:', err);
      }
    };
    if (token) loadGlossary();
  }, [token]);

  // Real-time jargon detection with debouncing
  useEffect(() => {
    if (!editor) return;
    
    const handler = setTimeout(async () => {
      const text = editor.getText();
      if (!text.trim()) {
        setBanner("");
        setJargonSpans([]);
        editor.view.dispatch(editor.state.tr.setMeta("jargonSpans", []));
        return;
      }

      try {
        setIsDetecting(true);
        const { jargon_spans, jargon_score } = await apiFetch("/ml/detect-jargon", { 
          method: "POST", 
          token, 
          body: { text, glossary }
        });
        
        // Update jargon spans in state
        setJargonSpans(jargon_spans || []);
        
        // Update editor decorations
        editor.view.dispatch(editor.state.tr.setMeta("jargonSpans", jargon_spans || []));
        
        // Show banner based on jargon score
        if (jargon_score > 0.5) {
          setBanner(`⚠️ Heavy jargon detected (${(jargon_score * 100).toFixed(0)}%) - Consider simplifying for ${audience}`);
        } else if (jargon_score > 0.2) {
          setBanner(`💡 Some jargon detected (${(jargon_score * 100).toFixed(0)}%) - Message may need clarification`);
        } else if (jargon_spans.length > 0) {
          setBanner(`✓ Minor jargon detected - Message is mostly clear`);
        } else {
          setBanner("");
        }
      } catch (err) {
        console.error("Jargon detection error:", err);
        // Don't show error to user, just log it
      } finally {
        setIsDetecting(false);
      }
    }, 500); // Increased debounce time for better UX
    
    return () => clearTimeout(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, token, glossary, audience, editor?.getText()]);

  const send = async () => {
    const text = editor.getText();
    if (!text.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSend({
        textOriginal: text,
        textSimplified: rewritten || undefined,
        usedSimplified: !!rewritten,
        audience,
        tone,
        jargonScore: jargonSpans.length > 0 ? jargonSpans.reduce((sum, s) => sum + (s.confidence || 0), 0) / jargonSpans.length : 0,
        jargonSpans: jargonSpans
      });
      editor.commands.clearContent();
      setRewritten("");
      setBanner("");
      setJargonSpans([]);
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const rewrite = async () => {
    const text = editor.getText();
    if (!text.trim()) return;
    try {
      const { rewrittenText } = await apiFetch("/ml/rewrite", { 
        method: "POST", 
        token, 
        body: { text, audience, tone, glossary }
      });
      setRewritten(rewrittenText);
    } catch (err) {
      console.error("Rewrite error:", err);
      alert("Failed to rewrite message. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!editor) return null;

  return (
    <div className="composer">
      {banner && (
        <div className={`composer-banner ${banner.includes('Heavy') ? 'warning' : banner.includes('Some') ? 'info' : 'success'}`}>
          {banner}
          {jargonSpans.length > 0 && (
            <button 
              onClick={rewrite}
              style={{
                marginLeft: '12px',
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: 'inherit',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ✨ Auto-fix
            </button>
          )}
        </div>
      )}
      
      <div className="composer-toolbar">
        <select 
          value={audience} 
          onChange={e => setAudience(e.target.value)}
          title="Target audience"
        >
          <option>PMs</option>
          <option>Execs</option>
          <option>Sales</option>
          <option>Non-technical stakeholders</option>
          <option>Engineering</option>
          <option>Marketing</option>
        </select>
        <select 
          value={tone} 
          onChange={e => setTone(e.target.value)}
          title="Tone"
        >
          <option>Neutral</option>
          <option>Friendly</option>
          <option>Formal</option>
          <option>Very concise</option>
          <option>Detailed</option>
        </select>
        <button onClick={rewrite} title="Rewrite message" disabled={!editor.getText().trim()}>
          ✨ Rewrite
        </button>
        {isDetecting && (
          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
            Analyzing...
          </span>
        )}
      </div>

      {/* Jargon details panel - shows when jargon is detected */}
      {jargonSpans.length > 0 && (
        <div className="jargon-details">
          <strong>Detected terms:</strong>
          <div className="jargon-terms">
            {jargonSpans.map((span, idx) => (
              <div key={idx} className="jargon-term-item">
                <span className="jargon-term">{span.term}</span>
                {span.suggestion && (
                  <span className="jargon-suggestion">→ {span.suggestion}</span>
                )}
                {span.from_glossary && (
                  <span className="glossary-badge">📚 In glossary</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="composer-editor-wrapper">
        <EditorContent 
          editor={editor} 
          onKeyDown={handleKeyDown}
        />
      </div>

      {rewritten && (
        <div className="rewrite-panel">
          <div className="rewrite-panel-section">
            <strong>Original</strong>
            <div>{editor.getText()}</div>
          </div>
          <div className="rewrite-panel-section">
            <strong>Simplified version</strong>
            <div>{rewritten}</div>
          </div>
          <button onClick={() => {
            editor.commands.setContent(rewritten);
            setRewritten("");
          }}>
            Use simplified version
          </button>
        </div>
      )}

      <div className="composer-actions">
        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
          Press Enter to send, Shift+Enter for new line
        </div>
        <button 
          className="composer-send-btn" 
          onClick={send}
          disabled={isSending || !editor.getText().trim()}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}