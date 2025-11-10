---
title: Architecture Diagrams
description: Visual representations of the docs-engine symbol reference system
section: Guides
difficulty: intermediate
tags: [diagrams, mermaid, architecture, visual]
order: 5
---

# Architecture Diagrams

Visual representations of the docs-engine symbol reference system.

## System Overview

```mermaid
graph TB
    subgraph "Consumer Project"
        A[TypeScript Source Files]
        B[scripts/docs/generate-symbol-map.ts]
        C[docs/.generated/symbol-map.json]
        D[package.json scripts]
        E[Pre-commit Hook]
        F[CI/CD Pipeline]
    end

    subgraph "@goobits/docs-engine Package"
        G[referencePlugin]
        H[symbol-resolver.ts]
        I[symbol-renderer.ts]
        J[Type Definitions]
    end

    subgraph "Build Process"
        K[Markdown Files]
        L[MDSveX]
        M[Vite/SvelteKit]
        N[Static HTML]
    end

    A -->|1. Scan & Parse| B
    B -->|2. Write JSON| C
    C -->|3. Load at Build| G
    K -->|4. Process| L
    G -->|5. Transform| L
    L -->|6. Build| M
    M -->|7. Output| N

    E -.->|Auto-trigger| B
    F -.->|Validate| C
    D -.->|Orchestrate| B

    G --> H
    G --> I
    H --> J
    I --> J

    style A fill:#e1f5ff
    style C fill:#fff3cd
    style N fill:#d4edda
    style G fill:#f3e5f5
```

## Data Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant TS as TypeScript Files
    participant Gen as Generation Script
    participant Map as symbol-map.json
    participant Plugin as referencePlugin
    participant MD as Markdown
    participant HTML as HTML Output

    Dev->>TS: Write/Update Code
    Dev->>Gen: Run pnpm docs:symbols
    Gen->>TS: Parse with TypeScript API
    TS-->>Gen: AST Nodes
    Gen->>Gen: Extract Exported Symbols
    Gen->>Map: Write JSON

    Dev->>MD: Write Documentation
    MD->>MD: Use {@Symbol} syntax

    Dev->>Plugin: Trigger Build
    Plugin->>Map: Load Symbol Map
    Map-->>Plugin: SymbolDefinition[]
    Plugin->>MD: Parse Markdown
    MD-->>Plugin: AST with {@Symbol}
    Plugin->>Plugin: Resolve Symbols
    Plugin->>HTML: Transform to Links
    HTML-->>Dev: Rendered Docs
```

## Package Architecture

```mermaid
graph LR
    subgraph "Public API"
        A[/plugins]
        B[/utils]
        C[/components]
        D[/server]
    end

    subgraph "Core Plugins"
        E[referencePlugin]
        F[linksPlugin]
        G[screenshotPlugin]
        H[Other Plugins]
    end

    subgraph "Symbol System"
        I[symbol-resolver]
        J[symbol-renderer]
        K[Type Defs]
    end

    subgraph "Utilities"
        L[frontmatter]
        M[navigation-builder]
        N[search]
    end

    A --> E
    A --> F
    A --> G
    A --> H

    B --> I
    B --> J
    B --> K
    B --> L
    B --> M
    B --> N

    E --> I
    E --> J
    I --> K
    J --> K

    style A fill:#f3e5f5
    style B fill:#e3f2fd
    style E fill:#fff3cd
    style I fill:#d4edda
```

## Symbol Resolution Algorithm

```mermaid
flowchart TD
    Start([Parse {@Symbol}]) --> Load[Load Symbol Map]
    Load --> Parse[Parse Reference]
    Parse --> Hint{Path Hint<br/>Provided?}

    Hint -->|No| Lookup1[Lookup Symbol Name]
    Lookup1 --> Count1{Match<br/>Count?}
    Count1 -->|0| NotFound[Symbol Not Found<br/>Suggest Similar]
    Count1 -->|1| Found[Return Symbol]
    Count1 -->|>1| Ambiguous1[Ambiguous Error<br/>Show All Paths]

    Hint -->|Yes| Lookup2[Lookup Symbol Name]
    Lookup2 --> Filter[Filter by Path Hint]
    Filter --> Count2{Match<br/>Count?}
    Count2 -->|0| NoMatch[Path Hint No Match<br/>Show All Paths]
    Count2 -->|1| Found
    Count2 -->|>1| Ambiguous2[Still Ambiguous<br/>Need More Specific Hint]

    Found --> Render[Render as Link]
    Render --> End([Done])

    NotFound --> Error1[Throw Error]
    Ambiguous1 --> Error1
    NoMatch --> Error1
    Ambiguous2 --> Error1

    style Start fill:#e3f2fd
    style Found fill:#d4edda
    style Error1 fill:#ffcdd2
    style End fill:#e3f2fd
```

## Symbol Generation Flow

```mermaid
flowchart TD
    Start([Start Generation]) --> Glob[Scan TypeScript Files]
    Glob --> Cache{Cache<br/>Exists?}

    Cache -->|Yes| LoadCache[Load Cache]
    Cache -->|No| EmptyCache[Empty Cache]

    LoadCache --> IterateFiles[For Each File]
    EmptyCache --> IterateFiles

    IterateFiles --> CheckChanged{File<br/>Changed?}

    CheckChanged -->|No| UseCache[Use Cached Symbols]
    CheckChanged -->|Yes| ParseFile[Parse with TypeScript]

    UseCache --> AddSymbols[Add to Symbol Map]
    ParseFile --> VisitAST[Visit AST Nodes]
    VisitAST --> CheckExport{Has Export<br/>Keyword?}

    CheckExport -->|No| Skip[Skip Node]
    CheckExport -->|Yes| ExtractSymbol[Extract Symbol Info]

    ExtractSymbol --> ExtractJSDoc[Extract JSDoc]
    ExtractJSDoc --> AddSymbols

    AddSymbols --> NextFile{More<br/>Files?}
    Skip --> NextFile

    NextFile -->|Yes| IterateFiles
    NextFile -->|No| WriteJSON[Write symbol-map.json]

    WriteJSON --> SaveCache[Save Cache]
    SaveCache --> Stats[Print Statistics]
    Stats --> End([Done])

    style Start fill:#e3f2fd
    style WriteJSON fill:#fff3cd
    style End fill:#d4edda
    style CheckChanged fill:#ffe0b2
```

## Consumer Setup Flow

```mermaid
flowchart LR
    Start([New Project]) --> Install[pnpm add<br/>@goobits/docs-engine]
    Install --> CreateScript[Create Generation Script]
    CreateScript --> ConfigPlugin[Add referencePlugin<br/>to svelte.config.js]
    ConfigPlugin --> AddScripts[Add npm Scripts]
    AddScripts --> Generate[Run pnpm docs:symbols]
    Generate --> UseInDocs[Use {@Symbol}<br/>in Markdown]
    UseInDocs --> Optional{Want<br/>Automation?}

    Optional -->|Yes| PreCommit[Setup Pre-commit Hook]
    Optional -->|No| Done([Done])
    PreCommit --> CI[Setup CI Validation]
    CI --> Watch[Setup Watch Mode]
    Watch --> Done

    style Start fill:#e3f2fd
    style Generate fill:#fff3cd
    style Done fill:#d4edda
```

## Monorepo Structure

```mermaid
graph TB
    subgraph "Monorepo Root"
        A[docs/<br/>.generated/symbol-map.json]
    end

    subgraph "apps/web"
        B[src/lib/**/*.ts]
        C[scripts/docs/<br/>generate-symbol-map.ts]
    end

    subgraph "packages/shared"
        D[src/**/*.ts]
    end

    subgraph "packages/utils"
        E[src/**/*.ts]
    end

    subgraph "packages/@goobits/docs-engine"
        F[src/lib/<br/>plugins/reference.ts]
        G[src/lib/utils/<br/>symbol-resolver.ts]
    end

    B -->|Scan| C
    D -->|Scan| C
    E -->|Scan| C
    C -->|Generate| A
    A -->|Load| F
    F --> G

    style A fill:#fff3cd
    style C fill:#e1f5ff
    style F fill:#f3e5f5
```

## Plugin Transformation Pipeline

```mermaid
flowchart LR
    MD1[Markdown Input] --> Parse[MDSveX Parse]
    Parse --> AST1[MDAST]

    AST1 --> P1[filetreePlugin]
    P1 --> AST2[MDAST]
    AST2 --> P2[calloutsPlugin]
    P2 --> AST3[MDAST]
    AST3 --> P3[mermaidPlugin]
    P3 --> AST4[MDAST]
    AST4 --> P4[tabsPlugin]
    P4 --> AST5[MDAST]
    AST5 --> P5[remarkTableOfContents]
    P5 --> AST6[MDAST]
    AST6 --> P6[linksPlugin]
    P6 --> AST7[MDAST]
    AST7 --> P7[referencePlugin]
    P7 --> AST8[MDAST<br/>with symbol links]
    AST8 --> P8[screenshotPlugin]
    P8 --> AST9[MDAST]
    AST9 --> P9[codeHighlightPlugin]
    P9 --> AST10[MDAST]

    AST10 --> Render[MDSveX Render]
    Render --> HTML[HTML Output]

    style MD1 fill:#e3f2fd
    style P7 fill:#fff3cd
    style HTML fill:#d4edda
```

## Caching Strategy

```mermaid
flowchart TD
    Start([Check File]) --> LoadCache[Load Cache Entry]
    LoadCache --> HasCache{Cache<br/>Entry<br/>Exists?}

    HasCache -->|No| Changed[Mark Changed]
    HasCache -->|Yes| CheckMtime[Check mtime]

    CheckMtime --> MtimeMatch{mtime<br/>Matches?}
    MtimeMatch -->|No| Changed
    MtimeMatch -->|Yes| CheckSize[Check Size]

    CheckSize --> SizeMatch{size<br/>Matches?}
    SizeMatch -->|No| Changed
    SizeMatch -->|Yes| CheckHash[Compute Hash]

    CheckHash --> HashMatch{hash<br/>Matches?}
    HashMatch -->|No| Changed
    HashMatch -->|Yes| UseCached[Use Cached Symbols]

    Changed --> Process[Process File]
    Process --> UpdateCache[Update Cache Entry]
    UpdateCache --> Done([Done])
    UseCached --> Done

    style Start fill:#e3f2fd
    style UseCached fill:#d4edda
    style Process fill:#fff3cd
    style Done fill:#e3f2fd
```

## Error Handling Flow

```mermaid
flowchart TD
    Start([Resolve Symbol]) --> Try[Try Resolution]
    Try --> Success{Success?}

    Success -->|Yes| Render[Render Link]
    Success -->|No| CheckType{Error<br/>Type?}

    CheckType -->|Not Found| Fuzzy[Run Fuzzy Match]
    CheckType -->|Ambiguous| FindMinimal[Find Minimal Paths]
    CheckType -->|Path Hint Failed| ShowAll[Show All Paths]

    Fuzzy --> Suggestions[Show Suggestions]
    FindMinimal --> ShowHints[Show Path Hints]
    ShowAll --> ShowHints

    Suggestions --> BuildError[Build Error Message]
    ShowHints --> BuildError

    BuildError --> Throw[Throw AmbiguousSymbolError]
    Render --> Done([Done])
    Throw --> Fail([Build Fails])

    style Start fill:#e3f2fd
    style Render fill:#d4edda
    style Done fill:#d4edda
    style Throw fill:#ffcdd2
    style Fail fill:#ffcdd2
```

---

## Legend

- **Blue** - Input/Start/End
- **Yellow** - Processing/Transformation
- **Green** - Success/Output
- **Red** - Error/Failure
- **Purple** - Package Components
- **Orange** - Decision Points

---

See also:
- [Architecture Guide](./architecture.md)
- [Examples](./examples.md)
- [Symbol References](../plugins/symbol-references.md)
