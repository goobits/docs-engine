/**
 * Markdown generator for API documentation
 * Converts parsed API items into formatted markdown
 */

import type {
  ApiItem,
  ApiFunction,
  ApiClass,
  ApiInterface,
  ApiTypeAlias,
  ApiEnum,
  ApiParameter,
  ApiProperty,
  ApiMethod,
  ApiMetadata,
  ParsedApiFile,
} from './api-parser.js';

/**
 * Configuration for markdown generation
 *
 * @public
 */
export interface MarkdownGeneratorConfig {
  /**
   * Base URL for type links (e.g., "/api")
   */
  baseUrl?: string;

  /**
   * Custom type link mappings
   */
  typeLinks?: Record<string, string>;

  /**
   * Whether to include source file links
   */
  includeSourceLinks?: boolean;

  /**
   * Repository base URL for source links
   */
  repoUrl?: string;

  /**
   * Branch or commit for source links
   */
  repoBranch?: string;
}

/**
 * Escape markdown special characters
 */
function escapeMarkdown(text: string): string {
  return text.replace(/[<>]/g, (char) => {
    return char === '<' ? '&lt;' : '&gt;';
  });
}

/**
 * Convert a type reference to a markdown link
 */
function linkType(type: string, config: MarkdownGeneratorConfig): string {
  // Handle custom type links
  if (config.typeLinks && config.typeLinks[type]) {
    return `[\`${escapeMarkdown(type)}\`](${config.typeLinks[type]})`;
  }

  // For complex types, escape but don't link
  if (type.includes('<') || type.includes('|') || type.includes('&') || type.includes('[')) {
    return `\`${escapeMarkdown(type)}\``;
  }

  // Built-in types don't need links
  const builtIns = [
    'string',
    'number',
    'boolean',
    'void',
    'any',
    'unknown',
    'never',
    'null',
    'undefined',
  ];
  if (builtIns.includes(type)) {
    return `\`${type}\``;
  }

  // Link to potential API page
  if (config.baseUrl) {
    return `[\`${escapeMarkdown(type)}\`](${config.baseUrl}/${type.toLowerCase()})`;
  }

  return `\`${escapeMarkdown(type)}\``;
}

/**
 * Generate metadata badges
 */
function generateBadges(metadata: ApiMetadata): string {
  const badges: string[] = [];

  if (metadata.deprecated) {
    badges.push('**⚠️ DEPRECATED**');
  }

  if (metadata.experimental) {
    badges.push('**🧪 EXPERIMENTAL**');
  }

  if (metadata.since) {
    badges.push(`**Added in:** ${metadata.since}`);
  }

  return badges.length > 0 ? `\n\n${badges.join(' · ')}\n` : '';
}

/**
 * Generate source file link
 */
function generateSourceLink(
  source: { file: string; line: number },
  config: MarkdownGeneratorConfig
): string {
  if (!config.includeSourceLinks || !config.repoUrl) {
    return '';
  }

  const branch = config.repoBranch || 'main';
  const file = source.file.replace(/\\/g, '/');
  const url = `${config.repoUrl}/blob/${branch}/${file}#L${source.line}`;

  return `\n\n**Source:** [${file}:${source.line}](${url})\n`;
}

/**
 * Generate parameter documentation
 */
function generateParameters(parameters: ApiParameter[], config: MarkdownGeneratorConfig): string {
  if (parameters.length === 0) {
    return '';
  }

  let md = '\n\n**Parameters:**\n\n';

  for (const param of parameters) {
    const optional = param.optional ? ' (optional)' : '';
    const defaultVal = param.defaultValue ? ` = \`${param.defaultValue}\`` : '';
    const type = linkType(param.type, config);
    const description = param.description || '';

    md += `- **\`${param.name}\`**${optional}: ${type}${defaultVal}`;
    if (description) {
      md += ` - ${description}`;
    }
    md += '\n';
  }

  return md;
}

/**
 * Generate return type documentation
 */
function generateReturns(
  returnType: string,
  returnDescription: string | undefined,
  config: MarkdownGeneratorConfig
): string {
  if (returnType === 'void') {
    return '';
  }

  const type = linkType(returnType, config);
  const description = returnDescription ? ` - ${returnDescription}` : '';

  return `\n\n**Returns:** ${type}${description}\n`;
}

/**
 * Generate example blocks
 */
function generateExamples(examples: Array<{ code: string; caption?: string }>): string {
  if (examples.length === 0) {
    return '';
  }

  let md = '\n\n**Examples:**\n\n';

  for (const example of examples) {
    if (example.caption) {
      md += `*${example.caption}*\n\n`;
    }
    md += `\`\`\`typescript\n${example.code}\n\`\`\`\n\n`;
  }

  return md;
}

/**
 * Generate documentation for a function
 */
function generateFunctionDocs(func: ApiFunction, config: MarkdownGeneratorConfig): string {
  let md = `## ${func.name}\n`;

  md += generateBadges(func.metadata);

  if (func.description) {
    md += `\n${func.description}\n`;
  }

  // Signature
  const typeParams =
    func.typeParameters && func.typeParameters.length > 0
      ? `<${func.typeParameters.join(', ')}>`
      : '';
  const params = func.parameters
    .map((p) => {
      const optional = p.optional ? '?' : '';
      const defaultVal = p.defaultValue ? ` = ${p.defaultValue}` : '';
      return `${p.name}${optional}: ${p.type}${defaultVal}`;
    })
    .join(', ');

  md += `\n\`\`\`typescript\nfunction ${func.name}${typeParams}(${params}): ${func.returnType}\n\`\`\`\n`;

  md += generateParameters(func.parameters, config);
  md += generateReturns(func.returnType, func.returnDescription, config);
  md += generateExamples(func.examples);

  if (func.metadata.deprecated) {
    md += `\n\n**Deprecation Notice:** ${func.metadata.deprecated}\n`;
  }

  md += generateSourceLink(func.source, config);

  md += '\n---\n\n';

  return md;
}

/**
 * Generate documentation for properties
 */
function generateProperties(properties: ApiProperty[], config: MarkdownGeneratorConfig): string {
  if (properties.length === 0) {
    return '';
  }

  let md = '\n\n### Properties\n\n';

  for (const prop of properties) {
    const readonly = prop.readonly ? ' (readonly)' : '';
    const optional = prop.optional ? ' (optional)' : '';
    const type = linkType(prop.type, config);

    md += `#### \`${prop.name}\`${readonly}${optional}\n\n`;
    md += `**Type:** ${type}\n`;

    if (prop.description) {
      md += `\n${prop.description}\n`;
    }

    md += '\n';
  }

  return md;
}

/**
 * Generate documentation for methods
 */
function generateMethods(methods: ApiMethod[], config: MarkdownGeneratorConfig): string {
  if (methods.length === 0) {
    return '';
  }

  let md = '\n\n### Methods\n\n';

  for (const method of methods) {
    md += `#### ${method.name}()\n`;

    md += generateBadges(method.metadata);

    if (method.description) {
      md += `\n${method.description}\n`;
    }

    md += generateParameters(method.parameters, config);
    md += generateReturns(method.returnType, method.returnDescription, config);

    md += '\n';
  }

  return md;
}

/**
 * Generate documentation for a class
 */
function generateClassDocs(cls: ApiClass, config: MarkdownGeneratorConfig): string {
  let md = `## ${cls.name}\n`;

  md += generateBadges(cls.metadata);

  if (cls.description) {
    md += `\n${cls.description}\n`;
  }

  // Signature
  const typeParams =
    cls.typeParameters && cls.typeParameters.length > 0 ? `<${cls.typeParameters.join(', ')}>` : '';
  const extendsClause = cls.extends ? ` extends ${cls.extends}` : '';
  const implementsClause =
    cls.implements && cls.implements.length > 0 ? ` implements ${cls.implements.join(', ')}` : '';

  md += `\n\`\`\`typescript\nclass ${cls.name}${typeParams}${extendsClause}${implementsClause}\n\`\`\`\n`;

  // Constructor
  if (cls.constructorDoc) {
    md += '\n\n### Constructor\n\n';
    if (cls.constructorDoc.description) {
      md += `${cls.constructorDoc.description}\n`;
    }
    md += generateParameters(cls.constructorDoc.parameters, config);
  }

  md += generateProperties(cls.properties, config);
  md += generateMethods(cls.methods, config);
  md += generateExamples(cls.examples);

  if (cls.metadata.deprecated) {
    md += `\n\n**Deprecation Notice:** ${cls.metadata.deprecated}\n`;
  }

  md += generateSourceLink(cls.source, config);

  md += '\n---\n\n';

  return md;
}

/**
 * Generate documentation for an interface
 */
function generateInterfaceDocs(iface: ApiInterface, config: MarkdownGeneratorConfig): string {
  let md = `## ${iface.name}\n`;

  md += generateBadges(iface.metadata);

  if (iface.description) {
    md += `\n${iface.description}\n`;
  }

  // Signature
  const typeParams =
    iface.typeParameters && iface.typeParameters.length > 0
      ? `<${iface.typeParameters.join(', ')}>`
      : '';
  const extendsClause =
    iface.extends && iface.extends.length > 0 ? ` extends ${iface.extends.join(', ')}` : '';

  md += `\n\`\`\`typescript\ninterface ${iface.name}${typeParams}${extendsClause}\n\`\`\`\n`;

  md += generateProperties(iface.properties, config);
  md += generateMethods(iface.methods, config);
  md += generateExamples(iface.examples);

  if (iface.metadata.deprecated) {
    md += `\n\n**Deprecation Notice:** ${iface.metadata.deprecated}\n`;
  }

  md += generateSourceLink(iface.source, config);

  md += '\n---\n\n';

  return md;
}

/**
 * Generate documentation for a type alias
 */
function generateTypeAliasDocs(type: ApiTypeAlias, config: MarkdownGeneratorConfig): string {
  let md = `## ${type.name}\n`;

  md += generateBadges(type.metadata);

  if (type.description) {
    md += `\n${type.description}\n`;
  }

  // Signature
  const typeParams =
    type.typeParameters && type.typeParameters.length > 0
      ? `<${type.typeParameters.join(', ')}>`
      : '';

  md += `\n\`\`\`typescript\ntype ${type.name}${typeParams} = ${type.definition}\n\`\`\`\n`;

  md += generateExamples(type.examples);

  if (type.metadata.deprecated) {
    md += `\n\n**Deprecation Notice:** ${type.metadata.deprecated}\n`;
  }

  md += generateSourceLink(type.source, config);

  md += '\n---\n\n';

  return md;
}

/**
 * Generate documentation for an enum
 */
function generateEnumDocs(enumItem: ApiEnum, config: MarkdownGeneratorConfig): string {
  let md = `## ${enumItem.name}\n`;

  md += generateBadges(enumItem.metadata);

  if (enumItem.description) {
    md += `\n${enumItem.description}\n`;
  }

  md += '\n\n### Members\n\n';

  for (const member of enumItem.members) {
    const value = member.value !== undefined ? ` = ${JSON.stringify(member.value)}` : '';
    md += `- **\`${member.name}\`**${value}`;
    if (member.description) {
      md += ` - ${member.description}`;
    }
    md += '\n';
  }

  md += generateExamples(enumItem.examples);

  if (enumItem.metadata.deprecated) {
    md += `\n\n**Deprecation Notice:** ${enumItem.metadata.deprecated}\n`;
  }

  md += generateSourceLink(enumItem.source, config);

  md += '\n---\n\n';

  return md;
}

/**
 * Generate markdown documentation for an API item
 *
 * @public
 */
export function generateMarkdown(item: ApiItem, config: MarkdownGeneratorConfig = {}): string {
  switch (item.kind) {
    case 'function':
      return generateFunctionDocs(item, config);
    case 'class':
      return generateClassDocs(item, config);
    case 'interface':
      return generateInterfaceDocs(item, config);
    case 'type':
      return generateTypeAliasDocs(item, config);
    case 'enum':
      return generateEnumDocs(item, config);
    default:
      return '';
  }
}

/**
 * Group API items by category
 *
 * @public
 */
export function groupByCategory(items: ApiItem[]): Map<string, ApiItem[]> {
  const groups = new Map<string, ApiItem[]>();

  for (const item of items) {
    const category = item.metadata.category || 'Uncategorized';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)?.push(item);
  }

  // Sort items within each group alphabetically
  for (const [, groupItems] of groups) {
    groupItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}

/**
 * Generate a complete API documentation file
 *
 * @public
 */
export function generateApiDocFile(
  parsedFile: ParsedApiFile,
  config: MarkdownGeneratorConfig = {}
): { content: string; fileName: string } {
  const { file, items } = parsedFile;

  // Determine file name from source file
  const fileName = file.split('/').pop()?.replace('.ts', '') || 'api';

  let content = `# ${fileName}\n\n`;
  content += `> Auto-generated API documentation from \`${file}\`\n\n`;

  // Group by category
  const groups = groupByCategory(items);

  // Generate TOC
  content += '## Table of Contents\n\n';
  for (const [category, groupItems] of groups) {
    content += `### ${category}\n\n`;
    for (const item of groupItems) {
      content += `- [${item.name}](#${item.name.toLowerCase()})\n`;
    }
    content += '\n';
  }

  content += '---\n\n';

  // Generate documentation for each group
  for (const [category, groupItems] of groups) {
    if (category !== 'Uncategorized') {
      content += `# ${category}\n\n`;
    }

    for (const item of groupItems) {
      content += generateMarkdown(item, config);
    }
  }

  return {
    content,
    fileName: `${fileName}.md`,
  };
}

/**
 * Generate index file for multiple API documentation files
 *
 * @public
 */
export function generateIndexFile(files: Array<{ fileName: string; items: ApiItem[] }>): string {
  let content = '# API Reference\n\n';
  content += 'Auto-generated API documentation.\n\n';

  content += '## Modules\n\n';

  for (const file of files) {
    const moduleName = file.fileName.replace('.md', '');
    content += `### [${moduleName}](./${file.fileName})\n\n`;

    // List exported items
    const functions = file.items.filter((i) => i.kind === 'function');
    const classes = file.items.filter((i) => i.kind === 'class');
    const interfaces = file.items.filter((i) => i.kind === 'interface');
    const types = file.items.filter((i) => i.kind === 'type');
    const enums = file.items.filter((i) => i.kind === 'enum');

    if (functions.length > 0) {
      content += `**Functions:** ${functions.map((f) => f.name).join(', ')}\n\n`;
    }
    if (classes.length > 0) {
      content += `**Classes:** ${classes.map((c) => c.name).join(', ')}\n\n`;
    }
    if (interfaces.length > 0) {
      content += `**Interfaces:** ${interfaces.map((i) => i.name).join(', ')}\n\n`;
    }
    if (types.length > 0) {
      content += `**Types:** ${types.map((t) => t.name).join(', ')}\n\n`;
    }
    if (enums.length > 0) {
      content += `**Enums:** ${enums.map((e) => e.name).join(', ')}\n\n`;
    }
  }

  return content;
}
