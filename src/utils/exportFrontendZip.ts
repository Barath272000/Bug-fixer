import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function downloadFrontendZip() {
  const zip = new JSZip();

  // Root frontend configs
  zip.file(
    'frontend/package.json',
    JSON.stringify(
      {
        name: 'bugfixer-ai-frontend',
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc -b && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          clsx: '^2.1.1',
          'lucide-react': '^0.474.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          recharts: '^2.15.1',
          'tailwind-merge': '^3.0.1'
        },
        devDependencies: {
          '@tailwindcss/vite': '^4.0.0',
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
          '@vitejs/plugin-react': '^4.3.4',
          tailwindcss: '^4.0.0',
          typescript: '~5.7.2',
          vite: '^6.1.0'
        }
      },
      null,
      2
    )
  );

  zip.file(
    'frontend/vite.config.ts',
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});
`
  );

  zip.file(
    'frontend/tsconfig.json',
    `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
`
  );

  zip.file(
    'frontend/index.html',
    `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BugFixer.ai - Autonomous AI Debugging & Repair Workspace</title>
  </head>
  <body class="bg-[#0B0E14] text-[#E2E8F0] antialiased overflow-hidden">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
  );

  zip.file(
    'frontend/README.md',
    `# BugFixer.ai - Frontend Template (Professional Polish)

A dark-themed, IDE-grade developer workspace UI built with:
- **React 19 + TypeScript**
- **Tailwind CSS v4**
- **Lucide Icons**
- **Recharts**

## 🚀 Quickstart

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build production bundle:
\`\`\`bash
npm run build
\`\`\`
`
  );

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'bugfixer-ai-frontend-template.zip');
}
