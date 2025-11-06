/**
 * Tree Parser Utility
 *
 * Parses ASCII tree format into structured data for FileTree component
 */

export interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: TreeNode[];
  path: string;
  depth: number;
}

/**
 * Parse ASCII tree format into structured TreeNode array
 *
 * Supports formats:
 * - ├── file.txt
 * - └── folder/
 * - │   ├── nested.txt
 *
 * @param treeString - ASCII tree representation
 * @returns Array of root-level TreeNode objects
 */
export function parseTree(treeString: string): TreeNode[] {
  const lines = treeString.split('\n').filter((line) => line.trim());
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; depth: number }[] = [];

  for (const line of lines) {
    // Calculate depth by counting visual indentation
    // Each level is 4 characters: either "│   ", "├── ", "└── ", or "    "
    let rawDepth = 0;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '│' || char === '├' || char === '└') {
        // Found a tree character - this represents one level
        rawDepth++;
        i++;
        // Skip the following spaces/dashes (usually "── " or "   ")
        while (i < line.length && (line[i] === ' ' || line[i] === '─')) {
          i++;
        }
      } else if (char === ' ') {
        // Count contiguous spaces
        let spaceCount = 0;
        while (i < line.length && line[i] === ' ') {
          spaceCount++;
          i++;
        }
        // Each 4 spaces = 1 depth level
        rawDepth += Math.floor(spaceCount / 4);

        // If we hit a non-space after counting, we're done with indentation
        if (i < line.length && line[i] !== '│' && line[i] !== '├' && line[i] !== '└') {
          break;
        }
      } else {
        // Hit actual content, done counting depth
        break;
      }
    }

    // Strip all tree drawing characters to get clean name
    const cleanLineMatch = line.match(/^[│├└─\s]*(.+)$/);
    if (!cleanLineMatch) continue;

    const name = cleanLineMatch[1].trim();

    // Skip empty lines or lines with only tree characters
    if (!name || name.match(/^[├└│─\s]+$/)) continue;

    // Determine if it's a folder (ends with /) or file
    const isFolder = name.endsWith('/');
    const cleanName = isFolder ? name.slice(0, -1) : name;

    // Extract extension for files
    const extension =
      !isFolder && cleanName.includes('.') ? '.' + cleanName.split('.').pop() : undefined;

    // Adjust raw depth: connectors (├ └) are at the current level, not parent
    const hasConnector = line.includes('├') || line.includes('└');
    const nodeDepth = Math.max(0, rawDepth - (hasConnector ? 1 : 0));

    // Pop stack to find correct parent
    while (stack.length > 0 && stack[stack.length - 1].node.depth >= nodeDepth) {
      stack.pop();
    }

    // Build path from parent
    const parentPath = stack.length > 0 ? stack[stack.length - 1].node.path : '';
    const path = parentPath ? `${parentPath}/${cleanName}` : cleanName;

    const node: TreeNode = {
      name: cleanName,
      type: isFolder ? 'folder' : 'file',
      extension,
      path,
      depth: nodeDepth,
      ...(isFolder && { children: [] }),
    };

    // Add to parent or root
    if (stack.length === 0) {
      root.push(node);
    } else {
      const parent = stack[stack.length - 1].node;
      if (parent.children) {
        parent.children.push(node);
      }
    }

    // Push to stack if it's a folder (use nodeDepth, not rawDepth!)
    if (isFolder) {
      stack.push({ node, depth: nodeDepth });
    }
  }

  return root;
}

/**
 * File type metadata for styling and icons
 */
export interface FileTypeConfig {
  icon: string;
  color: string;
}

/**
 * File type configurations
 */
export const FILE_TYPES: Record<string, FileTypeConfig> = {
  // JavaScript/TypeScript
  '': { icon: '🔷', color: '#3178c6' },
  '.tsx': { icon: '🔷', color: '#3178c6' },
  '.js': { icon: '📜', color: '#f7df1e' },
  '.jsx': { icon: '⚛️', color: '#61dafb' },
  '.mjs': { icon: '📜', color: '#f7df1e' },
  '.cjs': { icon: '📜', color: '#f7df1e' },

  // Svelte
  '.svelte': { icon: '⚡', color: '#ff3e00' },

  // Styles
  '.css': { icon: '🎨', color: '#563d7c' },
  '.scss': { icon: '💅', color: '#c6538c' },
  '.sass': { icon: '💅', color: '#c6538c' },
  '.less': { icon: '🎨', color: '#1d365d' },

  // Markup
  '.html': { icon: '🌐', color: '#e34c26' },
  '.xml': { icon: '📄', color: '#e34c26' },
  '.svg': { icon: '🖼️', color: '#ffb13b' },

  // Documentation
  '.md': { icon: '📝', color: '#ffffff' },
  '.mdx': { icon: '📝', color: '#ffffff' },
  '.txt': { icon: '📄', color: '#ffffff' },

  // Config/Data
  '.json': { icon: '⚙️', color: '#22c55e' },
  '.yaml': { icon: '⚙️', color: '#22c55e' },
  '.yml': { icon: '⚙️', color: '#22c55e' },
  '.toml': { icon: '⚙️', color: '#22c55e' },
  '.env': { icon: '🔐', color: '#ecd53f' },

  // Build/Package
  '.lock': { icon: '🔒', color: '#888888' },
  'package.json': { icon: '📦', color: '#22c55e' },
  'tsconfig.json': { icon: '🔧', color: '#3178c6' },
  'vite.config': { icon: '⚡', color: '#646cff' },
  'svelte.config.js': { icon: '⚡', color: '#ff3e00' },

  // Git
  '.gitignore': { icon: '🚫', color: '#f14e32' },
  '.gitattributes': { icon: '📋', color: '#f14e32' },

  // Shell
  '.sh': { icon: '🐚', color: '#89e051' },
  '.bash': { icon: '🐚', color: '#89e051' },
  '.zsh': { icon: '🐚', color: '#89e051' },

  // Folder
  folder: { icon: '📁', color: '#8be9fd' },
};

/**
 * Get file type configuration by filename or extension
 */
export function getFileType(name: string, extension?: string): FileTypeConfig {
  // Check exact filename match first (e.g., package.json)
  if (FILE_TYPES[name]) {
    return FILE_TYPES[name];
  }

  // Check extension
  if (extension && FILE_TYPES[extension]) {
    return FILE_TYPES[extension];
  }

  // Default
  return { icon: '📄', color: '#ffffff' };
}
