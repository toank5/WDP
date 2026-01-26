# Frontend Setup - Complete Guide

## Tech Stack
- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **ESLint & Prettier** - Code quality and formatting

## Prerequisites
- Node.js v20.19+ or v22.12+ (recommended to upgrade from v22.11.0 for full compatibility)
- npm (comes with Node.js)

## Installation

Navigate to the `FE` directory and install dependencies:

```sh
cd FE
npm install
```

## Available Scripts

In the `FE` directory, you can run:

### `npm run dev`
Start the development server with hot module replacement (HMR). Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`
Build the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run preview`
Preview the production build locally.

### `npm run lint`
Run ESLint to check code quality and catch potential errors.

## shadcn/ui Setup

The project is fully configured for shadcn/ui:

1. **Configuration file**: `components.json` - Contains shadcn/ui settings
2. **Utils**: `src/lib/utils.ts` - Contains the `cn()` helper for class merging
3. **Tailwind configured**: CSS variables and theming in `src/index.css`

### Adding shadcn/ui Components

To add a new component (e.g., button):

```sh
npx shadcn@latest add button
```

This will:
- Download the component to `src/components/ui/`
- Install any required dependencies
- Make it available for use in your app

### Using Components

```tsx
import { Button } from '@/components/ui/button'

function MyComponent() {
  return <Button>Click me</Button>
}
```

## Project Structure

```
FE/
├── src/
│   ├── components/     # Your React components
│   │   └── ui/        # shadcn/ui components (auto-generated)
│   ├── lib/           # Utility functions
│   │   └── utils.ts   # cn() helper for Tailwind
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # Entry point
│   ├── index.css      # Global styles + Tailwind
│   └── App.css        # Component-specific styles
├── public/            # Static assets
├── components.json    # shadcn/ui configuration
├── tailwind.config.js # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
├── vite.config.js     # Vite configuration
└── package.json       # Dependencies and scripts
```

## Path Aliases

The project uses path aliases for clean imports:

- `@/` → `src/` directory

Example:
```tsx
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

## Theming

Tailwind CSS v4 with CSS variables for theming. Edit `src/index.css` to customize:

- Colors (primary, secondary, accent, etc.)
- Border radius
- Dark mode support (use `.dark` class on root element)

## Code Quality

- **ESLint**: Configured for React and TypeScript best practices
- **Prettier**: Set up with sensible defaults (`.prettierrc`)
- Use Prettier extension in VS Code for auto-formatting

## Notes

- The build uses Vite v6 (not rolldown-vite) for better compatibility
- Tailwind CSS v4 uses `@import "tailwindcss"` instead of `@tailwind` directives
- All components are fully typed with TypeScript
- Hot module replacement works out of the box in development

## Troubleshooting

### Build errors related to Node.js version
If you see engine compatibility warnings, consider upgrading Node.js to v22.12.0 or later.

### Tailwind classes not working
Make sure your files are included in `tailwind.config.js` content array.

### shadcn/ui components not found
Run `npx shadcn@latest add <component-name>` to install the component first.

## Next Steps

1. Start the dev server: `npm run dev`
2. Add shadcn/ui components as needed
3. Edit `src/App.tsx` to build your application
4. Enjoy building with a modern, type-safe stack!

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
