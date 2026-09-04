type Media = { fileUrl: string; fileName: string; altText: string | null; sourceUrl: string | null } | null;
export type SolutionBlock = { blockType: string; content: unknown; position: number; mediaAsset?: Media };
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : Array.isArray(value) ? value.map(text).filter(Boolean).join('\n') : value && typeof value === 'object' ? JSON.stringify(value) : '';
const list = (value: unknown) => Array.isArray(value) ? value.map(text).filter(Boolean) : text(value).split('\n').map((item) => item.trim()).filter(Boolean);
const table = (value: unknown) => {
  if (typeof value === 'object' && value && !Array.isArray(value)) {
    const record = value as { headers?: unknown; rows?: unknown };
    const headers = Array.isArray(record.headers) ? record.headers.map(String) : [];
    const rows = Array.isArray(record.rows) ? record.rows.map((row) => Array.isArray(row) ? row.map(String) : [String(row)]) : [];
    if (headers.length) return [headers, ...rows];
  }
  return text(value).split('\n').filter((line) => line.includes('|')).map((line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim()));
};
export function blockToSolutionMarkdown(block: SolutionBlock): string {
  const value = text(block.content);
  if (block.blockType === 'image') { const asset = block.mediaAsset; return asset ? `![${asset.altText || asset.fileName}${asset.sourceUrl ? ` {source: ${asset.sourceUrl}}` : ''}](${asset.fileUrl})` : ''; }
  if (block.blockType === 'heading') return value ? `**${value}**` : '';
  if (block.blockType === 'bullet_list') return list(block.content).map((item) => `- ${item}`).join('\n');
  if (block.blockType === 'numbered_list') return list(block.content).map((item) => `- ${item}`).join('\n');
  if (block.blockType === 'table') { const rows = table(block.content); const header = rows[0] ?? []; return rows.length > 1 ? `| ${header.join(' | ')} |\n| ${header.map(() => '---').join(' | ')} |\n${rows.slice(1).map((row) => `| ${row.join(' | ')} |`).join('\n')}` : value; }
  if (block.blockType === 'other_options' && Array.isArray(block.content)) return `**Why other options are wrong**\n\n${block.content.map((item) => { const option = item as { option?: string; title?: string; explanation?: string }; return `Option ${option.option ?? ''}) ${option.title ?? ''}\n\n${option.explanation ?? ''}`; }).join('\n\n')}`;
  if (block.blockType === 'other_options') return `**Why other options are wrong**${value ? `\n\n${value}` : ''}`;
  if (block.blockType === 'educational_objective') return `Educational Objective: ${value}`;
  if (block.blockType === 'high_yield_callout') return `**Key Concept:** ${value}`;
  return value;
}
export function blocksToSolutionMarkdown(blocks: SolutionBlock[]) { return [...blocks].sort((a, b) => a.position - b.position).map(blockToSolutionMarkdown).filter(Boolean).join('\n\n'); }
