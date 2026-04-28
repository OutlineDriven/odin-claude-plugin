# IDE and Editor Patterns

Paste this block verbatim into the `# === IDE / EDITOR ===` section of the composed `.gitignore`.
These patterns cover IDE-specific runtime state not already handled by gitignore.io templates.

```gitignore
# JetBrains (IntelliJ, CLion, GoLand, RustRover, WebStorm, etc.)
.idea/
*.iml
*.ipr
*.iws

# Eclipse
.project
.classpath
.settings/

# VS Code workspace settings (local overrides; project .vscode/ may be committed)
.vscode/settings.json
.vscode/launch.json
.vscode/tasks.json
.vscode/*.code-workspace

# Sublime Text
*.sublime-workspace

# Vim / Neovim
*.swp
*.swo
*~
.netrwhist
Session.vim
.vim/

# Emacs
\#*\#
.#*
*.elc
auto-save-list
.dir-locals-2.el

# Helix
.helix/

# Zed
.zed/

# TextMate
*.tmproj
*.tmproject
tmtags
```
