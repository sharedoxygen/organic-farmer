# OFMS Help System Guide

## Overview

The Organic Farm Management System (OFMS) includes a fully integrated help system designed to provide contextual assistance, tutorials, FAQs, and keyboard shortcuts throughout the application.

## Features

### 1. **Global Help Access**
- **Help Button**: Available in the header for quick access
- **Keyboard Shortcut**: Press `F1` anywhere in the application
- **User Menu**: Access help through the user dropdown menu
- **Settings Page**: Dedicated help card in administration settings

### 2. **Help Modal Interface**
The help modal provides four main sections:

#### Help Content
- Categorized documentation for all OFMS modules
- Contextual help based on current page
- Related topics for deeper exploration
- Video tutorials (when available)
- Search functionality across all help content

#### FAQs
- Common questions organized by category
- Helpfulness tracking
- Related FAQ suggestions
- Real-time search

#### Interactive Tutorials
- **Getting Started Tutorial**: For new users
- **Batch Creation Tutorial**: Step-by-step production guide
- Progress tracking across sessions
- Role-based tutorial recommendations
- Skipable and resumable tutorials

#### Keyboard Shortcuts
- Global shortcuts available everywhere
- Context-specific shortcuts for current page
- Organized by category
- Easy-to-read keyboard combinations

### 3. **Contextual Tooltips**
Tooltips provide quick help without opening the full help modal:
```jsx
import { Tooltip } from '@/components/ui';

<Tooltip content="Quality score is calculated based on inspection results">
  <div className="quality-score">95%</div>
</Tooltip>
```

### 4. **Interactive Tutorial System**
- Spotlight highlighting of UI elements
- Step-by-step guidance
- Progress indicators
- Keyboard navigation (Arrow keys)
- Auto-start for new users

## Usage Guide

### For End Users

#### Opening Help
1. **Click the Help Button** in the header (? icon)
2. **Press F1** anywhere in the application
3. **Select "Help & Support"** from the user menu
4. **Click "Help & Support"** card in Settings

#### Using the Help Modal
- **Search**: Type keywords in the search bar or press `Ctrl+K` when help is open
- **Browse**: Click category cards to explore topics
- **Navigate**: Use tabs to switch between Content, FAQs, Tutorials, and Shortcuts
- **Close**: Click X, press Escape, or click outside the modal

#### Taking Tutorials
1. Open Help (F1)
2. Go to Tutorials tab
3. Click "Start Tutorial" on desired tutorial
4. Follow on-screen instructions
5. Use arrow keys or buttons to navigate steps
6. Press Escape to skip tutorial

### For Developers

#### Adding New Help Content

1. **Add to Help Content Database** (`src/lib/services/helpContent.ts`):
```typescript
const helpContents: HelpContent[] = [
  // ... existing content
  {
    id: 'new-feature-help',
    title: 'Using the New Feature',
    content: 'Detailed explanation of how the feature works...',
    category: 'production', // or appropriate category
    tags: ['new', 'feature', 'guide'],
    relatedTopics: ['related-help-id'],
    videoUrl: '/tutorials/new-feature.mp4', // optional
    lastUpdated: new Date()
  }
];
```

2. **Add Contextual Tooltips**:
```typescript
const tooltips: HelpTooltip[] = [
  // ... existing tooltips
  {
    id: 'new-feature-tooltip',
    targetElement: '.new-feature-class',
    content: 'Quick tip about this feature',
    position: 'top',
    delay: 500
  }
];
```

3. **Create New Tutorials**:
```typescript
const tutorials: HelpTutorial[] = [
  // ... existing tutorials
  {
    id: 'new-feature-tutorial',
    title: 'Learn the New Feature',
    description: 'Step-by-step guide to using the new feature',
    steps: [
      {
        id: 'step1',
        title: 'First Step',
        content: 'Click on the new feature button...',
        target: '.new-feature-button',
        action: 'click',
        position: 'bottom',
        skipable: true
      }
      // ... more steps
    ],
    targetRole: ['MANAGER', 'ADMIN'] // optional role targeting
  }
];
```

4. **Add FAQs**:
```typescript
const faqs: FAQ[] = [
  // ... existing FAQs
  {
    id: 'faq-new-feature',
    question: 'How do I use the new feature?',
    answer: 'To use the new feature, navigate to...',
    category: 'production',
    helpful: 0,
    notHelpful: 0,
    relatedFAQs: ['faq-related-id']
  }
];
```

#### Using Help Components

**HelpButton Component**:
```jsx
import { HelpButton } from '@/components/ui';

// Default variant
<HelpButton />

// Compact variant
<HelpButton variant="compact" />

// Icon only variant
<HelpButton variant="icon" />

// Open specific category
<HelpButton category="production" />
```

**Tooltip Component**:
```jsx
import { Tooltip } from '@/components/ui';

<Tooltip 
  content="Helpful information here"
  position="top" // top, bottom, left, right
  delay={300} // milliseconds
>
  <div>Hover me for help</div>
</Tooltip>
```

**Using Help Context**:
```jsx
import { useHelp } from '@/components/HelpProvider';

function MyComponent() {
  const { openHelp, startTutorial } = useHelp();
  
  return (
    <button onClick={() => openHelp('production')}>
      Get Help
    </button>
  );
}
```

## Help Content Categories

1. **Getting Started** (`getting-started`)
   - System overview
   - Navigation guide
   - User roles and permissions

2. **Production** (`production`)
   - Batch management
   - Seed inventory
   - Harvest planning

3. **Inventory** (`inventory`)
   - Stock management
   - Supply tracking
   - Reorder points

4. **Sales** (`sales`)
   - Order processing
   - Customer management
   - Pricing strategies

5. **Quality** (`quality`)
   - Quality control process
   - Organic compliance
   - Food safety management

6. **Analytics** (`analytics`)
   - Dashboard metrics
   - Production analysis
   - Financial reporting

7. **Settings** (`settings`)
   - System configuration
   - User preferences
   - Notification settings

8. **Administration** (`admin`)
   - User management
   - Farm management
   - Multi-tenant features

## Keyboard Shortcuts

### Global Shortcuts
- `F1` - Open Help
- `Ctrl+K` - Search (when help is open)
- `Ctrl+N` - View notifications
- `Ctrl+D` - Go to dashboard
- `Escape` - Close help/tutorial

### Tutorial Navigation
- `→` Arrow Right - Next step
- `←` Arrow Left - Previous step
- `Escape` - Exit tutorial

## Customization

### Styling
Help components use CSS Modules and respect the current theme:
- Light theme: Dark tooltips on light background
- Dark theme: Light tooltips on dark background

### Tutorial Behavior
- Auto-start can be disabled by setting localStorage
- Progress is saved per user in localStorage
- Tutorials can be targeted to specific user roles

### Search Configuration
The search algorithm prioritizes:
1. Title matches (10 points)
2. Tag matches (5 points)
3. Content matches (2 points)

## Best Practices

1. **Keep Help Content Updated**
   - Review help content when features change
   - Update screenshots and videos regularly
   - Mark deprecated content clearly

2. **Write Clear Help Content**
   - Use simple, direct language
   - Include step-by-step instructions
   - Add visual aids where helpful

3. **Strategic Tooltip Placement**
   - Add tooltips to complex UI elements
   - Keep tooltip text concise
   - Use consistent positioning

4. **Tutorial Design**
   - Keep tutorials focused and short
   - Make steps actionable
   - Allow users to skip or pause

5. **FAQ Maintenance**
   - Monitor helpfulness ratings
   - Add new FAQs based on support tickets
   - Keep answers current

## Troubleshooting

### Common Issues

1. **Help button not appearing**
   - Check if HelpProvider is properly wrapped in layout
   - Verify HelpButton import in Header component

2. **Tutorials not starting**
   - Clear localStorage tutorial progress
   - Check browser console for errors
   - Verify tutorial target elements exist

3. **Tooltips not showing**
   - Ensure Tooltip component wraps the target element
   - Check z-index conflicts with other components
   - Verify tooltip content is provided

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('ofms-help-debug', 'true');
```

## Future Enhancements

1. **AI-Powered Help**
   - Natural language search
   - Contextual suggestions
   - Automated FAQ generation

2. **Video Integration**
   - Embedded video tutorials
   - Screen recording capabilities
   - Video transcripts

3. **Analytics**
   - Track help usage patterns
   - Identify common help searches
   - Measure tutorial completion rates

4. **Multilingual Support**
   - Translate help content
   - Localized keyboard shortcuts
   - Regional FAQ variations

## Support

For help system issues or questions:
- Email: support@ofms.com
- Documentation: This guide
- In-app: Press F1 for help 