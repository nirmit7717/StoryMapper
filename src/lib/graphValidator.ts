/**
 * StoryMapper — Graph Validator
 * 
 * Validates branching narrative graphs for structural integrity.
 * Detects dead-ends, orphan nodes, and infinite loops.
 */

import type { Graph, StoryProject, StoryNode, StoryEdge } from '../types/story';

// ─── Types ──────────────────────────────────────────────────────

export interface ValidationError {
  type: 'dead-end' | 'orphan' | 'infinite-loop' | 'missing-connection' | 'no-start' | 'no-end' | 'missing-sub-start' | 'missing-sub-end';
  nodeId?: string;
  graphId: string;
  message: string;
}

export interface ValidationWarning {
  type: 'cycle-with-exit' | 'empty-graph' | 'unconnected-port';
  nodeId?: string;
  graphId: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ─── Core Validation ────────────────────────────────────────────

/**
 * Validate an entire project (all graphs recursively).
 */
export function validateProject(project: StoryProject): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [graphId, graph] of Object.entries(project.graphs)) {
    const graphResult = validateGraph(graph);
    errors.push(...graphResult.errors);
    warnings.push(...graphResult.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single graph for structural issues.
 */
export function validateGraph(graph: Graph): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Empty graph check
  if (graph.nodes.length === 0) {
    warnings.push({
      type: 'empty-graph',
      graphId: graph.id,
      message: `Graph "${graph.label}" is empty.`,
    });
    return { isValid: true, errors, warnings };
  }

  // Check for start/end nodes
  const startNodes = graph.nodes.filter(n => n.type === 'start');
  const endNodes = graph.nodes.filter(n => n.type === 'end');

  // For root or non-sub graphs, require start/end
  if (startNodes.length === 0 && !graph.parentGraphId) {
    errors.push({
      type: 'no-start',
      graphId: graph.id,
      message: `Graph "${graph.label}" has no Start node.`,
    });
  }

  if (endNodes.length === 0 && !graph.parentGraphId) {
    errors.push({
      type: 'no-end',
      graphId: graph.id,
      message: `Graph "${graph.label}" has no End node.`,
    });
  }

  // Dead-end detection
  const deadEnds = detectDeadEnds(graph);
  errors.push(...deadEnds);

  // Orphan node detection
  const orphans = detectOrphanNodes(graph);
  warnings.push(...orphans);

  // Infinite loop detection
  const loops = detectInfiniteLoops(graph);
  warnings.push(...loops);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Dead-End Detection ─────────────────────────────────────────

/**
 * Detect nodes that are reachable but have no outgoing edges
 * and are not End nodes. These are "dead ends" in the narrative.
 */
export function detectDeadEnds(graph: Graph): ValidationError[] {
  const errors: ValidationError[] = [];
  const endNodeIds = new Set(graph.nodes.filter(n => n.type === 'end').map(n => n.id));

  // Build adjacency list
  const adjacency = buildAdjacencyList(graph);

  // Find reachable nodes from all start nodes
  const startNodes = graph.nodes.filter(n => n.type === 'start');
  const reachable = new Set<string>();

  for (const start of startNodes) {
    dfs(start.id, adjacency, reachable);
  }

  // If no start nodes, consider all nodes as potentially reachable
  if (startNodes.length === 0) {
    graph.nodes.forEach(n => reachable.add(n.id));
  }

  // Check each reachable non-end node for outgoing edges
  for (const nodeId of reachable) {
    if (endNodeIds.has(nodeId)) continue;
    if (nodeId.startsWith('start')) continue; // Start nodes with edges are fine

    const outgoing = graph.edges.filter(e => e.source === nodeId);
    if (outgoing.length === 0) {
      const node = graph.nodes.find(n => n.id === nodeId);
      errors.push({
        type: 'dead-end',
        nodeId,
        graphId: graph.id,
        message: `"${node?.data.title || nodeId}" is a dead end — no outgoing connections.`,
      });
    }
  }

  return errors;
}

// ─── Orphan Node Detection ──────────────────────────────────────

/**
 * Detect nodes that are unreachable from any start node.
 */
export function detectOrphanNodes(graph: Graph): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const startNodes = graph.nodes.filter(n => n.type === 'start');

  if (startNodes.length === 0) return warnings;

  const adjacency = buildAdjacencyList(graph);
  const reachable = new Set<string>();

  for (const start of startNodes) {
    dfs(start.id, adjacency, reachable);
  }

  for (const node of graph.nodes) {
    if (!reachable.has(node.id) && node.type !== 'start') {
      warnings.push({
        type: 'cycle-with-exit', // reuse type for orphans
        nodeId: node.id,
        graphId: graph.id,
        message: `"${node.data.title}" is unreachable from any Start node.`,
      });
    }
  }

  return warnings;
}

// ─── Infinite Loop Detection ────────────────────────────────────

/**
 * Detect cycles that have no exit path (all nodes in the cycle
 * only connect to other nodes in the cycle).
 */
export function detectInfiniteLoops(graph: Graph): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const adjacency = buildAdjacencyList(graph);
  const endNodeIds = new Set(graph.nodes.filter(n => n.type === 'end').map(n => n.id));

  // Find all SCCs using Tarjan's algorithm
  const sccs = findSCCs(graph.nodes.map(n => n.id), adjacency);

  for (const scc of sccs) {
    if (scc.length <= 1) continue; // Not a meaningful cycle

    // Check if any node in the SCC has an edge to a node outside the SCC
    const sccSet = new Set(scc);
    let hasExit = false;

    for (const nodeId of scc) {
      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!sccSet.has(neighbor)) {
          hasExit = true;
          break;
        }
      }
      if (hasExit) break;
    }

    if (!hasExit) {
      warnings.push({
        type: 'cycle-with-exit',
        graphId: graph.id,
        message: `Infinite loop detected: ${scc.map(id => {
          const n = graph.nodes.find(n => n.id === id);
          return n?.data.title || id;
        }).join(' → ')}`,
      });
    }
  }

  return warnings;
}

// ─── Graph Utilities ────────────────────────────────────────────

function buildAdjacencyList(graph: Graph): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    const list = adj.get(edge.source);
    if (list) list.push(edge.target);
  }
  return adj;
}

function dfs(startId: string, adjacency: Map<string, string[]>, visited: Set<string>) {
  const stack = [startId];
  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }
}

/**
 * Tarjan's SCC algorithm to find strongly connected components.
 */
function findSCCs(nodeIds: string[], adjacency: Map<string, string[]>): string[][] {
  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const sccs: string[][] = [];

  function strongconnect(v: string) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = adjacency.get(v) || [];
    for (const w of neighbors) {
      if (!indices.has(w)) {
        strongconnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
      } else if (onStack.has(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  for (const nodeId of nodeIds) {
    if (!indices.has(nodeId)) {
      strongconnect(nodeId);
    }
  }

  return sccs;
}
