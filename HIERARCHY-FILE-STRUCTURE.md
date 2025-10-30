# 📁 Hierarchy Visualization - File Structure

## Complete File Tree

```
JobE-Frontend/
│
├── 📦 Dependencies (package.json)
│   ├── reactflow@^11.11.4
│   └── @dagrejs/dagre@^1.1.5
│
├── 🎨 Components (components/hierarchy/)
│   ├── department-hierarchy-visualization.tsx  ⭐ Main component
│   ├── department-node.tsx                     🎨 Custom node
│   ├── import-preview-hierarchy.tsx            📊 Import integration
│   └── index.ts                                📤 Exports
│
├── 🛠️ Utilities (lib/)
│   ├── utils/hierarchy.ts                      🔧 Tree & layout functions
│   └── types/hierarchy.ts                      📘 TypeScript types
│
├── 📄 Pages (app/[locale]/dashboard/[orgId]/org-structure/hierarchy/)
│   ├── page.tsx                                🌐 Server component
│   └── hierarchy-page-client.tsx               💻 Client component
│
├── 📚 Documentation (docs/ & root)
│   ├── HIERARCHY-QUICKSTART.md                 🚀 Quick start guide
│   ├── HIERARCHY-IMPLEMENTATION-SUMMARY.md     📋 This summary
│   ├── hierarchy-visualization-guide.md        📖 Full guide
│   └── THIS-FILE.md                            📁 File structure
│
└── 💡 Examples (components/import/)
    └── import-wizard-step2-enhanced-example.tsx 💡 Integration example
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    Hierarchy Page                           │
│  app/.../hierarchy/hierarchy-page-client.tsx                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Fetches departments from Nhost GraphQL               │ │
│  │  ↓                                                     │ │
│  │  DepartmentHierarchyVisualization                     │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  Uses: lib/utils/hierarchy.ts                   │ │ │
│  │  │  - generateHierarchyLayout()                    │ │ │
│  │  │  - calculateHierarchyStats()                    │ │ │
│  │  │  - searchDepartments()                          │ │ │
│  │  │  ↓                                               │ │ │
│  │  │  React Flow Canvas                              │ │ │
│  │  │  ├── DepartmentNode (custom node type)         │ │ │
│  │  │  ├── Controls (zoom/pan)                       │ │ │
│  │  │  ├── MiniMap (overview)                        │ │ │
│  │  │  ├── Background (dots)                         │ │ │
│  │  │  └── Panels (search, stats)                    │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Import Preview                            │
│  components/import/import-wizard-step2.tsx (your existing)  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ImportPreviewHierarchy                               │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  Converts DepartmentPreview → HierarchyDepartment│ │ │
│  │  │  ↓                                               │ │ │
│  │  │  Tabs                                            │ │ │
│  │  │  ├── Hierarchy View                             │ │ │
│  │  │  │   └── DepartmentHierarchyVisualization       │ │ │
│  │  │  └── Table View                                 │ │ │
│  │  │      └── Traditional table                      │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Database (Nhost)
    │
    │ GraphQL Query
    │ { departments { id, dept_code, name, parent_id, ... } }
    ↓
HierarchyDepartment[]
    │
    │ lib/utils/hierarchy.ts
    │ 1. enrichDepartmentData() → adds level, childCount, totalDescendants
    │ 2. buildDepartmentTree() → converts flat to tree structure
    │ 3. convertTreeToFlow() → creates React Flow nodes & edges
    │ 4. applyDagreLayout() → calculates positions with Dagre
    ↓
{ nodes: Node[], edges: Edge[] }
    │
    │ React Flow
    │ - Renders nodes with DepartmentNode component
    │ - Draws edges between nodes
    │ - Provides interaction (zoom, pan, click)
    ↓
User sees beautiful hierarchy! 🎉
```

## Type System

```
Database Types
    ↓
lib/types/hierarchy.ts
    ├── HierarchyDepartment          (input from database)
    ├── DepartmentTreeNode           (tree structure)
    ├── DepartmentNodeData           (React Flow node data)
    ├── HierarchyLayoutOptions       (layout configuration)
    ├── HierarchyStats              (calculated statistics)
    ├── HierarchyFilterOptions      (user filters)
    └── HierarchyExportOptions      (export settings)
```

## Function Dependencies

```
generateHierarchyLayout()
    ├── enrichDepartmentData()
    │   ├── buildDepartmentTree()
    │   │   └── Creates parent-child relationships
    │   ├── calculateLevels()
    │   │   └── Assigns hierarchy depth
    │   └── calculateCounts()
    │       └── Counts children & descendants
    ├── convertTreeToFlow()
    │   └── Creates nodes and edges
    └── applyDagreLayout()
        └── Calculates positions using Dagre
```

## Style System

```
Tailwind CSS Classes
    ↓
DepartmentNode Component
    ├── Root Style (isRoot = true)
    │   ├── bg-gradient-to-br from-blue-50 to-indigo-50
    │   ├── border-blue-400
    │   └── Blue icon & badge
    │
    ├── Branch Style (has children)
    │   ├── bg-gradient-to-br from-emerald-50 to-teal-50
    │   ├── border-emerald-400
    │   └── Emerald icon & badge
    │
    └── Leaf Style (no children)
        ├── bg-gradient-to-br from-slate-50 to-gray-50
        ├── border-slate-300
        └── Slate icon & badge

Dark Mode Variants
    └── All colors have dark: equivalents
```

## Integration Points

```
Your App
    ├── 1. Standalone Page
    │   └── Route: /org-structure/hierarchy
    │       └── Auto-fetches & displays
    │
    ├── 2. Import Preview
    │   └── Component: ImportPreviewHierarchy
    │       └── Shows before import confirmation
    │
    └── 3. Custom Usage
        └── Component: DepartmentHierarchyVisualization
            └── Use anywhere with department data
```

## Quick File Reference

### Need to...

**Change node appearance?**
→ `components/hierarchy/department-node.tsx`

**Adjust layout algorithm?**
→ `lib/utils/hierarchy.ts` → `DEFAULT_LAYOUT_OPTIONS`

**Add new features to visualization?**
→ `components/hierarchy/department-hierarchy-visualization.tsx`

**Modify GraphQL query?**
→ `app/.../hierarchy/hierarchy-page-client.tsx`

**Add new utility functions?**
→ `lib/utils/hierarchy.ts`

**Add new types?**
→ `lib/types/hierarchy.ts`

**See usage examples?**
→ `components/import/import-wizard-step2-enhanced-example.tsx`

**Learn how to use?**
→ `HIERARCHY-QUICKSTART.md`

**Get detailed docs?**
→ `docs/hierarchy-visualization-guide.md`

## Size Reference

```
Component Sizes:
├── DepartmentNode: ~170 lines
├── DepartmentHierarchyVisualization: ~300 lines
├── ImportPreviewHierarchy: ~130 lines
├── HierarchyPageClient: ~240 lines
└── hierarchy.ts utilities: ~370 lines

Total New Code: ~1,200 lines of production-ready code

Documentation:
├── HIERARCHY-QUICKSTART.md: ~180 lines
├── hierarchy-visualization-guide.md: ~700 lines
└── HIERARCHY-IMPLEMENTATION-SUMMARY.md: ~570 lines

Total Documentation: ~1,450 lines
```

## Git Status

All files are ready to commit:

```bash
# New files created
git add components/hierarchy/
git add lib/utils/hierarchy.ts
git add lib/types/hierarchy.ts
git add app/[locale]/dashboard/[orgId]/org-structure/hierarchy/
git add docs/hierarchy-visualization-guide.md
git add HIERARCHY-QUICKSTART.md
git add HIERARCHY-IMPLEMENTATION-SUMMARY.md
git add HIERARCHY-FILE-STRUCTURE.md

# Modified files
git add package.json
git add pnpm-lock.yaml

git commit -m "feat: add beautiful department hierarchy visualization

- Add React Flow + Dagre hierarchical visualization
- Create custom gradient nodes for root/branch/leaf departments
- Add standalone hierarchy page with search & filters
- Include import preview integration
- Provide comprehensive documentation and examples
- Support dark mode and responsive design"
```

---

📌 **Pro Tip**: Start by visiting the hierarchy page to see it in action, then explore the code!
