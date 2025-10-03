# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AP Statistics Consensus Quiz - Development Guide

## Project Overview

**Project Type**: Static HTML Educational Web Application
**Purpose**: Interactive AP Statistics learning platform with consensus-based quiz system and peer learning capabilities
**Architecture**: Single-page application (SPA) with embedded JavaScript, no build system required
**Target Audience**: AP Statistics students and educators

This application enables students to work through AP Statistics curriculum questions while seeing peer responses and explanations, fostering collaborative learning through transparent peer interaction.

## Quick Start Commands

### Development Workflow
```bash
# No build system - direct file serving
# Open index.html in browser or serve via local HTTP server
python -m http.server 8000  # Python 3
# OR
npx http-server .           # Node.js alternative

# For development with live reload (optional)
npx live-server .
```

### No Traditional Build/Test Commands
- **No package.json**: This is a static web application
- **No build step required**: All code is directly executable
- **Testing**: Manual testing in browser (no automated test framework)
- **Linting**: No automated linting - follow existing code patterns in index.html

### Git Workflow
```bash
# Check current modifications
git status                  # Often has local changes to user data files

# Standard commit workflow
git add .                   # Stage all changes
git commit -m "Description" # Commit with descriptive message
git push origin main        # Push to main branch
```

## Architecture Overview

### Core Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Charting**: Chart.js 3.9.1 with datalabels plugin
- **Math Rendering**: MathJax 3
- **QR Code Generation**: QRCode.js for sharing functionality
- **Data Storage**: Browser localStorage + JSON file import/export
- **Cloud Sync**: Supabase for real-time data synchronization
- **Backend**: Railway integration for server-side operations
- **Styling**: Custom CSS with dark/light theme support

### File Structure
```
proto_curriculum_render/
├── index.html              # Main application (7,631 lines) - contains ALL JavaScript
├── css/
│   └── styles.css          # Complete styling with theme support (4,673 lines)
├── js/
│   ├── charts.js          # Chart rendering logic (1,499 lines)
│   ├── charthelper.js     # Chart utility functions (27 lines)
│   ├── data_manager.js    # Data management utilities (10 lines)
│   └── auth.js            # Authentication helpers
├── data/
│   ├── curriculum.js      # Complete AP Stats curriculum data (~38,000 lines)
│   └── units.js          # Unit structure and lesson organization (2,591 lines)
├── docs/
│   ├── FOUNDATION_DOCUMENT.md              # Architecture philosophy & data models
│   ├── advanced_combiner_tool.html        # Data aggregation utility
│   ├── master_peer_data_*.json           # Peer data snapshots
│   ├── student2username.csv              # Real name to username mapping
│   └── users/                            # Individual student JSON files
├── supabase_config.js                     # Cloud sync configuration
├── railway_config.js                      # Backend configuration
├── railway_client.js                      # Backend client
├── sync_diagnostics.js                    # Sync debugging utilities
├── CLAUDE.md                              # This development guide
└── COMPREHENSIVE_FUNCTION_DOCUMENTATION.md  # Complete function reference
```

### Application Architecture Patterns

#### 1. **Monolithic JavaScript Architecture**
- **Single HTML file contains all application logic** (7,631 lines)
- No module system - all functions in global scope
- Script execution starts with `DOMContentLoaded` event
- 110+ functions organized by functional area

#### 2. **Data Layer Architecture**
```javascript
// Three-tier data structure:
localStorage -> Personal Data (answers, preferences)
File Import -> Peer Data (class insights, comparisons)
Static Data -> Curriculum (questions, units, lessons)
```

#### 3. **File-Based Data Persistence**
- **Core Philosophy**: "The File IS the Database"
- Student progress stored in downloadable JSON files
- No server dependencies - completely client-side
- Import/export system for peer data sharing

#### 4. **Progressive Enhancement Pattern**
- Works with personal data only (offline capable)
- Enhanced with peer insights when available
- Graceful degradation for missing curriculum data
- Theme-aware rendering (dark/light modes)

## Recent Development Focus

### Active Development Areas (from git history)
- **Sprite System**: Complete pig sprite system for gamification (see SPRITE_SYSTEM_COMPLETE.md)
- **Multiplayer Features Removal**: Removed real-time multiplayer, kept sprite visuals
- **Sync Optimization**: Railway/Supabase sync improvements (see SYNC_ANALYSIS.md, SYNC_OPTIMIZATION_SUMMARY.md)
- **Turbo Mode**: Performance optimization system (see TURBO_MODE_SETUP.md)
- **Data Loss Recovery**: Fixes for student data import after cache clearing

## Critical Development Information

### Key Functions by Purpose

**Navigation & Question Loading**
- `loadQuestion(topic, questionNum)` - Main question loading (index.html:~2100)
- `renderQuestion()` - Individual question rendering with MathJax (index.html:~1450)
- `navigateToQuestion(topic, questionNum)` - URL-based navigation

**Data Management**
- `importDataForUser()` - Most complex function (578+ lines, index.html:~600)
- `saveToFile()` - Export student progress
- `loadStudentData(event)` - JSON file import processing
- `mergePeerData()` - Peer insight integration

**Quiz & Response System**
- `renderQuiz()` - Main quiz interface rendering
- `submitAnswer()` - Response submission and processing
- `processSubmission(studentResponse)` - Answer validation and feedback
- `displayPeerResponses()` - Peer learning visualization

**Chart System**
- `buildChart()` - Main chart rendering function (js/charts.js)
- `getChartTheme()` - Theme integration for charts
- `generateChartColors()` - Consistent color palettes

## Key System Components

### 1. **User Management System**
**Files**: `index.html` (lines 115-600)
**Key Functions**:
- `generateRandomUsername()` - Fruit + Animal username generation
- `promptUsername()` - User onboarding flow
- `importDataForUser()` - Most complex function (578+ lines)
- `checkExistingData()` - Data continuity validation

**Pattern**: Transparent peer identification (no anonymization)

### 2. **Question & Quiz Management**
**Files**: `index.html` (lines 1436-2000), `data/curriculum.js`
**Key Functions**:
- `renderQuiz()` - Main quiz interface rendering
- `renderQuestion()` - Individual question rendering with MathJax
- `isQuestionAnswered()` - Progress tracking
- `calculateBadges()` - Achievement system

**Pattern**: Dynamic question rendering with peer response visualization

### 3. **Chart & Visualization System**
**Files**: `js/charts.js`, `js/charthelper.js`
**Key Functions**:
- `renderChart()` - Chart.js wrapper with educational features
- `generateChartColors()` - Consistent color palettes
- Theme-aware color management for accessibility

**Pattern**: Educational chart rendering with consensus visualization

### 4. **Data Sync & Import/Export System**
**Files**: `index.html` (lines 578-1000), `supabase_config.js`, `railway_client.js`
**Key Functions**:
- `saveToFile()` - Export student progress
- `importFromFile()` - Import peer or personal data
- `mergePeerData()` - Peer insight integration
- `handleSmartImport()` - Intelligent file import with format detection
- Cloud sync via Supabase integration

**Pattern**: Hybrid file-based and cloud data exchange with automatic migration

### 5. **Theme & UI Management**
**Files**: `css/styles.css`, `js/charthelper.js`
**Key Functions**:
- `toggleTheme()` - Dark/light mode switching
- Theme-aware color functions for charts and UI
- Responsive grid layouts for question display

### 6. **Curriculum Navigation System**
**Files**: `data/units.js`, `index.html` (lines 1280-1436)
**Key Functions**:
- `renderLessonSelector()` - Unit/lesson navigation
- `detectUnitAndLessons()` - Curriculum structure analysis
- Progress tracking across units and lessons

### 7. **Data Aggregation Tools**
**Files**: `docs/advanced_combiner_tool.html`, `docs/master_peer_data_*.json`, `docs/student2username.csv`
**Purpose**: Combine multiple student JSON files into master peer data
**Usage**: Teacher/administrator tool for class-wide data analysis
**Output**: Creates aggregated JSON files for peer learning features
**Note**: `student2username.csv` maps real student names to fruit_animal usernames for transparency

## Data Models & Storage

### Student Progress File Structure
```javascript
{
  "exportTime": "2025-09-19T12:59:26.856Z",
  "username": "Apple_Rabbit",
  "users": {
    "Apple_Rabbit": {
      "answers": {
        "U1-L2-Q01": {
          "value": "B",
          "timestamp": 1757683639793
        }
      },
      "badges": {...},
      "preferences": {...}
    }
  }
}
```

### Curriculum Data Structure
- **Units**: Major AP Stats topics (Unit 1-9)
- **Lessons**: Sub-topics within units
- **Questions**: Individual quiz items with multiple choice answers
- **Charts**: Data visualization components for questions

## Development Patterns & Conventions

### Code Organization
1. **Functional Programming Style**: Most functions are pure or have minimal side effects
2. **Global Namespace**: All functions accessible globally (no modules)
3. **Event-Driven**: Heavy use of `addEventListener` patterns
4. **DOM Manipulation**: Direct DOM updates, no virtual DOM
5. **Error Handling**: Try-catch blocks around localStorage and JSON operations

### Naming Conventions
- **Functions**: camelCase with descriptive names (`generateRandomUsername`)
- **Variables**: camelCase for local, UPPER_CASE for constants
- **IDs**: kebab-case for HTML elements (`user-stats-display`)
- **CSS Classes**: kebab-case with semantic naming

### Data Handling Patterns
- **Immutable Exports**: Student files never modified in-place
- **Merge-Heavy Operations**: Peer data merged into personal data views
- **Timestamp Tracking**: All student actions timestamped for analytics
- **Graceful Degradation**: Missing data handled without crashes

## Testing & Debugging

### Critical Testing Areas
1. **Data Import/Export**: Test with sample files in `docs/users/`
2. **Question Rendering**: Verify MathJax and chart display
3. **Sync System**: Test Railway/Supabase integration with `sync_diagnostics.js`
4. **Theme Switching**: Verify dark/light mode persistence

### Common Issues & Solutions
- **MathJax Not Rendering**: Check `window.MathJax.typesetPromise()` calls
- **Chart Errors**: Ensure canvas exists before `buildChart()` call
- **Import Failures**: Validate JSON structure with `validateStudentDataStructure()`
- **Sync Issues**: Check Railway server status and Supabase connection

## Performance Considerations

### Asset Loading
- **Chart.js**: 3.9.1 via CDN (minimize local caching issues)
- **MathJax**: Version 3 with async loading
- **Large Data Files**: curriculum.js is 1.7MB (consider chunking for production)

### Memory Management
- **DOM Cleanup**: Charts properly destroyed when re-rendering
- **Event Listeners**: Proper cleanup to prevent memory leaks
- **localStorage Limits**: Monitor storage usage with large peer datasets

## Technical Debt & Constraints

### Current Architecture Limitations
- **Monolithic HTML**: 7,631 lines in single file (intentional for simplicity)
- **Global Functions**: 110+ functions in global namespace (no module system by design)
- **CDN Dependencies**: Chart.js, MathJax loaded from CDNs (no build system)
- **Manual Testing**: No automated tests (static HTML constraint)

### Design Decisions
- **No Build System**: Intentionally kept as static HTML for easy deployment
- **File-Based Storage**: Core philosophy - "The File IS the Database"
- **Global Scope**: Simplifies debugging in educational context
- **Hybrid Storage**: localStorage for session, files for persistence

## Key Files for Future Development

### Critical Files to Understand First
1. **`index.html`** - Main application logic (7,631 lines)
2. **`docs/FOUNDATION_DOCUMENT.md`** - Architecture philosophy
3. **`COMPREHENSIVE_FUNCTION_DOCUMENTATION.md`** - Complete function reference
4. **`data/curriculum.js`** - Question database (~38,000 lines)
5. **`js/charts.js`** - Visualization logic (1,499 lines)

### Development Entry Points
- **New Features**: Start with `index.html` function additions
- **Styling**: Modify `css/styles.css` with theme awareness
- **Curriculum**: Update `data/curriculum.js` and `data/units.js`
- **Charts**: Extend `js/charts.js` with new visualization types

## Common Development Tasks

### Adding New Questions
```javascript
// In data/curriculum.js, add to questions array:
{
  type: 'multiChoice',
  topic: 'U1-L2-Q01',
  prompt: 'Question text with $$LaTeX$$ support',
  options: ['A', 'B', 'C', 'D', 'E'],
  correctAnswer: 'B',
  chart: { /* optional chart config */ }
}
```

### Modifying User Import Logic
- Primary function: `importDataForUser()` (index.html:~600)
- Validation: `validateStudentDataStructure()` (index.html:~800)
- Always test with files in `docs/users/` directory

### Adding Cloud Sync Features
- Railway client: `railway_client.js`
- Supabase config: `supabase_config.js`
- Diagnostics: `sync_diagnostics.js`

---

*This application represents a unique approach to educational technology, prioritizing peer transparency and file-based data portability over traditional database-driven architectures. Understanding the "file as database" philosophy is crucial for effective development.*