"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MediaUploader } from "@/components/questions/media-uploader";
import {
  getExplanation,
  getMedia,
  getReferences,
  replaceExplanation,
  replaceReferences,
  type ExplanationBlock,
  type MediaAsset,
  type Reference,
} from "@/lib/api/explanations";

const blockTypes: ExplanationBlock["blockType"][] = ["paragraph", "heading", "bullet_list", "numbered_list", "high_yield_callout", "educational_objective", "other_options", "references", "table", "image"];
type OtherOption = { option: "A" | "B" | "C" | "D"; title: string; explanation: string };
const makeBlock = (type: ExplanationBlock["blockType"], position: number): ExplanationBlock => ({ id: crypto.randomUUID(), blockType: type, content: type.includes("list") ? [] : type === "other_options" ? [{ option: "A", title: "", explanation: "" }] : "", mediaAssetId: null, position });
const isList = (type: ExplanationBlock["blockType"]) => type.includes("list");
const text = (content: unknown) => (typeof content === "string" ? content : Array.isArray(content) ? content.join("\n") : JSON.stringify(content ?? ""));
const otherOptionsShape = (content: unknown): OtherOption[] => Array.isArray(content) ? content.filter((item): item is OtherOption => Boolean(item && typeof item === "object" && "option" in item)).map((item) => ({ option: item.option, title: String(item.title ?? ""), explanation: String(item.explanation ?? "") })) : [{ option: "A", title: "", explanation: "" }];
const tableShape = (content: unknown) => {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const value = content as { headers?: unknown; rows?: unknown };
    if (Array.isArray(value.headers) && Array.isArray(value.rows)) return { headers: value.headers.map(String), rows: value.rows.map((row) => Array.isArray(row) ? row.map(String) : [String(row)]) };
  }
  return { headers: [""], rows: [[""]] };
};

export function ExplanationWorkspace({ revisionId, previewHref }: { revisionId: string; previewHref?: string }) {
  const queryClient = useQueryClient();
  const explanation = useQuery({ queryKey: ["explanation", revisionId], queryFn: () => getExplanation(revisionId) });
  const references = useQuery({ queryKey: ["references", revisionId], queryFn: () => getReferences(revisionId) });
  const media = useQuery({ queryKey: ["media"], queryFn: getMedia });
  const [blocks, setBlocks] = useState<ExplanationBlock[] | null>(null);
  const [refs, setRefs] = useState<Reference[] | null>(null);
  const [tableEditorIndex, setTableEditorIndex] = useState<number | null>(null);
  const currentBlocks = blocks ?? explanation.data ?? [];
  const currentRefs = refs ?? references.data ?? [];

  const save = useMutation({
    mutationFn: async () => {
      await replaceExplanation(
        revisionId,
        currentBlocks.map((block, position) => ({ blockType: block.blockType, content: block.content, mediaAssetId: block.mediaAssetId, position }))
      );
      await replaceReferences(revisionId, currentRefs.map((reference, position) => ({ ...reference, position })));
    },
    onSuccess: () => {
      setBlocks(null);
      setRefs(null);
      void queryClient.invalidateQueries({ queryKey: ["explanation", revisionId] });
      void queryClient.invalidateQueries({ queryKey: ["references", revisionId] });
      void queryClient.invalidateQueries({ queryKey: ["question"] });
    },
  });

  const updateBlock = (index: number, patch: Partial<ExplanationBlock>) => setBlocks(currentBlocks.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  const insertBlock = (index: number) => setBlocks([...currentBlocks.slice(0, index + 1), makeBlock("paragraph", index + 1), ...currentBlocks.slice(index + 1)].map((block, position) => ({ ...block, position })));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= currentBlocks.length) return;
    const next = [...currentBlocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next.map((block, position) => ({ ...block, position })));
  };

  if (explanation.isLoading || references.isLoading) return <div className="h-80 animate-pulse rounded-pq-lg bg-pq-muted-2" />;

  return (
    <div className="space-y-4">
      <div className="min-w-0 space-y-0">
        <Card
          title="Explanation blocks"
          headerRight={
            <span className="flex gap-1.5">
              <MediaUploader />
              {previewHref ? <Link href={previewHref} className="btn sm" style={{ textDecoration: "none" }}><Eye className="size-3.5" aria-hidden="true" /> Open QBank preview</Link> : null}
              <button type="button" className="btn sm pri" onClick={() => save.mutate()} disabled={save.isPending}>
                <Save className="size-3.5" aria-hidden="true" /> Save
              </button>
            </span>
          }
        >
          <p className="hint">Write it like a document: headings, lists, tables and figures. Why the other options are wrong, the objective and the references are their own blocks.</p>
          {currentBlocks.map((block, index) => (
            <div className="blk" key={block.id}>
              <div className="blk-h">
                <select
                  value={block.blockType}
                  className="inp !w-auto !min-h-0 !border-0 !bg-transparent !px-1 !py-0.5 !text-[11px] !font-bold !uppercase !tracking-widest"
                  aria-label="Block type"
                  onChange={(event) => {
                    const type = event.target.value as ExplanationBlock["blockType"];
                    updateBlock(index, { blockType: type, content: isList(type) ? (isList(block.blockType) ? block.content : []) : isList(block.blockType) ? "" : block.content });
                  }}
                >
                  {blockTypes.map((type) => (
                    <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
                  ))}
                </select>
                <span className="grow" />
                <button type="button" className="btn-icon !h-7 !w-7" aria-label="Move block up" onClick={() => move(index, -1)} disabled={index === 0}>
                  <ArrowUp className="size-3.5" />
                </button>
                <button type="button" className="btn-icon !h-7 !w-7" aria-label="Move block down" onClick={() => move(index, 1)} disabled={index === currentBlocks.length - 1}>
                  <ArrowDown className="size-3.5" />
                </button>
                <button type="button" className="btn-icon !h-7 !w-7" aria-label={`Insert block below block ${index + 1}`} title="Insert block below" onClick={() => insertBlock(index)}>
                  <Plus className="size-3.5" />
                </button>
                <button type="button" className="btn-icon !h-7 !w-7" aria-label="Delete block" onClick={() => setBlocks(currentBlocks.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="blk-b">
                {block.blockType === "image" ? (
                  <>
                    <select className="inp" aria-label="Media asset" value={block.mediaAssetId ?? ""} onChange={(event) => updateBlock(index, { mediaAssetId: event.target.value || null })}>
                      <option value="">Choose a picture…</option>
                      {media.data?.map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.fileName}</option>
                      ))}
                    </select>
                    {block.mediaAssetId && <BlockImage asset={media.data?.find((asset) => asset.id === block.mediaAssetId)} />}
                  </>
                ) : block.blockType === "other_options" ? (
                  <OtherOptionsBuilder value={otherOptionsShape(block.content)} onChange={(content) => updateBlock(index, { content })} />
                ) : block.blockType === "table" ? (
                  <div className="table-builder-launch">
                    <p className="hint">Build a table by choosing its dimensions and filling each cell. It will be converted to a PYQS-compatible Markdown table.</p>
                    <button type="button" className="btn sm" onClick={() => setTableEditorIndex(index)}>Open table builder</button>
                    {typeof block.content === "object" && block.content !== null && <span className="small">{tableShape(block.content).headers.length} columns · {tableShape(block.content).rows.length} rows</span>}
                  </div>
                ) : (
                  <textarea
                    className="inp"
                    rows={isList(block.blockType) ? 4 : 3}
                    value={text(block.content)}
                    placeholder={block.blockType.replaceAll("_", " ")}
                    onChange={(event) => updateBlock(index, { content: isList(block.blockType) ? event.target.value.split("\n") : event.target.value })}
                  />
                )}
              </div>
            </div>
          ))}
          <div className="addrow">
            <button type="button" className="btn sm" onClick={() => setBlocks([...currentBlocks, makeBlock("paragraph", currentBlocks.length)])}>
              <Plus className="size-3.5" aria-hidden="true" /> Add block
            </button>
          </div>
        </Card>

        {tableEditorIndex !== null && currentBlocks[tableEditorIndex]?.blockType === "table" && <TableBuilderDialog initial={tableShape(currentBlocks[tableEditorIndex].content)} onClose={() => setTableEditorIndex(null)} onSave={(content) => { updateBlock(tableEditorIndex, { content }); setTableEditorIndex(null); }} />}

        <Card title="References">
          {currentRefs.map((reference, index) => (
            <div className="blk" key={reference.id ?? index}>
              <div className="blk-h">
                Reference {index + 1}
                <span className="grow" />
                <button type="button" className="btn-icon !h-7 !w-7" aria-label="Remove reference" onClick={() => setRefs(currentRefs.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="blk-b space-y-2">
                <input className="inp" placeholder="Source title" value={reference.sourceTitle} onChange={(event) => setRefs(currentRefs.map((item, itemIndex) => (itemIndex === index ? { ...item, sourceTitle: event.target.value } : item)))} />
                <input className="inp" placeholder="Source URL" value={reference.sourceUrl} onChange={(event) => setRefs(currentRefs.map((item, itemIndex) => (itemIndex === index ? { ...item, sourceUrl: event.target.value } : item)))} />
                <input className="inp" placeholder="Citation (optional)" value={reference.citation ?? ""} onChange={(event) => setRefs(currentRefs.map((item, itemIndex) => (itemIndex === index ? { ...item, citation: event.target.value } : item)))} />
              </div>
            </div>
          ))}
          <div className="addrow">
            <button
              type="button"
              className="btn sm"
              onClick={() => setRefs([...currentRefs, { sourceTitle: "", sourceUrl: "", citation: null, position: currentRefs.length }])}
            >
              <Plus className="size-3.5" aria-hidden="true" /> Add reference
            </button>
          </div>
        </Card>
      </div>

    </div>
  );
}

function BlockImage({ asset }: { asset?: MediaAsset }) {
  if (!asset) return null;
  return (
    <div className="mt-2.5">
      <img className="imgprev" src={asset.fileUrl} alt={asset.altText} />
      <p className="credit">
        {asset.caption || asset.fileName}
        {asset.license !== "unverified" ? ` — ${asset.license}` : <span className="miss"> source and licence not set</span>}
      </p>
    </div>
  );
}

function OtherOptionsBuilder({ value, onChange }: { value: OtherOption[]; onChange: (value: OtherOption[]) => void }) {
  const update = (index: number, patch: Partial<OtherOption>) => onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  return <div className="other-options-builder"><p className="hint">Choose the wrong option, write the option text on the left, and explain why it is wrong on the right. The “Why other options are wrong” heading is added automatically.</p>{value.map((item, index) => <div className="other-option-row" key={`${index}-${item.option}`}><select className="inp other-option-select" aria-label={`Wrong option ${index + 1}`} value={item.option} onChange={(event) => update(index, { option: event.target.value as OtherOption["option"] })}><option value="A">Option A</option><option value="B">Option B</option><option value="C">Option C</option><option value="D">Option D</option></select><Input className="other-option-title" value={item.title} placeholder="Wrong option text" aria-label={`Wrong option ${index + 1} text`} onChange={(event) => update(index, { title: event.target.value })} /><textarea className="inp other-option-explanation" rows={2} value={item.explanation} placeholder="Why this option is wrong…" aria-label={`Explanation for option ${item.option}`} onChange={(event) => update(index, { explanation: event.target.value })} /><button type="button" className="btn sm" aria-label={`Remove option ${item.option}`} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}<button type="button" className="btn sm" disabled={value.length >= 4} onClick={() => onChange([...value, { option: (["A", "B", "C", "D"] as const).find((option) => !value.some((item) => item.option === option)) ?? "A", title: "", explanation: "" }])}><Plus className="size-3.5" aria-hidden="true" /> Add wrong option</button></div>;
}

function TableBuilderDialog({ initial, onClose, onSave }: { initial: { headers: string[]; rows: string[][] }; onClose: () => void; onSave: (content: { headers: string[]; rows: string[][] }) => void }) {
  const [rowCount, setRowCount] = useState(Math.max(1, initial.rows.length));
  const [columnCount, setColumnCount] = useState(Math.max(1, initial.headers.length));
  const [grid, setGrid] = useState<string[][]>(() => [initial.headers, ...initial.rows]);
  const resize = (rows: number, columns: number) => {
    setRowCount(rows); setColumnCount(columns);
    setGrid(Array.from({ length: rows + 1 }, (_, row) => Array.from({ length: columns }, (_, column) => grid[row]?.[column] ?? "")));
  };
  const update = (row: number, column: number, value: string) => setGrid((current) => current.map((cells, rowIndex) => rowIndex === row ? cells.map((cell, columnIndex) => columnIndex === column ? value : cell) : cells));
  return <div className="media-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="media-dialog table-builder-dialog" role="dialog" aria-modal="true" aria-labelledby="table-builder-title">
      <div className="media-dialog-head"><div><p className="eyebrow">Explanation table</p><h2 id="table-builder-title">Build a table</h2></div><button type="button" className="btn-icon" aria-label="Close table builder" onClick={onClose}>×</button></div>
      <div className="media-dialog-body table-builder-body">
        <div className="row"><Field label="Body rows" className="flex-1"><Input type="number" min={1} max={20} value={rowCount} onChange={(event) => resize(Math.min(20, Math.max(1, Number(event.target.value) || 1)), columnCount)} /></Field><Field label="Columns" className="flex-1"><Input type="number" min={1} max={10} value={columnCount} onChange={(event) => resize(rowCount, Math.min(10, Math.max(1, Number(event.target.value) || 1)))} /></Field></div>
        <p className="hint">The first row is the header. The remaining rows are table data.</p>
        <div className="table-builder-grid" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(120px, 1fr))` }}>{grid.map((row, rowIndex) => row.map((cell, columnIndex) => <Input key={`${rowIndex}-${columnIndex}`} aria-label={`${rowIndex === 0 ? "Header" : `Row ${rowIndex}`} column ${columnIndex + 1}`} value={cell} placeholder={rowIndex === 0 ? `Header ${columnIndex + 1}` : `Cell ${rowIndex}, ${columnIndex + 1}`} onChange={(event) => update(rowIndex, columnIndex, event.target.value)} />))}</div>
        <div className="addrow"><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn pri" onClick={() => onSave({ headers: grid[0] ?? [], rows: grid.slice(1) })}>Use table</button></div>
      </div>
    </section>
  </div>;
}
