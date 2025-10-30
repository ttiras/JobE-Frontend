# 🚀 Quick Start: Department Hierarchy Visualization

Get your beautiful hierarchy visualization up and running in minutes!

## ✅ What's Been Created

1. **Core Components**
   - `DepartmentHierarchyVisualization` - Main visualization component
   - `DepartmentNode` - Beautiful custom nodes
   - `ImportPreviewHierarchy` - Import preview integration

2. **Utilities**
   - `lib/utils/hierarchy.ts` - Tree building and layout functions
   - `lib/types/hierarchy.ts` - TypeScript type definitions

3. **Pages**
   - `/[locale]/dashboard/[orgId]/org-structure/hierarchy` - Standalone hierarchy page

4. **Documentation**
   - `docs/hierarchy-visualization-guide.md` - Complete guide

## 🎯 Three Ways to Use It

### Option 1: Visit the Hierarchy Page (Easiest!)

Just navigate to:
```
/[locale]/dashboard/[orgId]/org-structure/hierarchy
```

This page:
- ✅ Already created
- ✅ Fetches data from your database
- ✅ Shows full visualization with all features
- ✅ Works out of the box!

**Try it now:**
1. Start your dev server: `pnpm dev`
2. Navigate to any organization
3. Go to: `http://localhost:3000/en/dashboard/{orgId}/org-structure/hierarchy`

### Option 2: Add to Import Preview

Show hierarchy during import:

```tsx
// In your import-wizard-step2.tsx, add:
import { ImportPreviewHierarchy } from '@/components/hierarchy/import-preview-hierarchy';

// Then in your render:
{importType === 'departments' && context.preview && (
  <ImportPreviewHierarchy 
    departments={context.preview.departments}
    showTableView={true}
  />
)}
```

This creates a tabbed view with:
- Hierarchy visualization
- Traditional table view

### Option 3: Custom Integration

Use the core component anywhere:

```tsx
import { DepartmentHierarchyVisualization } from '@/components/hierarchy/department-hierarchy-visualization';

<DepartmentHierarchyVisualization
  departments={yourDepartments}
  height="600px"
  showControls={true}
  showMiniMap={true}
  showStats={true}
/>
```

## 📦 Already Installed

Dependencies are already added:
- ✅ `reactflow` - React Flow library
- ✅ `@dagrejs/dagre` - Dagre layout algorithm

## 🎨 What It Looks Like

### Node Styles
- **🔵 Root Departments**: Blue gradient with "Root" badge
- **🟢 Branch Departments**: Emerald gradient with child counts
- **⚪ Leaf Departments**: Slate gradient (no children)
- **❌ Inactive**: Grayed out with "Inactive" badge

### Features
- 🔍 **Search bar** - Find departments by name or code
- 🎛️ **Controls** - Zoom, pan, fit view
- 🗺️ **Mini-map** - Overview of large hierarchies
- 📊 **Stats panel** - Total, depth, roots, leaves
- 🎨 **Dark mode** - Fully styled for dark theme
- 📱 **Responsive** - Works on all screen sizes

## 🔧 Quick Customization

### Change Layout Direction

In the hierarchy page, users can toggle between vertical and horizontal layouts using the settings menu.

Or programmatically:

```tsx
<DepartmentHierarchyVisualization
  departments={departments}
  // ... other props
/>

// Layout options are in lib/utils/hierarchy.ts:
// direction: 'TB' (vertical) or 'LR' (horizontal)
```

### Adjust Node Size

Edit `lib/utils/hierarchy.ts`:

```typescript
export const DEFAULT_LAYOUT_OPTIONS: HierarchyLayoutOptions = {
  direction: 'TB',
  nodeWidth: 280,      // Make wider/narrower
  nodeHeight: 120,     // Make taller/shorter
  nodeSpacing: 80,     // Horizontal gap
  rankSpacing: 120,    // Vertical gap
};
```

### Change Colors

Edit `components/hierarchy/department-node.tsx` and modify the gradient classes:

```typescript
// Root nodes
bg: 'bg-gradient-to-br from-blue-50 to-indigo-50'

// Branch nodes  
bg: 'bg-gradient-to-br from-emerald-50 to-teal-50'

// Leaf nodes
bg: 'bg-gradient-to-br from-slate-50 to-gray-50'
```

## 🧪 Test With Sample Data

Create test data in your GraphQL console:

```graphql
mutation {
  insert_departments(objects: [
    { dept_code: "CEO", name: "Executive Office", organization_id: "your-org-id", parent_id: null }
    { dept_code: "ENG", name: "Engineering", organization_id: "your-org-id", parent_id: "ceo-id" }
    { dept_code: "SALES", name: "Sales", organization_id: "your-org-id", parent_id: "ceo-id" }
    { dept_code: "FE", name: "Frontend Team", organization_id: "your-org-id", parent_id: "eng-id" }
    { dept_code: "BE", name: "Backend Team", organization_id: "your-org-id", parent_id: "eng-id" }
  ]) {
    affected_rows
  }
}
```

Then visit the hierarchy page to see your structure!

## 🎯 Next Steps

1. **Try it**: Visit the hierarchy page with your existing departments
2. **Customize**: Adjust colors and sizes to match your brand
3. **Integrate**: Add to import preview or other pages
4. **Enhance**: Add export functionality, collapsible branches, etc.

## 📚 Need Help?

- **Full Documentation**: `docs/hierarchy-visualization-guide.md`
- **Type Definitions**: `lib/types/hierarchy.ts`
- **Utilities**: `lib/utils/hierarchy.ts`
- **Example Integration**: `components/import/import-wizard-step2-enhanced-example.tsx`

## 🐛 Troubleshooting

### "Cannot find module 'reactflow'"
Run: `pnpm install` (already done, but if you see this error)

### Hierarchy page shows loading forever
Check:
1. Is Nhost running?
2. Do you have departments in the database?
3. Check console for GraphQL errors

### Nodes are overlapping
Increase spacing in `lib/utils/hierarchy.ts`:
```typescript
nodeSpacing: 120,   // Increase this
rankSpacing: 180,   // And this
```

### Dark mode colors look wrong
The components use Tailwind's dark mode classes. Ensure your theme provider is set up correctly.

## 🎉 You're All Set!

Everything is ready to use. Start by visiting:
```
http://localhost:3000/en/dashboard/{your-org-id}/org-structure/hierarchy
```

Enjoy your beautiful hierarchy visualization! 🌳✨
