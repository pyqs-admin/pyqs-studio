"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MediaUploader } from "@/components/questions/media-uploader";
import {
  getExplanation,
  getMedia,
  getReferences,
  getStudentPreview,
  replaceExplanation,
  replaceReferences,
  type ExplanationBlock,
  type MediaAsset,
  type Reference,
} from "@/lib/api/explanations";

const blockTypes: ExplanationBlock["blockType"][] = ["paragraph", "heading", "bullet_list", "numbered_list", "high_yield_callout", "educational_objective", "other_options", "references", "table", "image"];
const makeBlock = (type: ExplanationBlock["blockType"], position: number): ExplanationBlock => ({ id: crypto.randomUUID(), blockType: type, content: type.includes("list") ? [] : "", mediaAssetId: null, position });
const isList = (type: ExplanationBlock["blockType"]) => type.includes("list");
const text = (content: unknown) => (typeof content === "string" ? content : Array.isArray(content) ? content.join("\n") : JSON.stringify(content ?? ""));

export function ExplanationWorkspace({ revisionId }: { revisionId: string }) {
  const queryClient = useQueryClient();
  const explanation = useQuery({ queryKey: ["explanation", revisionId], queryFn: () => getExplanation(revisionId) });
  const references = useQuery({ queryKey: ["references", revisionId], queryFn: () => getReferences(revisionId) });
  const media = useQuery({ queryKey: ["media"], queryFn: getMedia });
  const [preview, setPreview] = useState(false);
  const [blocks, setBlocks] = useState<ExplanationBlock[] | null>(null);
  const [refs, setRefs] = useState<Reference[] | null>(null);
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
    },
  });

  const studentPreview = useQuery({ queryKey: ["preview", revisionId], queryFn: () => getStudentPreview(revisionId), enabled: preview });

  const updateBlock = (index: number, patch: Partial<ExplanationBlock>) => setBlocks(currentBlocks.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= currentBlocks.length) return;
    const next = [...currentBlocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next.map((block, position) => ({ ...block, position })));
  };

  if (explanation.isLoading || references.isLoading) return <div className="h-80 animate-pulse rounded-pq-lg bg-pq-muted-2" />;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-0">
        <Card
          title="Explanation blocks"
          headerRight={
            <span className="flex gap-1.5">
              <button type="button" className="btn sm" onClick={() => setPreview((value) => !value)}>
                <Eye className="size-3.5" aria-hidden="true" /> Preview
              </button>
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

      <aside className="space-y-4">
        {preview && (
          <Card title="Student preview">
            {studentPreview.isLoading ? (
              <p className="small">Loading preview…</p>
            ) : studentPreview.isError || !studentPreview.data ? (
              <p className="small">No student preview is available for this revision.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-lg font-bold leading-6 tracking-tight text-pq-ink-strong">{studentPreview.data.revision.stem}</p>
                <ol className="space-y-2">
                  {studentPreview.data.options.map((option) => (
                    <li key={option.label}>
                      <span className="optkey !inline-grid !mr-2">{option.label}</span>
                      <span>{option.content}</span>
                    </li>
                  ))}
                </ol>
                {studentPreview.data.explanationBlocks.map((block) => (
                  <p key={block.id} className="whitespace-pre-line">{typeof block.content === "string" ? block.content : Array.isArray(block.content) ? block.content.join("\n") : JSON.stringify(block.content)}</p>
                ))}
                {studentPreview.data.references.length > 0 && (
                  <ol className="list-decimal space-y-1 pl-5">
                    {studentPreview.data.references.map((reference, index) => (
                      <li key={reference.id ?? index}><a href={reference.sourceUrl} target="_blank" rel="noreferrer">{reference.sourceTitle}</a></li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </Card>
        )}
        <MediaUploader />
      </aside>
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
