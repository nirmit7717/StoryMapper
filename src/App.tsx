/**
 * StoryMapper — Main Application
 */

import { ReactFlowProvider } from '@xyflow/react';
import { StoryCanvas } from './components/canvas/StoryCanvas';
import { useStoryStore } from './store/useStoryStore';
import { useUIStore } from './store/useUIStore';
import { validateProject } from './lib/graphValidator';
import { useCallback } from 'react';

import './styles/index.css';
import './styles/nodes.css';
import './styles/editor.css';

export default function App() {
  const project = useStoryStore((s) => s.project);
  const isDirty = useStoryStore((s) => s.isDirty);
  const updateProjectMeta = useStoryStore((s) => s.updateProjectMeta);

  const validationStatus = useUIStore((s) => s.validationStatus);
  const validationMessage = useUIStore((s) => s.validationMessage);
  const showValidationBar = useUIStore((s) => s.showValidationBar);
  const setValidation = useUIStore((s) => s.setValidation);

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

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}.storymapper.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.storymapper.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          useStoryStore.getState().loadProject(data);
          setValidation('ok', 'Project loaded successfully');
        } catch {
          setValidation('error', 'Failed to parse project file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setValidation]);

  return (
    <ReactFlowProvider>
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="app-header__title">
            <span className="app-header__logo">🗺️</span>
            <span>StoryMapper</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 'var(--text-xs)', fontWeight: 400 }}>
              — {project.title}
              {isDirty && <span style={{ color: 'var(--accent-amber)', marginLeft: '4px' }}>●</span>}
            </span>
          </div>
          <div className="app-header__actions">
            <button className="btn btn--ghost" onClick={handleImportJSON} title="Import Project">
              📂 Open
            </button>
            <button className="btn btn--ghost" onClick={handleExportJSON} title="Export Project">
              💾 Save
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--node-border)' }} />
            <button className="btn btn--primary" onClick={handleValidate} title="Validate all paths">
              ✓ Validate
            </button>
          </div>
        </header>

        {/* Canvas */}
        <div className="app-body">
          <StoryCanvas />
        </div>

        {/* Validation Bar */}
        {showValidationBar && (
          <div className="validation-bar">
            <div className="validation-bar__status">
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
    </ReactFlowProvider>
  );
}
