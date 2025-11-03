# Evaluation Page Enterprise Redesign - Visual Guide

**Quick visual reference for the redesigned evaluation experience**

---

## 🎨 Before & After Comparison

### Before
- Basic header with minimal context
- Factor stepper hidden in sidebar
- Dimension info small and easy to miss
- No persistent context awareness
- Generic questionnaire design

### After
- **✅ Persistent context bar** showing Role → Factor → Dimension
- **✅ Prominent factor progress timeline** with visual states
- **✅ Enhanced dimension header** with progress and description
- **✅ Clean, focused questionnaire** with reduced visual noise
- **✅ Smooth enterprise-grade animations** throughout

---

## 📊 Information Hierarchy

```
┌─────────────────────────────────────────┐
│ LEVEL 1: Role Context (Who)            │
│ → Position Title, Code, Department     │
├─────────────────────────────────────────┤
│ LEVEL 2: Factor Context (What Area)    │
│ → Current Factor, Progress, State      │
├─────────────────────────────────────────┤
│ LEVEL 3: Dimension Context (What Skill)│
│ → Dimension Name, Number, Description  │
├─────────────────────────────────────────┤
│ LEVEL 4: Question Context (What's Next)│
│ → Question Text, Options, Help         │
└─────────────────────────────────────────┘
```

---

## 🎯 Key Visual Elements

### 1. Context Bar (Always Visible)

**Desktop:**
```
┌────────────────────────────────────────────────────────┐
│ [🏢 Evaluating Role]  |  [🎯 Current Factor]  |  [✨ Current Dimension] │
│  Senior Engineer          Technical Expertise      Problem Solving        │
│  ENG-001                  2/4 dimensions            5 of 12                │
│                                                                            │
│ ████████████████████████░░░░░░░░░░░░░░░ 65%                              │
└────────────────────────────────────────────────────────┘
```

**Colors:**
- Role: Primary color (blue in default theme)
- Factor: Blue-600 (distinct from primary)
- Dimension: Purple-600
- Progress: Gradient (blue → purple → pink)

### 2. Factor Progress Timeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ ✅ Factor 1 │ ── │ 🎯 Factor 2 │ ── │ 🔒 Factor 3 │ ── │ 🔒 Factor 4 │
│             │    │             │    │             │    │             │
│ Knowledge   │    │ Technical   │    │ Leadership  │    │ Strategic   │
│             │    │             │    │             │    │             │
│ 4/4  100%   │    │ 2/3   67%   │    │ 0/5    0%   │    │ 0/4    0%   │
│ ████████    │    │ █████░░░    │    │ ░░░░░░░░    │    │ ░░░░░░░░    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
   ✓ Complete         ⚡ Active         🔒 Locked          🔒 Locked
   Green bg          Primary ring       Muted              Muted
   Clickable         Current            Not clickable      Not clickable
```

### 3. Dimension Header

```
┌───────────────────────────────────────────────────┐
│ [🎯 Dimension 5 of 12] [████████░░░░ 65%]         │
│                                                   │
│  [✨]  Problem Solving & Critical Analysis        │
│         Evaluation Dimension • PS-001             │
│                                                   │
│  [ℹ️]  Measures ability to analyze complex        │
│        problems and develop effective solutions   │
└───────────────────────────────────────────────────┘
```

### 4. Questionnaire Card

```
┌───────────────────────────────────────────────────┐
│ [🔵 Question 1]                  [✅ 3 answered]  │
│                                                   │
│ Does this role require advanced technical        │
│ problem-solving capabilities?                     │
│                                                   │
│ [ℹ️]  Consider the complexity of technical       │
│       challenges this position typically faces    │
│                                                   │
│ ┌───────────────────────────────────────────┐    │
│ │ No, basic problem-solving is sufficient  │ ○  │
│ └───────────────────────────────────────────┘    │
│                                                   │
│ ┌───────────────────────────────────────────┐    │
│ │ Yes, requires advanced problem-solving   │ ✓  │
│ └───────────────────────────────────────────┘    │
│    (Selected: Primary bg, check icon)            │
│                                                   │
│ ┌───────────────────────────────────────────┐    │
│ │ Highly advanced, expert-level required   │ ○  │
│ └───────────────────────────────────────────┘    │
└───────────────────────────────────────────────────┘
```

---

## 🎬 Animation Flow

### Page Load (0.7s total)
```
0.0s: ┌────────┐ Header slides down
0.1s:    │🏢│    Icon rotates in
0.2s:    ├──┤    Role info appears
0.3s: ┌──────────┐ Context bar appears
0.4s: [F1][F2][F3] Factor cards stagger
0.6s:    ┌────┐  Dimension header
0.7s:    │ Q1 │  Questionnaire ready
```

### Dimension Change (0.3s)
```
Exit:  Current fades out & moves up (-20px)
Wait:  Brief pause
Enter: New fades in & moves down from (+20px)
```

### Answer Selection (0.3s)
```
Hover:  Button scales to 1.01
        Subtle gradient appears
        Shadow increases

Click:  Button scales to 0.99
        Check icon bounces & rotates
        Primary color fills background
        Ring appears around button
```

---

## 📱 Responsive Behavior

### Desktop (≥1024px)
- Full context bar with three sections
- Horizontal factor timeline
- Wide questionnaire layout
- All features visible

### Tablet (640px - 1024px)
- Compressed context bar
- Simplified factor timeline
- Medium questionnaire width
- Some condensed elements

### Mobile (<640px)
- Compact context bar (2 lines)
- Factor: Large card + dots
- Narrow questionnaire
- Stack layout throughout

---

## 🎨 Color System Quick Reference

### Context Colors
```css
Role (Primary):
  • Background: primary/5
  • Border: primary/10
  • Icon: primary
  • Example: Blue tones

Factor (Blue):
  • Background: blue-500/5
  • Border: blue-500/10
  • Icon: blue-600
  • Example: Distinct blue

Dimension (Purple):
  • Background: purple-500/5
  • Border: purple-500/10
  • Icon: purple-600
  • Example: Purple accent
```

### Status Colors
```css
Completed:
  • Background: green-500/10
  • Border: green-500/30
  • Icon: green-500 (✅)
  • Text: green-700

Current:
  • Background: primary/10
  • Border: primary
  • Ring: ring-2 ring-primary/20
  • Icon: Circle (filled)

Upcoming:
  • Background: muted/30
  • Border: border/50
  • Icon: Lock (🔒)
  • Text: muted-foreground
```

---

## 🔍 Visual States

### Factor Cards

**Completed** ✅
```
┌─────────────┐
│ ✅ Factor 1 │ ← Green theme
│ Knowledge   │
│ 4/4  100%   │
│ ████████    │ ← Green bar
└─────────────┘
```

**Current** 🎯
```
┌═════════════┐ ← Primary ring
│ 🎯 Factor 2 │ ← Primary theme
│ Technical   │ ← Pulse indicator •
│ 2/3   67%   │
│ █████░░░    │ ← Primary bar
└═════════════┘
```

**Upcoming** 🔒
```
┌─────────────┐
│ 🔒 Factor 3 │ ← Muted theme
│ Leadership  │ ← Disabled look
│ 0/5    0%   │
│ ░░░░░░░░    │ ← Empty bar
└─────────────┘
```

### Answer Buttons

**Unselected**
```
┌──────────────────────────────────┐
│ Answer option text               │ ○
└──────────────────────────────────┘
• Outline style
• Empty circle indicator
• Subtle hover effect
```

**Selected**
```
┌══════════════════════════════════┐
│ Answer option text               │ ✓
└══════════════════════════════════┘
• Primary background
• Check in circle
• Ring effect
```

**Hover** (unselected)
```
┌──────────────────────────────────┐
│ Answer option text               │ ⊙
└──────────────────────────────────┘
• Scale 1.01
• Gradient overlay
• Slight shadow
```

---

## 📊 Progress Indicators

### Overall Progress Bar
```
Progress: ████████████████████░░░░░░░░░░ 65%

• Gradient colors: blue → purple → pink
• Smooth fill animation (0.6s)
• Percentage updates with fade
```

### Factor Progress Bar
```
2/3 dimensions: █████░░░ 67%

• Solid color (matches factor state)
• Mini size (h-1.5)
• Fast animation (0.5s)
```

### Dimension Progress Badge
```
[🎯 Dimension 5 of 12] [████████░░░░]

• Inline with dimension header
• Shows X of Y format
• Mini progress bar
• Syncs with overall progress
```

---

## 🎯 Touch Targets (Mobile)

| Element | Target Size | Notes |
|---------|-------------|-------|
| Answer buttons | 72px min | Comfortable tap |
| Factor dots | 48px touch area | Even if visual is smaller |
| Context badges | 44px min | Readable + tappable |
| Navigation buttons | 48px min | Standard mobile size |

---

## ✨ Polish Details

### Micro-interactions
- Button hover: Scale + shadow
- Button press: Scale down feedback
- Icon selection: Rotate + bounce
- Progress fill: Smooth ease-out
- Card hover: Subtle lift

### Blur Effects
- Header: backdrop-blur-xl (strong)
- Context bar: No blur (solid)
- Cards: backdrop-blur-sm (subtle)

### Gradients
- Progress bar: Multi-color gradient
- Text: Subtle foreground gradient
- Backgrounds: Very subtle gradients
- Buttons: Hover overlay gradients

---

## 🚀 Performance Notes

- All animations: 60fps target
- Smooth transitions: 300-500ms
- No layout shifts
- Optimized re-renders
- Lazy load where possible

---

## 📝 Quick Start

To implement this design:

1. **Import components**
```tsx
import { EvaluationContextBar } from '@/components/evaluation/EvaluationContextBar';
import { FactorProgressIndicator } from '@/components/evaluation/FactorProgressIndicator';
```

2. **Use in layout**
```tsx
<EvaluationHeader {...} />
<EvaluationContextBar {...} />
<FactorProgressIndicator {...} />
<DimensionQuestionCard {...} />
```

3. **Provide data**
```tsx
// Calculate dimension number
let dimensionNumber = 0;
for (let i = 0; i < currentFactorIndex; i++) {
  dimensionNumber += factors[i].dimensions.length;
}
dimensionNumber += currentDimensionIndex + 1;
```

---

**End of Visual Guide**
