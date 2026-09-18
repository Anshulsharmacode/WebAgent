import type { ProjectType } from "../types/website";
import { AI_MODELS, PROJECT_TYPES } from "../constants/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KeyRound,
  Layers3,
  Square,
  Wand2,
  Sparkles,
  Code2,
} from "lucide-react";

type BuildFormProps = {
  prompt: string;
  projectName: string;
  projectType: ProjectType;
  modelName: string;
  apiKey: string;
  loading: boolean;
  canStop: boolean;
  onPromptChange: (val: string) => void;
  onProjectNameChange: (val: string) => void;
  onProjectTypeChange: (val: ProjectType) => void;
  onModelNameChange: (val: string) => void;
  onApiKeyChange: (val: string) => void;
  onBuild: () => void;
  onStop: () => void;
};

const PROMPT_SUGGESTIONS = [
  "Modern SaaS landing page with hero, pricing tiers, and testimonials",
  "Developer portfolio with project showcase and dark mode aesthetic",
  "Minimalist e-commerce shop with product grid and cart drawer",
];

export function BuildForm({
  prompt,
  projectName,
  projectType,
  modelName,
  apiKey,
  loading,
  canStop,
  onPromptChange,
  onProjectNameChange,
  onProjectTypeChange,
  onModelNameChange,
  onApiKeyChange,
  onBuild,
  onStop,
}: BuildFormProps) {
  return (
    <section className="w-full bg-card/40 p-4 sm:p-5 flex flex-col gap-5">
      {/* Prompt Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="prompt" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Prompt Description</span>
            <span className="text-destructive text-xs">*</span>
          </Label>

          <span className="text-[10px] font-mono tabular-nums text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
            {prompt.length}/2000
          </span>
        </div>

        <Textarea
          id="prompt"
          maxLength={2000}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe the website to generate... (e.g. Modern analytics dashboard with dark theme, sidebar navigation, metric cards, and charts)"
          className="min-h-[130px] text-xs leading-relaxed resize-y bg-background/70 border-border focus-visible:border-primary/60 focus-visible:ring-primary/20 placeholder:text-muted-foreground/60"
        />

        {/* Quick prompt suggestions */}
        {prompt.length === 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onPromptChange(suggestion)}
                className="text-[10px] text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border border-border rounded-md px-2 py-1 text-left transition-colors cursor-pointer"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Project Configuration */}
      <div className="flex flex-col gap-3 rounded-xl bg-background/50 border border-border p-3.5">
        <div className="flex items-center gap-2 pb-1 border-b border-border/60">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
            <Layers3 className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-wide">
            Project Settings
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Project Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-[11px] font-medium text-muted-foreground">
              Project Name
            </Label>
            <Input
              id="name"
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="e.g. my-cool-site"
              className="h-8 text-xs font-mono bg-card/60 border-border"
            />
          </div>

          {/* Project Template */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-type" className="text-[11px] font-medium text-muted-foreground">
              Framework & Template
            </Label>
            <Select
              value={projectType}
              onValueChange={(val) => onProjectTypeChange(val as ProjectType)}
            >
              <SelectTrigger id="project-type" className="h-8 w-full text-xs bg-card/60 border-border">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value} className="text-xs">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-3.5 w-3.5 text-primary" />
                      <span>{pt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="flex flex-col gap-3 rounded-xl bg-background/50 border border-border p-3.5">
        <div className="flex items-center gap-2 pb-1 border-b border-border/60">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-wide">
            AI Engine
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Model */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-model" className="text-[11px] font-medium text-muted-foreground">
              LLM Model
            </Label>
            <Select
              value={modelName}
              onValueChange={onModelNameChange}
            >
              <SelectTrigger id="ai-model" className="h-8 w-full text-xs font-mono bg-card/60 border-border">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans font-medium px-1 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                        {m.provider}
                      </span>
                      <span>{m.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="apiKey"
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
              >
                <KeyRound className="h-3 w-3" />
                <span>API Key</span>
              </Label>
              <span className="text-[10px] text-muted-foreground/60">
                Optional
              </span>
            </div>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="Use system default or enter custom key"
              className="h-8 text-xs font-mono bg-card/60 border-border"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="default"
          className="h-9 flex-1 text-xs font-semibold gap-2 shadow-sm cursor-pointer"
          disabled={loading || !prompt.trim()}
          onClick={onBuild}
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              <span>Generating Website...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-3.5 w-3.5" />
              <span>Generate Website</span>
            </>
          )}
        </Button>

        {canStop && (
          <Button
            variant="destructive"
            size="icon"
            className="h-9 w-9 shrink-0 cursor-pointer"
            disabled={loading}
            onClick={onStop}
            title="Stop & remove container"
            aria-label="Stop & remove container"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </section>
  );
}
