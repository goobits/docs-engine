/**
 * Type augmentation for mdast to support remark-math and remark-directive nodes
 *
 * This extends the standard mdast types with custom node types from:
 * - remark-math: InlineMath, Math (display math)
 * - remark-directive: ContainerDirective, LeafDirective, TextDirective
 *
 * @see https://github.com/remarkjs/remark-math
 * @see https://github.com/remarkjs/remark-directive
 */
import type { Data, Literal, Parent } from 'mdast';

// ============================================================================
// remark-math nodes
// ============================================================================

/**
 * Inline math node ($...$)
 * Extends Literal with math-specific properties
 */
export interface InlineMath extends Literal {
  type: 'inlineMath';
  data?: Data;
}

/**
 * Display/block math node ($$...$$)
 * Extends Literal with math-specific properties
 */
export interface Math extends Literal {
  type: 'math';
  data?: Data;
  /**
   * Custom data properties (e.g., hName, hProperties for rehype)
   */
  meta?: string | null;
}

// ============================================================================
// remark-directive nodes
// ============================================================================

/**
 * Directive attributes
 */
export interface DirectiveAttributes {
  [key: string]: string | undefined;
}

/**
 * Container directive (:::name)
 * Block-level directive that can contain other block content
 */
export interface ContainerDirective extends Parent {
  type: 'containerDirective';
  name: string;
  attributes?: DirectiveAttributes;
  data?: Data;
}

/**
 * Leaf directive (::name)
 * Block-level directive without block children
 */
export interface LeafDirective extends Parent {
  type: 'leafDirective';
  name: string;
  attributes?: DirectiveAttributes;
  data?: Data;
}

/**
 * Text directive (:name)
 * Inline directive
 */
export interface TextDirective extends Parent {
  type: 'textDirective';
  name: string;
  attributes?: DirectiveAttributes;
  data?: Data;
}

// ============================================================================
// Module augmentation
// ============================================================================

declare module 'mdast' {
  interface RootContentMap {
    inlineMath: InlineMath;
    math: Math;
    containerDirective: ContainerDirective;
    leafDirective: LeafDirective;
  }

  interface PhrasingContentMap {
    inlineMath: InlineMath;
    textDirective: TextDirective;
  }

  interface BlockContentMap {
    math: Math;
    containerDirective: ContainerDirective;
    leafDirective: LeafDirective;
  }
}
