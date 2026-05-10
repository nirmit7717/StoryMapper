/**
 * StoryMapper — Graph Validator Unit Tests
 * 
 * Tests dead-end detection, orphan detection, cycle detection,
 * and recursive sub-story validation.
 */

import { describe, it, expect } from 'vitest';
import {
  validateGraph,
  validateProject,
  detectDeadEnds,
  detectOrphanNodes,
  detectInfiniteLoops,
} from '../../src/lib/graphValidator';
import type { Graph, StoryProject, StoryNode, StoryEdge } from '../../src/types/story';
import { createDefaultNodeData } from '../../src/types/story';

// ─── Helpers ────────────────────────────────────────────────────

function makeNode(id: string, type: 'start' | 'end' | 'script-editor' | 'sub-story', title?: string): StoryNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: createDefaultNodeData(title || id),
  };
}

function makeEdge(source: string, target: string, sourceHandle = 'out', targetHandle = 'in'): StoryEdge {
  return {
    id: `e-${source}-${target}`,
    source,
    sourceHandle,
    target,
    targetHandle,
  };
}

function makeGraph(id: string, nodes: StoryNode[], edges: StoryEdge[], parentGraphId: string | null = null): Graph {
  return {
    id,
    label: id,
    parentGraphId,
    parentNodeId: null,
    nodes,
    edges,
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('Graph Validator', () => {
  // ── Dead-End Detection ──

  describe('detectDeadEnds', () => {
    it('should pass for a linear story A→B→C→END', () => {
      const graph = makeGraph('test', [
        makeNode('start', 'start'),
        makeNode('a', 'script-editor', 'Scene A'),
        makeNode('b', 'script-editor', 'Scene B'),
        makeNode('end', 'end'),
      ], [
        makeEdge('start', 'a'),
        makeEdge('a', 'b'),
        makeEdge('b', 'end'),
      ]);

      const errors = detectDeadEnds(graph);
      expect(errors).toHaveLength(0);
    });

    it('should pass for branching story with all paths reaching END', () => {
      const graph = makeGraph('test', [
        makeNode('start', 'start'),
        makeNode('a', 'script-editor', 'Scene A'),
        makeNode('b', 'script-editor', 'Scene B'),
        makeNode('c', 'script-editor', 'Scene C'),
        makeNode('end', 'end'),
      ], [
        makeEdge('start', 'a'),
        makeEdge('a', 'b'),
        makeEdge('a', 'c'),
        makeEdge('b', 'end'),
        makeEdge('c', 'end'),
      ]);

      const errors = detectDeadEnds(graph);
      expect(errors).toHaveLength(0);
    });

    it('should detect a node with no outgoing edges (non-END) as dead-end', () => {
      const graph = makeGraph('test', [
        makeNode('start', 'start'),
        makeNode('a', 'script-editor', 'Scene A'),
        makeNode('b', 'script-editor', 'Scene B'),
        makeNode('end', 'end'),
      ], [
        makeEdge('start', 'a'),
        makeEdge('a', 'b'),
        // 'b' has no outgoing edges — dead end!
      ]);

      const errors = detectDeadEnds(graph);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.type === 'dead-end' && e.nodeId === 'b')).toBe(true);
    });
  });

  // ── Orphan Node Detection ──

  describe('detectOrphanNodes', () => {
    it('should detect unreachable nodes', () => {
      const graph = makeGraph('test', [
        makeNode('start', 'start'),
        makeNode('a', 'script-editor', 'Scene A'),
        makeNode('orphan', 'script-editor', 'Orphan Scene'),
        makeNode('end', 'end'),
      ], [
        makeEdge('start', 'a'),
        makeEdge('a', 'end'),
        // 'orphan' is not connected to anything reachable from start
      ]);

      const warnings = detectOrphanNodes(graph);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.nodeId === 'orphan')).toBe(true);
    });

    it('should not flag connected nodes as orphans', () => {
      const graph = makeGraph('test', [
        makeNode('start', 'start'),
        makeNode('a', 'script-editor', 'Scene A'),
        makeNode('end', 'end'),
      ], [
        makeEdge('start', 'a'),
        makeEdge('a', 'end'),
      ]);

      const warnings = detectOrphanNodes(graph);
      expect(warnings).toHaveLength(0);
    });
  });

  // ── Infinite Loop Detection ──

  describe('detectInfiniteLoops', () => {
    it('should warn about cycles with no exit', () => {
      const graph = makeGraph('test', [
        makeNode('start', 'start'),
        makeNode('a', 'script-editor', 'Scene A'),
        makeNode('b', 'script-editor', 'Scene B'),
      ], [
        makeEdge('start', 'a'),
        makeEdge('a', 'b'),
        makeEdge('b', 'a'), // a↔b forms a cycle with no exit
      ]);

      const warnings = detectInfiniteLoops(graph);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should not warn about cycles with an exit path', () => {
      const graph = makeGraph('test', [
        makeNode('start', 'start'),
        makeNode('a', 'script-editor', 'Scene A'),
        makeNode('b', 'script-editor', 'Scene B'),
        makeNode('end', 'end'),
      ], [
        makeEdge('start', 'a'),
        makeEdge('a', 'b'),
        makeEdge('b', 'a'), // cycle
        makeEdge('b', 'end'), // but 'b' also exits to end
      ]);

      const warnings = detectInfiniteLoops(graph);
      // Should not have infinite loop warnings since there's an exit
      expect(warnings).toHaveLength(0);
    });
  });

  // ── Full Graph Validation ──

  describe('validateGraph', () => {
    it('should return valid for a well-formed graph', () => {
      const graph = makeGraph('test', [
        makeNode('start', 'start'),
        makeNode('a', 'script-editor', 'Scene A'),
        makeNode('end', 'end'),
      ], [
        makeEdge('start', 'a'),
        makeEdge('a', 'end'),
      ]);

      const result = validateGraph(graph);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about empty graphs', () => {
      const graph = makeGraph('test', [], []);
      const result = validateGraph(graph);
      expect(result.warnings.some(w => w.type === 'empty-graph')).toBe(true);
    });

    it('should error on missing Start node in root graph', () => {
      const graph = makeGraph('test', [
        makeNode('a', 'script-editor', 'Scene A'),
        makeNode('end', 'end'),
      ], [
        makeEdge('a', 'end'),
      ]);

      const result = validateGraph(graph);
      expect(result.errors.some(e => e.type === 'no-start')).toBe(true);
    });

    it('should error on missing End node in root graph', () => {
      const graph = makeGraph('test', [
        makeNode('start', 'start'),
        makeNode('a', 'script-editor', 'Scene A'),
      ], [
        makeEdge('start', 'a'),
      ]);

      const result = validateGraph(graph);
      expect(result.errors.some(e => e.type === 'no-end')).toBe(true);
    });
  });

  // ── Project-Level Validation ──

  describe('validateProject', () => {
    it('should validate all graphs recursively', () => {
      const project: StoryProject = {
        id: 'proj-1',
        title: 'Test',
        metadata: { author: '', description: '', genre: '', tags: [] },
        rootGraphId: 'root',
        graphs: {
          'root': makeGraph('root', [
            makeNode('start', 'start'),
            makeNode('sub', 'sub-story', 'Sub-Story'),
            makeNode('end', 'end'),
          ], [
            makeEdge('start', 'sub'),
            makeEdge('sub', 'end'),
          ]),
          'sub-1': makeGraph('sub-1', [
            makeNode('s-a', 'script-editor', 'Sub Scene A'),
            makeNode('s-b', 'script-editor', 'Sub Scene B'),
          ], [
            makeEdge('s-a', 's-b'),
            // s-b has no outgoing — dead end in sub-graph
          ], 'root'),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = validateProject(project);
      // Root graph should be valid, but sub-graph has a dead end
      expect(result.errors.some(e => e.graphId === 'sub-1' && e.type === 'dead-end')).toBe(true);
    });
  });
});
