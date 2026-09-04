import type { ReactNode } from "react";
import type { ExplanationBlock, MediaAsset, Reference } from "@/lib/api/explanations";

const asText = (value: unknown) => typeof value === "string" ? value : Array.isArray(value) ? value.join("\n") : value && typeof value === "object" ? JSON.stringify(value, null, 2) : "";
const asList = (value: unknown) => Array.isArray(value) ? value.map(String) : asText(value).split("\n").filter(Boolean);
const tableMarkdown = (value: unknown) => {
  const rows = tableRows(value);
  return rows.length > 1 ? `| ${rows[0].join(" | ")} |\n| ${rows[0].map(() => "---").join(" | ")} |\n${rows.slice(1).map((row) => `| ${row.join(" | ")} |`).join("\n")}` : asText(value);
};

function inlineMarkdown(value: string): string {
  let html = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="qpreview-image" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\$([^$\n]+)\$/g, (_, expression: string) => `<span class="qpreview-math">${expression.replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>").replace(/_\{([^}]+)\}/g, "<sub>$1</sub>")}</span>`);
  return html.replace(/\n/g, "<br />");
}

function tableRows(value: unknown): string[][] {
  if (typeof value === "object" && value && !Array.isArray(value)) {
    const record = value as { headers?: unknown; rows?: unknown };
    const headers = Array.isArray(record.headers) ? record.headers.map(String) : [];
    const rows = Array.isArray(record.rows) ? record.rows.map((row) => Array.isArray(row) ? row.map(String) : [String(row)]) : [];
    return headers.length ? [headers, ...rows] : rows;
  }
  return asText(value).split("\n").filter((line) => line.includes("|")).map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
}

function MarkdownTable({ value }: { value: unknown }) {
  const rows = tableRows(value);
  if (rows.length < 2) return <p className="qpreview-paragraph">{asText(value)}</p>;
  const columns = Math.max(...rows.map((row) => row.length));
  const pad = (row: string[]) => [...row, ...Array(Math.max(0, columns - row.length)).fill("")];
  return <div className="qpreview-table-wrap"><table className="qpreview-table"><thead><tr>{pad(rows[0]).map((cell, index) => <th key={index} dangerouslySetInnerHTML={{ __html: inlineMarkdown(cell) }} />)}</tr></thead><tbody>{rows.slice(1).filter((row) => !row.every((cell) => /^[-: ]+$/.test(cell))).map((row, rowIndex) => <tr key={rowIndex}>{pad(row).map((cell, index) => <td key={index} dangerouslySetInnerHTML={{ __html: inlineMarkdown(cell) }} />)}</tr>)}</tbody></table></div>;
}

function ImageBlock({ asset }: { asset?: MediaAsset }) {
  if (!asset) return <p className="qpreview-muted">Image asset is missing.</p>;
  const source = asset.sourceUrl || asset.attribution;
  return <figure className="qpreview-figure"><img src={asset.fileUrl} alt={asset.altText || asset.fileName} className="qpreview-image" loading="lazy" />{(asset.caption || source) && <figcaption>{asset.caption}{source ? <span>Source: {source}</span> : null}</figcaption>}</figure>;
}

export function SolutionBlocks({ blocks, media, references = [] }: { blocks: ExplanationBlock[]; media?: MediaAsset[]; references?: Reference[] }) {
  const ordered = [...blocks].sort((a, b) => a.position - b.position);
  const nodes: ReactNode[] = [];
  for (const block of ordered) {
    const content = asText(block.content);
    if (block.blockType === "image") { nodes.push(<ImageBlock key={block.id} asset={media?.find((asset) => asset.id === block.mediaAssetId)} />); continue; }
    if (block.blockType === "table") { nodes.push(<MarkdownTable key={block.id} value={block.content} />); continue; }
    if (block.blockType === "other_options") {
      const items = Array.isArray(block.content) ? block.content.filter((item): item is { option: string; title: string; explanation: string } => Boolean(item && typeof item === "object" && "option" in item)) : [];
      nodes.push(<h4 className="qpreview-heading" key={`${block.id}-heading`}>Why other options are wrong</h4>);
      if (items.length) nodes.push(<dl className="qpreview-definition-list" key={block.id}>{items.map((item, index) => <div key={index}><dt>Option {item.option}){item.title ? ` ${item.title}` : ""}</dt><dd dangerouslySetInnerHTML={{ __html: inlineMarkdown(item.explanation) }} /></div>)}</dl>);
      else if (content) nodes.push(<p className="qpreview-paragraph" key={block.id} dangerouslySetInnerHTML={{ __html: inlineMarkdown(content) }} />);
      continue;
    }
    if (block.blockType === "heading") { nodes.push(<h4 className="qpreview-heading" key={block.id} dangerouslySetInnerHTML={{ __html: inlineMarkdown(content) }} />); continue; }
    if (block.blockType === "bullet_list" || block.blockType === "numbered_list") {
      const items = asList(block.content);
      const optionItems = items.map((item) => item.match(/^\*\*?Option\s+([A-D]\)?)\*\*?\s*(.*)$/i)).filter(Boolean) as RegExpMatchArray[];
      if (optionItems.length === items.length && optionItems.length > 0) nodes.push(<dl className="qpreview-definition-list" key={block.id}>{optionItems.map((match, index) => <div key={index}><dt dangerouslySetInnerHTML={{ __html: inlineMarkdown(`Option ${match[1]}`) }} /><dd dangerouslySetInnerHTML={{ __html: inlineMarkdown(match[2] ?? "") }} /></div>)}</dl>);
      else nodes.push(block.blockType === "numbered_list" ? <ol className="qpreview-list" key={block.id}>{items.map((item, index) => <li key={index} dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }} />)}</ol> : <ul className="qpreview-list" key={block.id}>{items.map((item, index) => <li key={index} dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }} />)}</ul>);
      continue;
    }
    if (block.blockType === "educational_objective") nodes.push(<h4 className="qpreview-heading" key={block.id}>Educational objective</h4>);
    if (block.blockType === "high_yield_callout") nodes.push(<div className="qpreview-callout" key={block.id}><strong>Key concept</strong><p dangerouslySetInnerHTML={{ __html: inlineMarkdown(content) }} /></div>);
    if (content && !["high_yield_callout", "other_options", "educational_objective"].includes(block.blockType)) nodes.push(<p className="qpreview-paragraph" key={block.id} dangerouslySetInnerHTML={{ __html: inlineMarkdown(content) }} />);
    if (["other_options", "educational_objective"].includes(block.blockType) && content) nodes.push(<p className="qpreview-paragraph" key={`${block.id}-content`} dangerouslySetInnerHTML={{ __html: inlineMarkdown(content) }} />);
  }
  if (references.length) nodes.push(<div className="qpreview-references" key="references"><h4 className="qpreview-heading">References</h4><ol>{references.sort((a, b) => a.position - b.position).map((reference, index) => <li key={reference.id ?? index}><a href={reference.sourceUrl} target="_blank" rel="noreferrer">{reference.sourceTitle}</a>{reference.citation ? ` — ${reference.citation}` : ""}</li>)}</ol></div>);
  return <div className="qpreview-explanation">{nodes.length ? nodes : <p className="qpreview-muted">No explanation has been written yet.</p>}</div>;
}

export function blocksToSolutionMarkdown(blocks: ExplanationBlock[], media: MediaAsset[] = [], references: Reference[] = []) {
  return [...blocks].sort((a, b) => a.position - b.position).map((block) => {
    const content = asText(block.content).trim();
    if (block.blockType === "image") {
      const asset = media.find((item) => item.id === block.mediaAssetId);
      return asset ? `![${asset.altText || asset.fileName}${asset.sourceUrl ? ` {source: ${asset.sourceUrl}}` : ""}](${asset.fileUrl})` : "";
    }
    if (block.blockType === "heading") return `**${content}**`;
    if (block.blockType === "bullet_list") return asList(block.content).map((item) => `- ${item}`).join("\n");
    if (block.blockType === "numbered_list") return asList(block.content).map((item) => `- ${item}`).join("\n");
    if (block.blockType === "table") return tableMarkdown(block.content);
    if (block.blockType === "other_options" && Array.isArray(block.content)) return `**Why other options are wrong**\n\n${block.content.map((item) => { const option = item as { option?: string; title?: string; explanation?: string }; return `Option ${option.option ?? ""}) ${option.title ?? ""}\n\n${option.explanation ?? ""}`; }).join("\n\n")}`;
    if (block.blockType === "other_options") return `**Why other options are wrong**${content ? `\n\n${content}` : ""}`;
    if (block.blockType === "educational_objective") return `Educational Objective: ${content}`;
    if (block.blockType === "high_yield_callout") return `**Key Concept:** ${content}`;
    return content;
  }).concat(references.length ? [`**References**\n\n${references.sort((a, b) => a.position - b.position).map((reference) => `- [${reference.sourceTitle}](${reference.sourceUrl})${reference.citation ? ` — ${reference.citation}` : ""}`).join("\n")}`] : []).filter(Boolean).join("\n\n");
}
