import tokens from '../tokens/tokens.json' with { type: 'json' };

export const DesignTokens = tokens;

export function generateCssVariables(): string {
  const lines: string[] = [':root, [data-theme="dark"] {'];

  // Dark theme variables (default)
  for (const [k, v] of Object.entries(tokens.color.dark.bg)) {
    lines.push(`  --bg-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.dark.border)) {
    lines.push(`  --border-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.dark.text)) {
    lines.push(`  --text-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.dark.accent)) {
    lines.push(`  --accent-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.dark.semantic)) {
    lines.push(`  --semantic-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.dark.tier)) {
    lines.push(`  --tier-${k}: ${v};`);
  }

  // Radius, typography, motion
  for (const [k, v] of Object.entries(tokens.radius)) {
    lines.push(`  --radius-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.spacing)) {
    lines.push(`  --space-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.motion.duration)) {
    lines.push(`  --duration-${k}: ${v};`);
  }

  lines.push('}');
  lines.push('[data-theme="light"] {');

  // Light theme overrides
  for (const [k, v] of Object.entries(tokens.color.light.bg)) {
    lines.push(`  --bg-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.light.border)) {
    lines.push(`  --border-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.light.text)) {
    lines.push(`  --text-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.light.accent)) {
    lines.push(`  --accent-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.light.semantic)) {
    lines.push(`  --semantic-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.light.tier)) {
    lines.push(`  --tier-${k}: ${v};`);
  }

  lines.push('}');
  return lines.join('\n');
}
