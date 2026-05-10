/**
 * StoryMapper — Project Manager
 * 
 * Landing screen with a file-explorer style interface to create
 * new projects and open existing ones from localStorage or file import.
 */

import { useCallback } from 'react';
import { useStoryStore } from '../../store/useStoryStore';
import { useUIStore, type ProjectListItem } from '../../store/useUIStore';

export function ProjectManager() {
  const loadProject = useStoryStore((s) => s.loadProject);
  const project = useStoryStore((s) => s.project);

  const projectList = useUIStore((s) => s.projectList);
  const setView = useUIStore((s) => s.setView);
  const saveProjectToList = useUIStore((s) => s.saveProjectToList);
  const removeProjectFromList = useUIStore((s) => s.removeProjectFromList);
  const setValidation = useUIStore((s) => s.setValidation);

  // Create a fresh new project
  const handleNewProject = useCallback(() => {
    // The store already initializes with a fresh project,
    // but we reinitialize it here for a clean slate
    const freshProject = {
      id: crypto.randomUUID(),
      title: 'Untitled Story',
      metadata: { author: '', description: '', genre: '', tags: [] },
      rootGraphId: 'root',
      graphs: {
        root: {
          id: 'root',
          label: 'Root Story',
          parentGraphId: null,
          parentNodeId: null,
          nodes: [
            {
              id: 'start-1',
              type: 'start' as const,
              position: { x: 250, y: 150 },
              data: {
                title: 'Start',
                richTextContent: { type: 'doc', content: [{ type: 'paragraph' }] },
                dialogue: [],
                metadata: { environment: '', ambience: '', visualEffects: '', tags: [] },
                outputPorts: [],
                expanded: false,
              },
            },
          ],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    loadProject(freshProject as any);
    setView('editor');
  }, [loadProject, setView]);

  // Open a project from the saved list
  const handleOpenFromList = useCallback((item: ProjectListItem) => {
    try {
      const projectData = JSON.parse(item.data);
      loadProject(projectData);
      setView('editor');
    } catch {
      setValidation('error', 'Failed to load project');
    }
  }, [loadProject, setView, setValidation]);

  // Import a project from a JSON file
  const handleImportFile = useCallback(() => {
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
          loadProject(data);
          // Also save to the project list
          saveProjectToList({
            id: data.id,
            title: data.title,
            updatedAt: data.updatedAt,
            data: ev.target?.result as string,
          });
          setView('editor');
        } catch {
          setValidation('error', 'Failed to parse project file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [loadProject, saveProjectToList, setView, setValidation]);

  const handleDeleteProject = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Remove this project from the list?')) {
      removeProjectFromList(id);
    }
  }, [removeProjectFromList]);

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  return (
    <div className="pm">
      {/* Background decoration */}
      <div className="pm__bg-grid" />

      {/* Content */}
      <div className="pm__content">
        {/* Logo Header */}
        <div className="pm__header">
          <div className="pm__logo">
            <span className="pm__logo-icon">🗺️</span>
            <h1 className="pm__logo-text">StoryMapper</h1>
          </div>
          <p className="pm__subtitle">
            Visual narrative design for interactive stories
          </p>
        </div>

        {/* Action Cards */}
        <div className="pm__actions">
          <button className="pm__action-card pm__action-card--primary" onClick={handleNewProject}>
            <span className="pm__action-icon">✦</span>
            <span className="pm__action-label">New Project</span>
            <span className="pm__action-desc">Start a blank story</span>
          </button>
          <button className="pm__action-card" onClick={handleImportFile}>
            <span className="pm__action-icon">📂</span>
            <span className="pm__action-label">Open File</span>
            <span className="pm__action-desc">Import .storymapper.json</span>
          </button>
        </div>

        {/* Recent Projects */}
        {projectList.length > 0 && (
          <div className="pm__recent">
            <h2 className="pm__section-title">Recent Projects</h2>
            <div className="pm__project-list">
              {projectList.map((item) => (
                <div
                  key={item.id}
                  className="pm__project-item"
                  onClick={() => handleOpenFromList(item)}
                >
                  <div className="pm__project-icon">📄</div>
                  <div className="pm__project-info">
                    <div className="pm__project-title">{item.title}</div>
                    <div className="pm__project-date">
                      Last modified: {formatDate(item.updatedAt)}
                    </div>
                  </div>
                  <button
                    className="pm__project-delete"
                    onClick={(e) => handleDeleteProject(e, item.id)}
                    title="Remove from list"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {projectList.length === 0 && (
          <div className="pm__empty">
            <span className="pm__empty-icon">📖</span>
            <p className="pm__empty-text">
              No recent projects. Create a new project or open an existing file to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
