# Graph Report - tui-template-native  (2026-06-16)

## Corpus Check
- 30 files · ~14,683 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 235 nodes · 296 edges · 27 communities (23 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c476b5c7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 29 edges
2. `TuiText()` - 14 edges
3. `expo` - 13 edges
4. `scripts` - 11 edges
5. `TUI Template Native (Expo / React Native)` - 6 edges
6. `ios` - 4 edges
7. `icon` - 4 edges
8. `adaptiveIcon` - 4 edges
9. `TuiContainer()` - 4 edges
10. `🚀 Getting Started` - 4 edges

## Surprising Connections (you probably didn't know these)
- `MainApp()` --calls--> `useTheme()`  [EXTRACTED]
  App.tsx → src/theme/theme-provider.tsx
- `TuiButton()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/tui-button.tsx → src/theme/theme-provider.tsx
- `TuiCalendar()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/tui-calendar.tsx → src/theme/theme-provider.tsx
- `TuiProgressMeter()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/tui-chart.tsx → src/theme/theme-provider.tsx
- `TuiSegmentedMeter()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/tui-chart.tsx → src/theme/theme-provider.tsx

## Communities (27 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (8): SplashIcon(), SplashIconProps, ScreenType, styles, TuiTabBar(), TuiTabBarProps, MainApp(), styles

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (28): backgroundColor, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, expo, android, icon (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.24
Nodes (10): ChartItem, MeterSegment, styles, TuiBarChart(), TuiBarChartProps, TuiProgressMeter(), TuiProgressMeterProps, TuiSegmentedMeter() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (53): dependencies, axios, expo, expo-application, expo-auth-session, expo-av, expo-blur, expo-camera (+45 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (16): author, main, name, private, scripts, android, dev, fix-assets (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @expo/config-plugins, globals, prettier (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (12): 1. Rename the Project, 2. Install Dependencies, 3. Launch Development Server, 🎨 App Icon & Splash Screen Assets Regeneration, 📦 Automated iOS Release Pipeline, 🛠 Available Scripts, 🎨 Brutalist Design System (TUI), Core Components (`src/components/`) (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.40
Nodes (4): SPRING_CONFIG_OPEN, styles, TuiDrawer(), TuiDrawerProps

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (7): ACCENT_COLORS, AccentTheme, ThemeColors, ThemeContext, ThemeContextType, ThemeMode, ThemeProvider()

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, exclude, extends

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (8): appJsonPath, fs, packageJsonPath, path, rootDir, slug, workflowPath, workflowsDir

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (5): styles, TuiContainer(), TuiContainerProps, styles, TuiSkeletonLoader()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (5): MONTHS, styles, TuiCalendar(), TuiCalendarProps, WEEKDAYS

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): Persistence, Ponytail, Rules, The ladder

### Community 20 - "Community 20"
Cohesion: 0.50
Nodes (3): styles, TuiCheckbox(), TuiCheckboxProps

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (8): styles, TuiHeader(), TuiHeaderProps, styles, TuiInput(), TuiInputProps, TuiText(), TuiTextProps

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): styles, TuiButton(), TuiButtonProps

### Community 23 - "Community 23"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withShareExtension }

### Community 26 - "Community 26"
Cohesion: 0.50
Nodes (3): styles, TuiSwitch(), TuiSwitchProps

## Knowledge Gaps
- **166 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+161 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 5` to `Community 4`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _166 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._