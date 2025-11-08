/**
 * TypeScript API parser using ts-morph
 * Extracts functions, classes, interfaces, types, and enums from TypeScript source files
 */

import {
  Project,
  type SourceFile,
  SyntaxKind,
  Node,
  type FunctionDeclaration,
  type ClassDeclaration,
  type InterfaceDeclaration,
  type TypeAliasDeclaration,
  type EnumDeclaration,
  type ParameterDeclaration,
  type JSDocableNode,
} from 'ts-morph';

/**
 * Represents a parsed parameter from a function or method
 * @public
 */
export interface ApiParameter {
  name: string;
  type: string;
  description?: string;
  optional: boolean;
  defaultValue?: string;
}

/**
 * Represents a parsed JSDoc example
 * @public
 */
export interface ApiExample {
  code: string;
  caption?: string;
}

/**
 * Represents metadata extracted from JSDoc tags
 * @public
 */
export interface ApiMetadata {
  deprecated?: string;
  since?: string;
  experimental?: boolean;
  category?: string;
  customTags?: Record<string, string>;
}

/**
 * Base interface for all API items
 * @public
 */
export interface ApiItemBase {
  name: string;
  description?: string;
  source: {
    file: string;
    line: number;
  };
  examples: ApiExample[];
  metadata: ApiMetadata;
}

/**
 * Represents a parsed function
 * @public
 */
export interface ApiFunction extends ApiItemBase {
  kind: 'function';
  signature: string;
  parameters: ApiParameter[];
  returnType: string;
  returnDescription?: string;
  typeParameters?: string[];
}

/**
 * Represents a property or method parameter
 *
 * @public
 */
export interface ApiProperty {
  name: string;
  type: string;
  description?: string;
  optional: boolean;
  readonly: boolean;
}

/**
 * Represents a method in a class or interface
 *
 * @public
 */
export interface ApiMethod {
  name: string;
  description?: string;
  signature: string;
  parameters: ApiParameter[];
  returnType: string;
  returnDescription?: string;
  metadata: ApiMetadata;
}

/**
 * Represents a parsed class
 *
 * @public
 */
export interface ApiClass extends ApiItemBase {
  kind: 'class';
  signature: string;
  typeParameters?: string[];
  extends?: string;
  implements?: string[];
  properties: ApiProperty[];
  methods: ApiMethod[];
  constructorDoc?: {
    description?: string;
    parameters: ApiParameter[];
  };
}

/**
 * Represents a parsed interface
 *
 * @public
 */
export interface ApiInterface extends ApiItemBase {
  kind: 'interface';
  signature: string;
  typeParameters?: string[];
  extends?: string[];
  properties: ApiProperty[];
  methods: ApiMethod[];
}

/**
 * Represents a parsed type alias
 *
 * @public
 */
export interface ApiTypeAlias extends ApiItemBase {
  kind: 'type';
  signature: string;
  typeParameters?: string[];
  definition: string;
}

/**
 * Represents a parsed enum
 *
 * @public
 */
export interface ApiEnum extends ApiItemBase {
  kind: 'enum';
  members: Array<{
    name: string;
    value?: string | number;
    description?: string;
  }>;
}

/**
 * Union type for all API items
 *
 * @public
 */
export type ApiItem = ApiFunction | ApiClass | ApiInterface | ApiTypeAlias | ApiEnum;

/**
 * Result of parsing a TypeScript file
 *
 * @public
 */
export interface ParsedApiFile {
  file: string;
  items: ApiItem[];
}

/**
 * Configuration for the API parser
 *
 * @public
 */
export interface ApiParserConfig {
  entryPoints: string[];
  tsConfigPath?: string;
  exclude?: string[];
}

/**
 * Parse JSDoc tags from a node
 */
function parseJsDocTags(node: Node & Partial<JSDocableNode>): {
  description?: string;
  params: Map<string, string>;
  returns?: string;
  examples: ApiExample[];
  metadata: ApiMetadata;
} {
  const result = {
    description: undefined as string | undefined,
    params: new Map<string, string>(),
    returns: undefined as string | undefined,
    examples: [] as ApiExample[],
    metadata: {} as ApiMetadata,
  };

  const jsDocs = node.getJsDocs?.() || [];

  for (const jsDoc of jsDocs) {
    // Get description
    const description = jsDoc.getDescription()?.trim();
    if (description) {
      result.description = description;
    }

    // Get tags
    const tags = jsDoc.getTags() || [];
    for (const tag of tags) {
      const tagName = tag.getTagName();
      const tagText = tag.getComment();
      const text =
        typeof tagText === 'string'
          ? tagText
          : tagText
              ?.filter((c) => c !== undefined)
              .map((c) => c.getText())
              .join('') || '';

      switch (tagName) {
        case 'param': {
          const paramName = (tag.compilerNode as { name?: { getText(): string } }).name?.getText();
          if (paramName) {
            // Strip the "- " prefix that ts-morph includes
            const cleanText = text.replace(/^-\s*/, '');
            result.params.set(paramName, cleanText);
          }
          break;
        }
        case 'returns':
        case 'return':
          result.returns = text;
          break;
        case 'example': {
          result.examples.push({ code: text });
          break;
        }
        case 'deprecated':
          result.metadata.deprecated = text || 'This API is deprecated';
          break;
        case 'since':
          result.metadata.since = text;
          break;
        case 'experimental':
          result.metadata.experimental = true;
          break;
        case 'category':
          result.metadata.category = text;
          break;
        default:
          // Custom tags
          if (!result.metadata.customTags) {
            result.metadata.customTags = {};
          }
          result.metadata.customTags[tagName] = text;
      }
    }
  }

  return result;
}

/**
 * Parse parameters from a function or method
 */
function parseParameters(
  node: { getParameters?: () => ParameterDeclaration[] },
  paramDocs: Map<string, string>
): ApiParameter[] {
  const parameters: ApiParameter[] = [];
  const params = node.getParameters?.() || [];

  for (const param of params) {
    const name = param.getName();
    const type = param.getType().getText();
    const optional = param.isOptional() || param.hasInitializer();
    const defaultValue = param.getInitializer()?.getText();

    parameters.push({
      name,
      type,
      description: paramDocs.get(name),
      optional,
      defaultValue,
    });
  }

  return parameters;
}

/**
 * Get source location information
 */
function getSourceInfo(node: Node): { file: string; line: number } {
  const sourceFile = node.getSourceFile();
  const line = node.getStartLineNumber();
  return {
    file: sourceFile.getFilePath(),
    line,
  };
}

/**
 * Parse a function declaration
 */
function parseFunction(node: FunctionDeclaration): ApiFunction {
  const name = node.getName() || 'anonymous';
  const signature = node.getText();
  const returnType = node.getReturnType().getText();
  const typeParameters = node.getTypeParameters?.()?.map((tp) => tp.getText());

  const jsDoc = parseJsDocTags(node);
  const parameters = parseParameters(node, jsDoc.params);

  return {
    kind: 'function',
    name,
    description: jsDoc.description || '',
    signature,
    parameters,
    returnType,
    returnDescription: jsDoc.returns,
    typeParameters,
    source: getSourceInfo(node),
    examples: jsDoc.examples,
    metadata: jsDoc.metadata,
  };
}

/**
 * Parse a class declaration
 */
function parseClass(node: ClassDeclaration): ApiClass {
  const name = node.getName() || 'AnonymousClass';
  const signature = node.getText().split('{')[0].trim();
  const typeParameters = node.getTypeParameters?.()?.map((tp) => tp.getText());
  const extendsClause = node.getExtends()?.getText();
  const implementsClauses = node.getImplements?.()?.map((impl) => impl.getText());

  const jsDoc = parseJsDocTags(node);

  // Parse properties
  const properties: ApiProperty[] = [];
  for (const prop of node.getProperties()) {
    const propJsDoc = parseJsDocTags(prop);
    properties.push({
      name: prop.getName(),
      type: prop.getType().getText(),
      description: propJsDoc.description,
      optional: prop.hasQuestionToken?.() || false,
      readonly: prop.isReadonly(),
    });
  }

  // Parse methods
  const methods: ApiMethod[] = [];
  for (const method of node.getMethods()) {
    const methodJsDoc = parseJsDocTags(method);
    const methodParams = parseParameters(method, methodJsDoc.params);

    methods.push({
      name: method.getName(),
      description: methodJsDoc.description,
      signature: method.getText(),
      parameters: methodParams,
      returnType: method.getReturnType().getText(),
      returnDescription: methodJsDoc.returns,
      metadata: methodJsDoc.metadata,
    });
  }

  // Parse constructor
  const constructors = node.getConstructors();
  let constructorDoc;
  if (constructors.length > 0) {
    const ctor = constructors[0];
    const ctorJsDoc = parseJsDocTags(ctor);
    const ctorParams = parseParameters(ctor, ctorJsDoc.params);
    constructorDoc = {
      description: ctorJsDoc.description,
      parameters: ctorParams,
    };
  }

  return {
    kind: 'class',
    name,
    description: jsDoc.description || '',
    signature,
    typeParameters,
    extends: extendsClause,
    implements: implementsClauses,
    properties,
    methods,
    constructorDoc,
    source: getSourceInfo(node),
    examples: jsDoc.examples,
    metadata: jsDoc.metadata,
  };
}

/**
 * Parse an interface declaration
 */
function parseInterface(node: InterfaceDeclaration): ApiInterface {
  const name = node.getName();
  const signature = node.getText().split('{')[0].trim();
  const typeParameters = node.getTypeParameters?.()?.map((tp) => tp.getText());
  const extendsClauses = node.getExtends?.()?.map((ext) => ext.getText());

  const jsDoc = parseJsDocTags(node);

  // Parse properties
  const properties: ApiProperty[] = [];
  for (const prop of node.getProperties()) {
    const propJsDoc = parseJsDocTags(prop);
    properties.push({
      name: prop.getName(),
      type: prop.getType().getText(),
      description: propJsDoc.description,
      optional: prop.hasQuestionToken?.() || false,
      readonly: prop.isReadonly(),
    });
  }

  // Parse methods
  const methods: ApiMethod[] = [];
  for (const method of node.getMethods?.() || []) {
    const methodJsDoc = parseJsDocTags(method);
    const methodParams = parseParameters(method, methodJsDoc.params);

    methods.push({
      name: method.getName(),
      description: methodJsDoc.description,
      signature: method.getText(),
      parameters: methodParams,
      returnType: method.getReturnType().getText(),
      returnDescription: methodJsDoc.returns,
      metadata: methodJsDoc.metadata,
    });
  }

  return {
    kind: 'interface',
    name,
    description: jsDoc.description,
    signature,
    typeParameters,
    extends: extendsClauses,
    properties,
    methods,
    source: getSourceInfo(node),
    examples: jsDoc.examples,
    metadata: jsDoc.metadata,
  };
}

/**
 * Parse a type alias declaration
 */
function parseTypeAlias(node: TypeAliasDeclaration): ApiTypeAlias {
  const name = node.getName();
  const signature = node.getText();
  const typeParameters = node.getTypeParameters?.()?.map((tp) => tp.getText());
  const definition = node.getType().getText();

  const jsDoc = parseJsDocTags(node);

  return {
    kind: 'type',
    name,
    description: jsDoc.description,
    signature,
    typeParameters,
    definition,
    source: getSourceInfo(node),
    examples: jsDoc.examples,
    metadata: jsDoc.metadata,
  };
}

/**
 * Parse an enum declaration
 */
function parseEnum(node: EnumDeclaration): ApiEnum {
  const name = node.getName();
  const jsDoc = parseJsDocTags(node);

  const members = node.getMembers().map((member) => {
    const memberJsDoc = parseJsDocTags(member);
    const value = member.getValue();

    return {
      name: member.getName(),
      value,
      description: memberJsDoc.description,
    };
  });

  return {
    kind: 'enum',
    name,
    description: jsDoc.description,
    members,
    source: getSourceInfo(node),
    examples: jsDoc.examples,
    metadata: jsDoc.metadata,
  };
}

/**
 * Parse a single TypeScript source file
 */
function parseSourceFile(sourceFile: SourceFile): ApiItem[] {
  const items: ApiItem[] = [];

  // Get all exported declarations
  const exportedDeclarations = sourceFile.getExportedDeclarations();

  for (const [, declarations] of exportedDeclarations) {
    for (const declaration of declarations) {
      const kind = declaration.getKind();

      try {
        switch (kind) {
          case SyntaxKind.FunctionDeclaration:
            items.push(parseFunction(declaration as FunctionDeclaration));
            break;
          case SyntaxKind.ClassDeclaration:
            items.push(parseClass(declaration as ClassDeclaration));
            break;
          case SyntaxKind.InterfaceDeclaration:
            items.push(parseInterface(declaration as InterfaceDeclaration));
            break;
          case SyntaxKind.TypeAliasDeclaration:
            items.push(parseTypeAlias(declaration as TypeAliasDeclaration));
            break;
          case SyntaxKind.EnumDeclaration:
            items.push(parseEnum(declaration as EnumDeclaration));
            break;
          // Skip other kinds (variables, etc.)
        }
      } catch (error) {
        const nodeName =
          'getName' in declaration && typeof declaration.getName === 'function'
            ? declaration.getName()
            : 'unknown';
        console.warn(`Failed to parse ${declaration.getKindName()} "${nodeName}":`, error);
      }
    }
  }

  return items;
}

/**
 * Parse TypeScript files and extract API documentation
 *
 * @public
 */
export function parseApi(config: ApiParserConfig): ParsedApiFile[] {
  const project = new Project({
    tsConfigFilePath: config.tsConfigPath,
    skipAddingFilesFromTsConfig: !config.tsConfigPath,
  });

  // Add source files
  const sourceFiles = project.addSourceFilesAtPaths(config.entryPoints);

  // Filter out excluded files
  const filesToParse = sourceFiles.filter((file) => {
    const filePath = file.getFilePath();
    if (!config.exclude) return true;
    return !config.exclude.some((pattern) => filePath.includes(pattern));
  });

  // Parse each file
  const results: ParsedApiFile[] = [];
  for (const sourceFile of filesToParse) {
    const items = parseSourceFile(sourceFile);
    if (items.length > 0) {
      results.push({
        file: sourceFile.getFilePath(),
        items,
      });
    }
  }

  return results;
}
