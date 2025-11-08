/**
 * Git Utilities
 *
 * Provides types and functions for working with git metadata
 */

export interface Contributor {
  name: string;
  email: string;
  commits: number;
  avatar?: string;
}
