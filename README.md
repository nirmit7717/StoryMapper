# StoryMapper 🗺️

A professional, node-based interactive narrative editor and visual scripting IDE designed for writers, game designers, and branching narrative architects. Built with **React**, **TypeScript**, **Vite**, and **React Flow**.

StoryMapper makes it easy to map, draft, and organize complex branching stories (e.g. choice-driven scripts in games like *Detroit: Become Human* or *Bandersnatch*).

---

## 🚀 Key Features

*   **Infinite Visual Canvas**: Pan, zoom, and build your script structures using a dynamic visual script graph.
*   **Decoupled Scene Writing**: Keep the visual canvas clean. Nodes show compact titles and status badges; double-click a node to write dialogues, script text, and scene descriptions in a slide-out rich-text editor (powered by TipTap).
*   **Dedicated Branch Nodes**: Separate scene logic from decision forks. Use Diamond-shaped Branch nodes with customizable individual choices, distinct port handles, and unique exit lanes.
*   **Sub-Story Grouping & Nesting**: Collapse multiple script nodes into a single folder-like "Sub-Story" node. Double-click to navigate into its own separate nested subgraph.
*   **Connection Drop Menu**: Drag a port handle and drop it anywhere on empty canvas space to summon a context-aware popup menu. Spawn and auto-connect new Scene, Branch, or End nodes instantly.
*   **Connection Metadata Sidebar**: Click on any connection line to open an Edge Panel sidebar. Document transition requirements, set custom path conditions, or instantly break connections.
*   **Static Graph Validator**: Live graph checking detects unreachable (orphan) nodes, dead-ends, infinite loops without exits, and ensures start/end path consistency.
*   **Local Project Manager**: Create, list, delete, or import projects locally using local storage persistence, or download complete projects as JSON files.

---

## 🛠️ Tech Stack

*   **Core**: React 19, TypeScript, Vite
*   **Canvas Workspace**: [@xyflow/react](https://reactflow.dev/) (React Flow)
*   **Rich Text Editor**: [TipTap](https://tiptap.dev/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand) + [Immer](https://immerjs.github.io/immer/)
*   **Icons**: Custom SVG & Unicode Emojis
*   **Styling**: Premium Dark-Mode Vanilla CSS

---

## 📦 Getting Started

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/StoryMapper.git
cd StoryMapper
npm install
```

### 2. Running in Development Mode

Run the local development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your web browser.

### 3. Production Build

Build the production-ready static bundle:

```bash
npm run build
```

Run tests using Vitest:

```bash
npm run test
# or
npx vitest
```

---

## 📖 Graph Controls Guide

*   **Create Node**: Double-click on any empty canvas area to add a Scene node, or use the top toolbar buttons.
*   **Edit Node Details**: Double-click any node (or click the edit pencil icon) to slide out the narrative script sidebar.
*   **Edit Connection details**: Click on any connection line to edit its labels/descriptions in the Connection sidebar.
*   **Delete Node/Connection**: Select the element and press the `Delete` key.
*   **Drag Select**: Click and drag on empty canvas to create a bounding box. Select multiple nodes to move, group, or delete them together.
*   **Pan Canvas**: Hold the **Middle Mouse Button** (scroll wheel click) or hold **Ctrl + Drag** to pan around.
*   **Group Nodes**: Select 2 or more nodes and click `📦 Group` on the toolbar to collapse them into a nested sub-graph.

---

## 🔒 License

Distributed under the MIT License. See `LICENSE` for more information.
