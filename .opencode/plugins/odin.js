import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// opencode has no plugin manifest: a plugin is a module that mutates config at
// load. It discovers skills from .opencode/skills and .claude/skills, neither of
// which is where a plugin repo keeps them, so the skills path has to be pushed in.
const skillsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../skills")

function unquote(value) {
  const quote = value[0]
  if (value.length < 2 || value[value.length - 1] !== quote) return value
  if (quote === '"') return value.slice(1, -1).replace(/\\(["\\])/g, "$1")
  if (quote === "'") return value.slice(1, -1).replace(/''/g, "'")
  return value
}

// Scoped to the leading `---` block: a `name:` line inside a fenced YAML example
// in the skill body must not register a bogus command.
function parseFrontmatter(content) {
  const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!block) return null
  const fields = {}
  for (const line of block[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (pair) fields[pair[1]] = unquote(pair[2].trim())
  }
  return fields
}

function loadSkillCommands() {
  const commands = {}
  let entries
  try {
    entries = fs.readdirSync(skillsDir)
  } catch {
    return commands // no skills dir: register nothing rather than throwing at startup
  }
  for (const entry of entries) {
    let content
    try {
      content = fs.readFileSync(path.join(skillsDir, entry, "SKILL.md"), "utf8")
    } catch {
      continue // LICENSES.md, .gitignore, and anything else that is not a skill dir
    }
    const fields = parseFrontmatter(content)
    if (!fields?.name) continue
    // opencode has no manual-only gate, but honouring the flag keeps skills ODIN
    // marks manual from being offered as slash commands.
    if (fields["disable-model-invocation"] === "true") continue
    const command = { template: `Load and execute the \`${fields.name}\` skill.\n\n$ARGUMENTS` }
    if (fields.description) command.description = fields.description
    commands[fields.name] = command
  }
  return commands
}

const skillCommands = loadSkillCommands()

export const OdinPlugin = async () => ({
  config: async (config) => {
    config.skills ??= {}
    config.skills.paths ??= []
    if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir)

    config.command ??= {}
    for (const [name, command] of Object.entries(skillCommands)) {
      config.command[name] ??= command // never clobber a user-defined command
    }
  },
})

export default OdinPlugin
