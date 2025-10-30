# Department Hierarchy Visualization 🌳

Beautiful, interactive hierarchical visualization for your department data using React Flow and Dagre.

## ✨ Features

### 🎨 Visual Design
- **Beautiful Custom Nodes**: Gradient backgrounds with different styles for root, branch, and leaf nodes
- **Color-Coded Hierarchy**:
  - 🔵 **Blue gradient** for root departments
  - 🟢 **Emerald gradient** for branch departments
  - ⚪ **Slate gradient** for leaf departments
- **Interactive Elements**: Hover effects, selection highlights, smooth animations
- **Dark Mode Support**: Fully styled for both light and dark themes

### 🔍 Interactive Features
- **Zoom & Pan Controls**: Intuitive navigation with mouse/touch
- **Mini-Map**: Bird's-eye view for large hierarchies
- **Search**: Real-time search by department name or code
- **Filters**: Toggle inactive departments visibility
- **Layout Options**: Switch between vertical (TB) and horizontal (LR) layouts
- **Path Highlighting**: Click a node to highlight its path to root

### 📊 Rich Information
- **Department Stats**: See child count and total descendants
- **Hierarchy Metrics**: Total departments, max depth, root/leaf counts
- **Status Indicators**: Visual badges for inactive departments
- **Level Indicators**: Progress bars showing hierarchy depth

## 🚀 Quick Start

### 1. Standalone Hierarchy Page

The main hierarchy visualization is available at:
```
/[locale]/dashboard/[orgId]/org-structure/hierarchy
```

This page automatically:
- Fetches all departments from your Nhost database
- Builds the hierarchy tree structure
- Displays interactive visualization with all controls

**Features:**
- Full-screen visualization
- Real-time search and filters
- Statistics panel
- Breadcrumb navigation
- Empty state with import prompts

### 2. Import Preview Integration

Show hierarchy visualization during import preview:

```tsx
import { ImportPreviewHierarchy } from '@/components/hierarchy/import-preview-hierarchy';
import { DepartmentPreview } from '@/lib/types/import';

function ImportPreview({ departments }: { departments: DepartmentPreview[] }) {
  return (
    <ImportPreviewHierarchy 
      departments={departments}
      showTableView={true} // Shows tabs for hierarchy/table views
    />
  );
}
```

This creates a tabbed interface with:
- **Hierarchy View**: Interactive visualization
- **Table View**: Traditional list with operation indicators

### 3. Custom Integration

Use the core component directly:

```tsx
import { DepartmentHierarchyVisualization } from '@/components/hierarchy/department-hierarchy-visualization';
import { HierarchyDepartment } from '@/lib/types/hierarchy';

function MyComponent({ departments }: { departments: HierarchyDepartment[] }) {
  return (
    <DepartmentHierarchyVisualization
      departments={departments}
      height="600px"
      showControls={true}
      showMiniMap={true}
      showStats={true}
      onNodeClick={(id) => console.log('Clicked:', id)}
    />
  );
}
```

## 📦 Components

### Core Components

#### `DepartmentHierarchyVisualization`
Main visualization component with all features.

**Props:**
- `departments: HierarchyDepartment[]` - Department data to visualize
- `className?: string` - Additional CSS classes
- `height?: string | number` - Container height (default: '600px')
- `showControls?: boolean` - Show zoom/pan controls (default: true)
- `showMiniMap?: boolean` - Show mini-map (default: true)
- `showStats?: boolean` - Show statistics panel (default: true)
- `onNodeClick?: (departmentId: string) => void` - Node click handler

#### `DepartmentNode`
Custom React Flow node component with beautiful styling.

**Features:**
- Automatic styling based on hierarchy position
- Status indicators (active/inactive)
- Child count and descendant stats
- Level indicator with progress bar
- Hover and selection states

#### `ImportPreviewHierarchy`
Wrapper for import preview with table/hierarchy tabs.

**Props:**
- `departments: DepartmentPreview[]` - Import preview data
- `showTableView?: boolean` - Show tabbed interface (default: true)

## 🔧 Utilities

### Hierarchy Utilities (`lib/utils/hierarchy.ts`)

#### `buildDepartmentTree(departments)`
Converts flat department list to tree structure.

```typescript
const roots = buildDepartmentTree(departments);
// Returns array of root DepartmentTreeNode objects
```

#### `enrichDepartmentData(departments)`
Adds hierarchy information (level, child counts) to departments.

```typescript
const enriched = enrichDepartmentData(departments);
// Each department now has level, childCount, totalDescendants
```

#### `calculateHierarchyStats(departments)`
Calculates statistics about the hierarchy.

```typescript
const stats = calculateHierarchyStats(departments);
// Returns { totalDepartments, maxDepth, rootCount, leafCount, averageChildrenPerNode }
```

#### `generateHierarchyLayout(departments, options)`
Generates complete React Flow layout with Dagre positioning.

```typescript
const { nodes, edges } = generateHierarchyLayout(departments, {
  direction: 'TB',
  nodeWidth: 280,
  nodeHeight: 120,
  nodeSpacing: 80,
  rankSpacing: 120,
});
```

#### `searchDepartments(departments, query)`
Filter departments by name or code.

```typescript
const results = searchDepartments(departments, 'engineering');
```

#### `findPathToRoot(departmentId, departments)`
Find all ancestor IDs from root to specific department.

```typescript
const path = findPathToRoot(dept.id, departments);
// Returns ['root-id', 'parent-id', 'dept-id']
```

## 🎯 Use Cases

### 1. Organization Structure Overview
Display the complete organizational hierarchy with all departments in a visual, easy-to-understand format.

### 2. Import Validation
Preview imported department structure before confirming import to catch hierarchy issues.

### 3. Department Navigation
Allow users to explore and navigate the organization structure interactively.

### 4. Reporting & Documentation
Export or screenshot the hierarchy for reports and documentation.

### 5. Onboarding
Help new employees understand the organization structure quickly.

## 🎨 Customization

### Layout Options

```typescript
const layoutOptions: HierarchyLayoutOptions = {
  direction: 'TB',    // 'TB' | 'LR' | 'BT' | 'RL'
  nodeWidth: 280,     // Node width in pixels
  nodeHeight: 120,    // Node height in pixels
  nodeSpacing: 80,    // Horizontal spacing
  rankSpacing: 120,   // Vertical spacing
};
```

### Custom Styling

The components use Tailwind CSS and shadcn/ui. Customize by:

1. **Modify Node Styles**: Edit `components/hierarchy/department-node.tsx`
2. **Change Colors**: Update the gradient and color classes
3. **Adjust Spacing**: Modify layout options
4. **Custom Themes**: Components respect dark mode automatically

### Edge Styling

Customize edges in the visualization component:

```typescript
edges={edges.map(edge => ({
  ...edge,
  animated: true,
  style: { stroke: '#your-color', strokeWidth: 3 }
}))}
```

## 📊 Data Format

### Input: HierarchyDepartment

```typescript
interface HierarchyDepartment {
  id: string;                    // Unique department ID (UUID)
  dept_code: string;             // Department code
  name: string;                  // Department name
  parent_id?: string | null;     // Parent department ID
  is_active: boolean;            // Active status
  metadata?: Record<string, unknown> | null;
}
```

### Computed Fields

After processing, departments gain:

```typescript
{
  level: number;              // Hierarchy level (0 = root)
  childCount: number;         // Number of direct children
  totalDescendants: number;   // Total number of descendants
}
```

## 🔍 GraphQL Integration

The hierarchy page fetches data using:

```graphql
query GetDepartments($orgId: uuid!) {
  departments(
    where: { organization_id: { _eq: $orgId } }
    order_by: { dept_code: asc }
  ) {
    id
    dept_code
    name
    parent_id
    is_active
    metadata
  }
}
```

## 🎬 User Interactions

### Keyboard Shortcuts
- **+/-**: Zoom in/out (when focused)
- **Arrow Keys**: Pan view (when focused)
- **Space + Drag**: Pan view

### Mouse Controls
- **Scroll**: Zoom in/out
- **Click + Drag**: Pan view
- **Click Node**: Select and highlight path
- **Hover Node**: Preview effects

### Touch Controls
- **Pinch**: Zoom in/out
- **Drag**: Pan view
- **Tap Node**: Select

## 📱 Responsive Design

The visualization adapts to different screen sizes:

- **Desktop**: Full features with side panels
- **Tablet**: Optimized controls and mini-map
- **Mobile**: Simplified view with essential controls

## 🚀 Performance

### Optimizations
- **Memoized Calculations**: Stats and layouts are cached
- **Lazy Rendering**: Only visible nodes are fully rendered
- **Debounced Search**: Search input is debounced for better performance
- **Virtual Scrolling**: Large hierarchies use virtual rendering

### Recommendations
- ✅ **Good**: Up to 100 departments
- ⚠️ **Acceptable**: 100-500 departments
- ❌ **Consider pagination**: 500+ departments

## 🔧 Troubleshooting

### Nodes Overlapping
- Increase `nodeSpacing` and `rankSpacing` in layout options
- Try different `direction` (TB vs LR)

### Performance Issues
- Disable mini-map for large hierarchies
- Reduce node complexity in `DepartmentNode`
- Implement pagination or filtering

### Layout Not Updating
- Ensure departments array reference changes when data updates
- Check that `parent_id` references are valid

## 📚 Examples

### Example 1: Simple Hierarchy

```typescript
const departments: HierarchyDepartment[] = [
  { id: '1', dept_code: 'CEO', name: 'Executive Office', parent_id: null, is_active: true },
  { id: '2', dept_code: 'ENG', name: 'Engineering', parent_id: '1', is_active: true },
  { id: '3', dept_code: 'SALES', name: 'Sales', parent_id: '1', is_active: true },
];

<DepartmentHierarchyVisualization departments={departments} />
```

### Example 2: With Filters

```typescript
const [searchQuery, setSearchQuery] = useState('');
const filtered = searchDepartments(departments, searchQuery);

<DepartmentHierarchyVisualization 
  departments={filtered}
  onNodeClick={(id) => router.push(`/departments/${id}`)}
/>
```

## 🎯 Future Enhancements

Potential improvements:
- [ ] Export to PNG/SVG
- [ ] Collapsible branches
- [ ] Drag-and-drop reorganization
- [ ] Real-time collaboration
- [ ] Animation controls
- [ ] Custom node templates
- [ ] Performance metrics overlay

## 📝 License

Part of the JobE-Frontend project.

---

Built with ❤️ using React Flow, Dagre, and Next.js
