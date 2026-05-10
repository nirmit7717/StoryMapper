/**
 * StoryMapper — Main Application
 * 
 * Routes between ProjectManager (landing) and Editor (canvas + panel).
 */

import { ReactFlowProvider } from '@xyflow/react';
import { StoryCanvas } from './components/canvas/StoryCanvas';
import { ScriptPanel } from './components/panels/ScriptPanel';
import { ProjectManager } from './components/panels/ProjectManager';
import { useStoryStore } from './store/useStoryStore';
import { useUIStore } from './store/useUIStore';
import { validateProject } from './lib/graphValidator';
import { useCallback, useEffect } from 'react';

import './styles/index.css';
import './styles/nodes.css';
import './styles/editor.css';

export default function App() {
  const currentView = useUIStore((s) => s.currentView);

  if (currentView === 'project-manager') {
    return <ProjectManager />;
  }

  return (
    <ReactFlowProvider>
      <EditorView />
    </ReactFlowProvider>
  );
}

/** The main editor view with canvas, script panel, and header */
function EditorView() {
  const project = useStoryStore((s) => s.project);
  const isDirty = useStoryStore((s) => s.isDirty);

  const validationStatus = useUIStore((s) => s.validationStatus);
  const validationMessage = useUIStore((s) => s.validationMessage);
  const showValidationBar = useUIStore((s) => s.showValidationBar);
  const setValidation = useUIStore((s) => s.setValidation);
  const editingNodeId = useUIStore((s) => s.editingNodeId);
  const closeNodeEditor = useUIStore((s) => s.closeNodeEditor);
  const setView = useUIStore((s) => s.setView);
  const saveProjectToList = useUIStore((s) => s.saveProjectToList);

  // Escape key closes the script panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingNodeId) {
        closeNodeEditor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingNodeId, closeNodeEditor]);

  const handleValidate = useCallback(() => {
    const result = validateProject(project);
    if (result.isValid && result.warnings.length === 0) {
      setValidation('ok', `✓ All paths valid (${Object.keys(project.graphs).length} graph(s))`);
    } else if (result.isValid) {
      setValidation('warn', `⚠ ${result.warnings.length} warning(s): ${result.warnings[0]?.message || ''}`);
    } else {
      setValidation('error', `✕ ${result.errors.length} error(s): ${result.errors[0]?.message || ''}`);
    }
  }, [project, setValidation]);

  const handleSave = useCallback(() => {
    // Save to localStorage project list
    const json = JSON.stringify(project);
    saveProjectToList({
      id: project.id,
      title: project.title,
      updatedAt: project.updatedAt,
      data: json,
    });
    setValidation('ok', 'Project saved');

    // Also offer download
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}.storymapper.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [project, saveProjectToList, setValidation]);

  const handleBackToProjects = useCallback(() => {
    // Auto-save before leaving
    const json = JSON.stringify(project);
    saveProjectToList({
      id: project.id,
      title: project.title,
      updatedAt: project.updatedAt,
      data: json,
    });
    setView('project-manager');
  }, [project, saveProjectToList, setView]);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__title">
          <button
            className="btn btn--ghost btn--icon"
            onClick={handleBackToProjects}
            title="Back to Projects"
            style={{ fontSize: 'var(--text-md)' }}
          >
            ←
          </button>
          <span className="app-header__logo">🗺️</span>
          <span>StoryMapper</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 'var(--text-xs)', fontWeight: 400 }}>
            — {project.title}
            {isDirty && <span style={{ color: 'var(--accent-amber)', marginLeft: '4px' }}>●</span>}
          </span>
        </div>
        <div className="app-header__actions">
          <button className="btn btn--ghost" onClick={handleSave} title="Save Project">
            💾 Save
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--node-border)' }} />
          <button className="btn btn--primary" onClick={handleValidate} title="Validate all paths">
            ✓ Validate
          </button>
        </div>
      </header>

      {/* Body: Canvas + Optional Script Panel */}
      <div className="app-body">
        <StoryCanvas />
        {editingNodeId && <ScriptPanel />}
      </div>

      {/* Validation Bar */}
      {showValidationBar && (
        <div className="validation-bar">
          <div className="validation-bar__status" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={`validation-bar__dot validation-bar__dot--${validationStatus === 'idle' ? 'ok' : validationStatus}`} />
            <span style={{ color: 'var(--text-secondary)' }}>{validationMessage}</span>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 'var(--text-xs)' }}>
            {Object.keys(project.graphs).length} graph(s) · {
              Object.values(project.graphs).reduce((sum, g) => sum + g.nodes.length, 0)
            } node(s)
          </span>
        </div>
      )}
    </div>
  );
}
