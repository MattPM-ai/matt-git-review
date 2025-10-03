# Mock Standup Demo Package

A complete, self-contained package for displaying AI-generated team standup summaries. Perfect for landing pages, demos, or prototyping.

## 📦 What's Included

```
mockStandupDemo/
├── README.md                          # This file
├── data/
│   └── mockStandupData.json          # 5 diverse team member profiles
├── components/
│   ├── StandupCard.tsx               # Individual standup card
│   ├── StandupGrid.tsx               # Main container component
│   └── StandupMetrics.tsx            # Activity metrics display
├── types/
│   └── standup.types.ts              # TypeScript interfaces
├── styles/
│   └── standup.css                   # Additional CSS (optional)
└── examples/
    └── usage-example.tsx             # Integration examples
```

## 🚀 Quick Start

### 1. Copy the Folder

Copy the entire `mockStandupDemo` folder into your project:

```bash
cp -r mockStandupDemo /path/to/your/project/
```

### 2. Basic Usage

```tsx
import { StandupGrid } from './mockStandupDemo/components/StandupGrid';
import mockStandupData from './mockStandupDemo/data/mockStandupData.json';

function MyLandingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <StandupGrid standups={mockStandupData} />
    </div>
  );
}
```

### 3. Import the CSS (Optional)

If you want the additional custom styles:

```tsx
import './mockStandupDemo/styles/standup.css';
```

## 📊 Data Structure

Each standup entry follows this structure:

```typescript
{
  username: string;           // GitHub username
  name: string;              // Display name
  avatar_url: string;        // Avatar image URL
  standup: {
    date: string;            // Date (YYYY-MM-DD)
    summary: string;         // Overall summary paragraph
    workDone: string[];      // Completed tasks
    workingOn: string[];     // Ongoing tasks
    concerns?: string;       // Optional concerns/blockers
    totalCommits: number;    // Commit count
    totalPRs: number;        // Pull request count
    totalIssues: number;     // Issues count
    totalManHoursMin: number; // Minimum estimated hours
    totalManHoursMax: number; // Maximum estimated hours
    manHoursRationale: string; // Time estimate explanation
  }
}
```

## 🎨 Components

### StandupGrid (Main Component)

The primary container that renders all standup cards.

**Props:**

```typescript
interface StandupGridProps {
  standups: StandupResponse[];  // Array of standup data
  className?: string;           // Additional CSS classes
  title?: string;               // Custom title (default: "Team Standup Summaries")
  showHeader?: boolean;         // Show/hide header (default: true)
}
```

**Example:**

```tsx
<StandupGrid 
  standups={mockStandupData}
  title="Yesterday's Activity"
  showHeader={true}
  className="max-w-6xl mx-auto"
/>
```

### StandupCard

Individual card component for a single team member.

**Props:**

```typescript
interface StandupCardProps {
  username: string;
  name: string;
  avatar_url: string;
  standup: StandupData;
  className?: string;
}
```

**Example:**

```tsx
<StandupCard
  username="sarah-chen"
  name="Sarah Chen"
  avatar_url="https://..."
  standup={standupData}
/>
```

### StandupMetrics

Displays activity metrics in a color-coded grid.

**Props:**

```typescript
interface StandupMetricsProps {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalManHoursMin: number;
  totalManHoursMax: number;
}
```

## 🎭 Demo Team Members

The package includes 5 diverse team member profiles:

1. **Sarah Chen** - Senior Full-Stack Developer (Backend/Database focus)
2. **Marcus Rodriguez** - Frontend Engineer (UI/UX focus)
3. **Aisha Patel** - DevOps Engineer (Infrastructure focus)
4. **Jordan Kim** - Junior Developer (Learning/Bug fixes)
5. **Alex Thompson** - Tech Lead (Code reviews/Architecture)

## 🎨 Customization

### Changing Colors

The components use Tailwind CSS classes. Modify colors by editing the component files:

- **Commits:** `text-green-600`
- **PRs:** `text-blue-600`
- **Issues:** `text-purple-600`
- **Hours:** `text-orange-600`

### Custom Styling

Add custom styles via the `className` prop:

```tsx
<StandupGrid 
  standups={mockStandupData}
  className="bg-gradient-to-b from-blue-50 to-white p-8 rounded-xl"
/>
```

### Modifying Layout

For multi-column layouts:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {standups.map((standup) => (
    <StandupCard key={standup.username} {...standup} />
  ))}
</div>
```

## 📝 Adding Custom Data

To add your own team members:

1. Open `data/mockStandupData.json`
2. Add new entries following the data structure
3. Generate avatars using:
   - `https://ui-avatars.com/api/?name=First+Last&size=150&background=6366f1&color=fff`
   - Replace `First+Last` with the name
   - Change `background` hex value for different colors

## 🔧 Requirements

- **React** 16.8+ (hooks support)
- **Tailwind CSS** (configured in your project)
- **TypeScript** (optional but recommended)

## 💡 Usage Examples

See `examples/usage-example.tsx` for 8 different integration examples:

1. Basic usage
2. Custom title and header
3. Minimal (no header)
4. Custom container styling
5. Filtered standups
6. Landing page hero section
7. Individual card component
8. Multi-column responsive grid

## 🎯 Best Practices

1. **Performance:** The components are lightweight and render efficiently
2. **Accessibility:** Uses semantic HTML and ARIA-friendly structure
3. **Responsive:** Works on mobile, tablet, and desktop
4. **Type-Safe:** Full TypeScript support with proper interfaces
5. **Customizable:** Easy to modify colors, layout, and content

## 📱 Responsive Behavior

- **Mobile (< 768px):** Single column, stacked cards
- **Tablet (768-1024px):** Single or dual column based on container
- **Desktop (> 1024px):** Full-width cards or multi-column grid

## 🐛 Troubleshooting

### Images Not Loading

If avatars don't display, check:
1. Network connectivity
2. Avatar URLs are valid
3. No CSP (Content Security Policy) restrictions

### Tailwind Classes Not Working

Ensure Tailwind is properly configured:
1. Check `tailwind.config.js` includes the component paths
2. Verify Tailwind CSS is imported in your global styles
3. Restart your dev server after adding new paths

### TypeScript Errors

If you see type errors:
1. Ensure the types are properly imported
2. Use type assertions if needed: `as StandupResponse[]`
3. Check your `tsconfig.json` includes the component paths

## 📄 License

This demo package is provided as-is for demonstration purposes. Feel free to modify and use in your projects.

## 🤝 Contributing

Found an issue or want to improve the demo? This is a standalone demo package - feel free to fork and customize for your needs!

## 📧 Support

For questions or issues, refer to the examples in `examples/usage-example.tsx` or check the inline documentation in each component file.

---

**Happy Coding!** 🚀

