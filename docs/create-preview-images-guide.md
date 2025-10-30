# Creating Excel Preview Images

**Quick Guide for Design Tools**

---

## 🎯 Goal

Create realistic Excel screenshots that show exactly **3 data rows** plus the header row, with database column names.

---

## 📐 Specifications

### Image Properties
- **Format**: PNG (with white background or transparency)
- **Dimensions**: 800px × 200px (landscape)
- **Resolution**: 2x for retina displays (1600px × 400px, scaled to 800×200)
- **File Size**: < 50KB (use PNG compression)
- **Background**: White or transparent

### Visual Style
- **Font**: Arial, Helvetica, or SF Pro (system fonts)
- **Font Size**: 
  - Headers: 12px, bold
  - Data: 11px, regular
- **Grid**: Light gray gridlines (#E0E0E0)
- **Header Row**: Light gray background (#F5F5F5)
- **Text Color**: Dark gray (#333333)
- **Padding**: 8px cell padding

---

## 📋 Method 1: Screenshot from Excel (Recommended)

### Steps:

1. **Open Excel** and create new spreadsheet

2. **Add Data for Departments**:
   ```
   A         | B               | C
   code      | name            | parent_code
   IT        | IT Department   | 
   IT-DEV    | Development     | IT
   IT-OPS    | Operations      | IT
   ```

3. **Format the Sheet**:
   - Make row 1 bold
   - Add light gray background to row 1 (#F5F5F5)
   - Adjust column widths (A: 80px, B: 140px, C: 120px)
   - Show gridlines (View → Gridlines)

4. **Take Screenshot**:
   - Zoom to 100%
   - Select cells A1:C4 (including header)
   - macOS: Cmd+Shift+4, then select area
   - Windows: Snipping Tool
   - Capture only the cells (no Excel chrome)

5. **Edit in Preview/Paint**:
   - Crop tightly to grid
   - Ensure dimensions ~800×200px
   - Save as PNG

6. **Save File**:
   ```
   /public/templates/preview-departments.png
   ```

7. **Repeat for Positions**:
   ```
   A         | B                | C               | D                 | E               | F        | G          | H          | I
   code      | title            | department_code | description       | employment_type | location | salary_min | salary_max | salary_currency
   IT-DEV-01 | Senior Developer | IT-DEV          | Lead dev team     | Full-time       | Remote   | 80000      | 120000     | USD
   IT-DEV-02 | Junior Developer | IT-DEV          | Support dev       | Full-time       | Office   | 50000      | 70000      | USD
   HR-MGR-01 | HR Manager       | HR              | Manage HR ops     | Full-time       | Office   | 60000      | 90000      | USD
   ```

   Save as:
   ```
   /public/templates/preview-positions.png
   ```

---

## 🎨 Method 2: Design in Figma

### Steps:

1. **Create New Frame**:
   - 800 × 200px
   - White background

2. **Add Grid**:
   - Use Rectangle tool
   - Stroke: 1px, #E0E0E0
   - Create table structure (4 rows × 3 columns for departments)

3. **Add Header Row**:
   - Rectangle with fill #F5F5F5
   - Text: Arial Bold, 12px, #333333
   - Align center-left with 8px padding

4. **Add Data Rows**:
   - Text: Arial Regular, 11px, #333333
   - 8px padding

5. **Add Column Headers**:
   - Small text above each column: "A", "B", "C"
   - Gray color: #999999, 9px

6. **Export**:
   - File → Export
   - Format: PNG
   - 2x resolution
   - Save to `/public/templates/`

---

## 🖼️ Method 3: HTML → Screenshot

Create a simple HTML file and screenshot it:

```html
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #E0E0E0; padding: 8px; text-align: left; }
  th { background: #F5F5F5; font-weight: bold; font-size: 12px; }
  td { font-size: 11px; color: #333; }
  .col-label { font-size: 9px; color: #999; font-weight: normal; }
</style>
</head>
<body>
<table>
  <tr>
    <th><span class="col-label">A</span><br>code</th>
    <th><span class="col-label">B</span><br>name</th>
    <th><span class="col-label">C</span><br>parent_code</th>
  </tr>
  <tr>
    <td>IT</td>
    <td>IT Department</td>
    <td></td>
  </tr>
  <tr>
    <td>IT-DEV</td>
    <td>Development</td>
    <td>IT</td>
  </tr>
  <tr>
    <td>IT-OPS</td>
    <td>Operations</td>
    <td>IT</td>
  </tr>
</table>
</body>
</html>
```

1. Save as `departments-preview.html`
2. Open in browser
3. Zoom to make it ~800px wide
4. Screenshot the table
5. Crop and save as PNG

---

## ✅ Quality Checklist

Before saving your images, verify:

- [ ] Exactly **3 data rows** (plus header = 4 total rows)
- [ ] Column names match database exactly (`code`, `name`, `parent_code`, etc.)
- [ ] Header row is visually distinct (bold, background color)
- [ ] Gridlines are visible but subtle
- [ ] Text is crisp and readable
- [ ] No Excel window chrome visible (just cells)
- [ ] File size < 50KB
- [ ] Dimensions approximately 800×200px
- [ ] Saved in `/public/templates/` directory
- [ ] Named correctly: `preview-departments.png` and `preview-positions.png`

---

## 📦 Final File Structure

```
public/
  templates/
    ├── preview-departments.png      # 3 rows: IT, IT-DEV, IT-OPS
    ├── preview-positions.png        # 3 rows: positions examples
    ├── departments-template.xlsx     # (existing blank template)
    └── positions-template.xlsx       # (existing blank template)
```

---

## 🎯 Expected Result

### Departments Preview:
```
┌─────────┬─────────────────┬─────────────┐
│ A       │ B               │ C           │
│ code    │ name            │ parent_code │
├─────────┼─────────────────┼─────────────┤
│ IT      │ IT Department   │             │
│ IT-DEV  │ Development     │ IT          │
│ IT-OPS  │ Operations      │ IT          │
└─────────┴─────────────────┴─────────────┘
```

### Positions Preview:
```
┌──────────┬──────────────────┬────────────────┬──────────────┬────────────┬─────────┬────────────┬────────────┬─────────────────┐
│ A        │ B                │ C              │ D            │ E          │ F       │ G          │ H          │ I               │
│ code     │ title            │ department_code│ description  │ employment │ location│ salary_min │ salary_max │ salary_currency │
├──────────┼──────────────────┼────────────────┼──────────────┼────────────┼─────────┼────────────┼────────────┼─────────────────┤
│IT-DEV-01 │Senior Developer  │ IT-DEV         │Lead dev team │ Full-time  │ Remote  │ 80000      │ 120000     │ USD             │
│IT-DEV-02 │Junior Developer  │ IT-DEV         │Support dev   │ Full-time  │ Office  │ 50000      │ 70000      │ USD             │
│HR-MGR-01 │HR Manager        │ HR             │Manage HR ops │ Full-time  │ Office  │ 60000      │ 90000      │ USD             │
└──────────┴──────────────────┴────────────────┴──────────────┴────────────┴─────────┴────────────┴────────────┴─────────────────┘
```

---

## 💡 Tips

1. **Use Real Excel**: Screenshots from actual Excel look more authentic than designs
2. **Keep it Simple**: Don't over-style, users should recognize it as Excel
3. **High Contrast**: Ensure text is readable on all devices
4. **Test Scaling**: View at different sizes to ensure readability
5. **Dark Mode**: Consider creating dark mode versions (optional)

---

## ⚡ Quick Start (5 minutes)

1. Open Excel
2. Type the data from specifications above
3. Bold row 1, add gray background
4. Take screenshot of cells
5. Crop to ~800×200px
6. Save as PNG in `/public/templates/`
7. Done! ✅

---

**These images are the key to the new UX. Users will see them immediately and understand the format without downloads.** 🎯
