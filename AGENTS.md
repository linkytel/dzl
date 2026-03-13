# AI Agent Ecosystem

This project uses an agentic development framework located in `.agents/`. All AI assistants (Gemini, Claude, Cursor, etc.) should follow the guidelines and skills defined there.

## Agent Structure

- **Core Instructions**: [`.agents/instructions.md`](.agents/instructions.md) - Project context, tech stack, and coding standards.
- **Skills**: [`.agents/skills/`](.agents/skills/) - Reusable specialized workflows.
  - **Skill Manager**: [`.agents/skills/skill_manager/SKILL.md`](.agents/skills/skill_manager/SKILL.md) - The meta-skill that orchestrates other skills and handles evolution.
- **Workflows**: [`.agents/workflows/`](.agents/workflows/) - End-to-end task flows.

## How to use this Agent Framework

1.  **Read Context**: Always start by reading `.agents/instructions.md`.
2.  **Activate Skills**: Check the current task against available skills in `.agents/skills/`.
3.  **Self-Evolution**: If a recurring complex task is identified, the Agent should propose or create a new Skill definition.

## Development Commands

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Dev**: `npm run dev`
