# Claude Project Context

This file defines the operating instructions for Claude (and other similar agents) when working on this project.

## Agent Guidelines

- **Project Core**: [`.agents/instructions.md`](.agents/instructions.md) - **Mandatory Reading**. Contains the definitive guide to tech stack and data structures.
- **Skill Management**: Refer to [`.agents/skills/skill_manager/SKILL.md`](.agents/skills/skill_manager/SKILL.md). You are encouraged to activate specific skills for specialized tasks.
- **New Skills**: If you find yourself performing a complex, repetitive task that isn't yet a "Skill", you should suggest creating a new `SKILL.md` under `.agents/skills/`.

## Development Commands

- **Start Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`

## Coding Standards

- **TypeScript**: Mandatory. No `any` without strong justification.
- **UI**: Ant Design (v5) + TailwindCSS (v4). Use Ant components for structure, Tailwind for specific styling.
- **Components**: Follow the existing structure in `src/components/`. Use functional components with hooks.
- **State**: Use `TodoContext` and `AuthContext` for global application state.

## Core Rules

1.  **Context First**: Read `.agents/instructions.md` before making any major architectural changes.
2.  **Verify**: Always run `npm run build` or `npm run lint` before completing a major task.
3.  **Documentation**: Keep `.agents/instructions.md` up to date using the `sync-doc` skill pattern.
