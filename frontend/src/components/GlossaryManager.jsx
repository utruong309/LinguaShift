import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

export default function GlossaryManager() {
  const { token } = useAuth();
  const [glossary, setGlossary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    term: '',
    explanation: '',
    plainLanguage: ''
  });

  const loadGlossary = useCallback(async () => {
    try {
      setLoading(true);
      const org = await apiFetch('/organizations/me', { token });
      setGlossary(org.glossary || []);
    } catch (err) {
      console.error('Failed to load glossary:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    loadGlossary();
  }, [loadGlossary]);

  const handleAdd = async () => {
    if (!form.term.trim() || !form.plainLanguage.trim()) {
      alert('Term and plain language are required');
      return;
    }

    try {
      const org = await apiFetch('/organizations/me', { token });
      await apiFetch(`/organizations/${org._id}/glossary`, {
        method: 'POST',
        token,
        body: form
      });
      
      setForm({ term: '', explanation: '', plainLanguage: '' });
      setShowAddForm(false);
      await loadGlossary();
    } catch (err) {
      console.error('Failed to add term:', err);
      alert('Failed to add term: ' + err.message);
    }
  };

  const handleUpdate = async (term) => {
    try {
      const org = await apiFetch('/organizations/me', { token });
      await apiFetch(`/organizations/${org._id}/glossary/${encodeURIComponent(term.term)}`, {
        method: 'PUT',
        token,
        body: {
          explanation: term.explanation,
          plainLanguage: term.plainLanguage
        }
      });
      
      setEditing(null);
      await loadGlossary();
    } catch (err) {
      console.error('Failed to update term:', err);
      alert('Failed to update term: ' + err.message);
    }
  };

  const handleDelete = async (term) => {
    if (!window.confirm(`Delete "${term}" from glossary?`)) return;

    try {
      const org = await apiFetch('/organizations/me', { token });
      await apiFetch(`/organizations/${org._id}/glossary/${encodeURIComponent(term)}`, {
        method: 'DELETE',
        token
      });
      
      await loadGlossary();
    } catch (err) {
      console.error('Failed to delete term:', err);
      alert('Failed to delete term: ' + err.message);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading glossary...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Organization Glossary</h2>
          <p style={styles.subtitle}>
            Define company-specific terms to help the AI understand your language
          </p>
        </div>
        <button 
          style={styles.addButton}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Term'}
        </button>
      </div>

      {showAddForm && (
        <div style={styles.addForm}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Term/Acronym *</label>
            <input
              style={styles.input}
              placeholder="e.g., QBR, LTV, OKR"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Explanation (optional)</label>
            <textarea
              style={{ ...styles.input, minHeight: '60px' }}
              placeholder="What does this term mean in your organization?"
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Plain Language Version *</label>
            <input
              style={styles.input}
              placeholder="How would you explain this to someone unfamiliar?"
              value={form.plainLanguage}
              onChange={(e) => setForm({ ...form, plainLanguage: e.target.value })}
            />
          </div>
          
          <div style={styles.formActions}>
            <button 
              onClick={handleAdd} 
              style={styles.saveButton}
            >
              Add to Glossary
            </button>
          </div>
        </div>
      )}

      <div style={styles.termsList}>
        {glossary.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📚</div>
            <h3>No terms yet</h3>
            <p>Start building your organization's glossary to improve AI communication</p>
          </div>
        ) : (
          glossary.map((term) => (
            <div key={term.term} style={styles.termCard}>
              {editing === term.term ? (
                <div style={styles.editForm}>
                  <input
                    style={styles.input}
                    value={term.term}
                    disabled
                  />
                  <textarea
                    style={{ ...styles.input, minHeight: '60px' }}
                    placeholder="Explanation"
                    value={term.explanation}
                    onChange={(e) => {
                      const updated = glossary.map(t => 
                        t.term === term.term 
                          ? { ...t, explanation: e.target.value }
                          : t
                      );
                      setGlossary(updated);
                    }}
                  />
                  <input
                    style={styles.input}
                    placeholder="Plain language"
                    value={term.plainLanguage}
                    onChange={(e) => {
                      const updated = glossary.map(t => 
                        t.term === term.term 
                          ? { ...t, plainLanguage: e.target.value }
                          : t
                      );
                      setGlossary(updated);
                    }}
                  />
                  <div style={styles.formActions}>
                    <button 
                      style={styles.saveButton}
                      onClick={() => handleUpdate(term)}
                    >
                      Save
                    </button>
                    <button 
                      style={styles.cancelButton}
                      onClick={() => {
                        setEditing(null);
                        loadGlossary();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.termHeader}>
                    <h3 style={styles.termTitle}>{term.term}</h3>
                    <div style={styles.termActions}>
                      <button
                        style={styles.iconButton}
                        onClick={() => setEditing(term.term)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        style={styles.iconButton}
                        onClick={() => handleDelete(term.term)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {term.explanation && (
                    <p style={styles.explanation}>{term.explanation}</p>
                  )}
                  
                  <div style={styles.plainLanguage}>
                    <strong style={styles.plainLabel}>Plain language:</strong>
                    <span> {term.plainLanguage}</span>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.usageInfo}>
        <h3 style={styles.usageTitle}>💡 How this works</h3>
        <ul style={styles.usageList}>
          <li>When you compose messages, the AI automatically references this glossary</li>
          <li>Jargon detection highlights terms that might confuse your audience</li>
          <li>The AI rewrites suggestions use your preferred plain language</li>
          <li>All organization members benefit from these definitions</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2d3748',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#718096',
    margin: 0,
  },
  addButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    whiteSpace: 'nowrap',
  },
  addForm: {
    background: '#f7fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#2d3748',
    fontFamily: 'inherit',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  saveButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  cancelButton: {
    background: '#e2e8f0',
    color: '#4a5568',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  termsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  termCard: {
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s ease',
  },
  termHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  termTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#667eea',
    margin: 0,
  },
  termActions: {
    display: 'flex',
    gap: '8px',
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'background 0.2s',
  },
  explanation: {
    fontSize: '15px',
    color: '#4a5568',
    marginBottom: '12px',
    lineHeight: '1.6',
  },
  plainLanguage: {
    background: '#f0f4f8',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#2d3748',
  },
  plainLabel: {
    color: '#667eea',
    fontWeight: '600',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#718096',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  usageInfo: {
    background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
    border: '2px solid #f39c12',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '32px',
  },
  usageTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#856404',
    margin: '0 0 12px 0',
  },
  usageList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#856404',
    fontSize: '14px',
    lineHeight: '1.8',
  },
};