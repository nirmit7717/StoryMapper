/**
 * StoryMapper — Core Data Model
 * 
 * Defines the nested graph structure for interactive narrative design.
 * A StoryProject contains a rootGraph and a flat map of subGraphs.
 * SubStoryNodes reference their nested graph via `subGraphId`.
 */

import type { JSONContent } from '@tiptap/react';
import type { Viewport } from '@xyflow/react';

// ─── Project Root ───────────────────────────────────────────────

export interface StoryProject {
  id: string;
  title: string;
  metadata: ProjectMeta;
  rootGraphId: string;
  /** Flat map of all graphs (including root). Key = graph ID */
  graphs: Record<string, Graph>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMeta {
  author: string;
  description: string;
  genre: string;
  tags: string[];
}

// ─── Graph ──────────────────────────────────────────────────────

export interface Graph {
  id: string;
  label: string;
  /** ID of the parent graph (null for root) */
  parentGraphId: string | null;
  /** ID of the SubStoryNode in the parent graph that owns this sub-graph */
  parentNodeId: string | null;
  nodes: StoryNode[];
  edges: StoryEdge[];
  viewport: Viewport;
}

// ─── Node Types ─────────────────────────────────────────────────

export type NodeType = 'script-editor' | 'branch' | 'sub-story' | 'start' | 'end';

export interface StoryNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  /** Dimensions (set after React Flow measures the node) */
  measured?: { width: number; height: number };
  selected?: boolean;
}

export interface NodeData {
  title: string;
  /** TipTap JSON content for the script/action text */
  richTextContent: JSONContent;
  /** Structured dialogue lines */
  dialogue: DialogueLine[];
  /** Scene metadata */
  metadata: SceneMetadata;
  /** Dynamic output ports (player choices) */
  outputPorts: LogicPort[];
  /** Whether the node is expanded on canvas */
  expanded: boolean;
  /** For sub-story nodes: ID of the nested graph */
  subGraphId?: string;
  /** Color accent for visual distinction */
  color?: string;
}

// ─── Dialogue ───────────────────────────────────────────────────

export interface DialogueLine {
  id: string;
  /** Character name (auto-uppercased in display) */
  character: string;
  /** Optional parenthetical direction, e.g. "(angrily)" */
  parenthetical: string;
  /** TipTap JSON content for the actual dialogue line */
  lineContent: JSONContent;
}

// ─── Scene Metadata ─────────────────────────────────────────────

export interface SceneMetadata {
  /** e.g. "Police Station", "Rooftop" */
  environment: string;
  /** e.g. "Tense, fluorescent hum" */
  ambience: string;
  /** e.g. "Lens flare, cool grade" */
  visualEffects: string;
  /** Freeform tags for filtering */
  tags: string[];
}

// ─── Logic Ports ────────────────────────────────────────────────

export interface LogicPort {
  id: string;
  /** Display label, e.g. "Show evidence" */
  label: string;
  /** Short description of the choice */
  description: string;
}

// ─── Edges ──────────────────────────────────────────────────────

export interface StoryEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  data?: EdgeData;
}

export interface EdgeData {
  label?: string;
  /** Description of flow between scenes */
  description?: string;
  /** Whether this edge is the "default" path */
  isDefault?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────

export function createDefaultNodeData(title: string = 'Untitled Scene'): NodeData {
  return {
    title,
    richTextContent: { type: 'doc', content: [{ type: 'paragraph' }] },
    dialogue: [],
    metadata: {
      environment: '',
      ambience: '',
      visualEffects: '',
      tags: [],
    },
    outputPorts: [],
    expanded: false,
  };
}

export function createDefaultDialogueLine(): DialogueLine {
  return {
    id: crypto.randomUUID(),
    character: '',
    parenthetical: '',
    lineContent: { type: 'doc', content: [{ type: 'paragraph' }] },
  };
}

export function createDefaultLogicPort(label: string = 'Choice'): LogicPort {
  return {
    id: crypto.randomUUID(),
    label,
    description: '',
  };
}
