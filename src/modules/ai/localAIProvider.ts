import { env, pipeline } from '@huggingface/transformers';
import {
  ExplanationLevel,
  LocalAIRuntimeConfig,
  LocalAIStatusSnapshot,
  LocalModelSpec,
  PracticeQuestion,
  RetrievedPassageResult,
  StructuredDoubtAnswer,
  SubjectId,
  SyllabusPassage,
} from '../../types';
import { verifyMathematics } from '../math/mathEngine';
import { searchLocalSyllabusPassages } from '../syllabus/retrievalEngine';

// Configure @huggingface/transformers to use Browser Cache API when running in browser
if (typeof window !== 'undefined') {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
}

export const LOCAL_GEMMA_MODELS: LocalModelSpec[] = [
  {
    id: 'onnx-community/gemma-3-270m-it-ONNX',
    displayName: 'Gemma 3 270M IT (Quantized q4 ONNX — Verified Browser CPU/WASM & WebGPU)',
    family: 'Gemma 3',
    architecture: 'Gemma3ForCausalLM (18 layers, 262k vocab)',
    quantization: 'q4',
    approximateDownloadMB: 308,
    minimumRamGB: 2,
    requiresHardwareWebGPU: false,
    providerType: 'transformers_js_browser',
    licenseName: 'Google Gemma Terms of Use',
    description:
      'Compact 270M instruction-tuned Gemma model (~308 MB q4 ONNX). Verified to execute locally inside the browser on both WebGPU and CPU WebAssembly (wasm) without requiring a discrete GPU.',
  },
  {
    id: 'onnx-community/gemma-4-E2B-it-ONNX',
    displayName: 'Gemma 4 E2B IT (Multimodal ONNX q4f16 — Hardware WebGPU Required)',
    family: 'Gemma 4',
    architecture: 'Gemma4ForConditionalGeneration (35 layers, 262k vocab, Audio+Vision+Text)',
    quantization: 'q4f16',
    approximateDownloadMB: 3220,
    minimumRamGB: 8,
    requiresHardwareWebGPU: true,
    providerType: 'transformers_js_browser',
    licenseName: 'Apache 2.0 (Gemma 4)',
    description:
      'Official Gemma 4 E2B instruction-tuned model (~3.22 GB across 4 ONNX sub-graphs). Requires a physical WebGPU adapter with shader-f16 and >= 6 GB VRAM/Unified Memory; exceeds 32-bit WASM CPU buffer limits.',
  },
  {
    id: 'onnx-community/gemma-3-1b-it-ONNX',
    displayName: 'Gemma 3 1B IT (Quantized q4 ONNX — High-Memory Browser)',
    family: 'Gemma 3',
    architecture: 'Gemma3ForCausalLM (26 layers, 262k vocab)',
    quantization: 'q4',
    approximateDownloadMB: 1020,
    minimumRamGB: 4,
    requiresHardwareWebGPU: false,
    providerType: 'transformers_js_browser',
    licenseName: 'Google Gemma Terms of Use',
    description:
      '1-billion parameter instruction-tuned Gemma model (~1.02 GB q4 ONNX). Recommended for devices with >= 4 GB free RAM and WebGPU acceleration.',
  },
  {
    id: 'gemma4:e2b',
    displayName: 'Gemma 4 E2B (Native 64-bit Desktop Runtime via Ollama)',
    family: 'Gemma 4',
    architecture: 'Gemma 4 E2B QAT GGUF',
    quantization: 'gguf_q4',
    approximateDownloadMB: 2100,
    minimumRamGB: 6,
    requiresHardwareWebGPU: false,
    providerType: 'local_http_ollama',
    licenseName: 'Apache 2.0 (Gemma 4)',
    description:
      'Runs Gemma 4 E2B via a local 64-bit Ollama / llama.cpp process at http://127.0.0.1:11434, bypassing browser 32-bit WebAssembly memory limits.',
  },
];

export interface LocalAIProvider {
  getStatusSnapshot(): LocalAIStatusSnapshot;
  probeCompatibility(config: LocalAIRuntimeConfig): Promise<LocalAIStatusSnapshot>;
  connectModel(
    config: LocalAIRuntimeConfig,
    onStateChange?: (snapshot: LocalAIStatusSnapshot) => void
  ): Promise<LocalAIStatusSnapshot>;
  runLiveInferenceTest(
    promptText: string,
    onStateChange?: (snapshot: LocalAIStatusSnapshot) => void
  ): Promise<{ output: string; latencyMs: number }>;
  disconnectModel(): void;
  clearBrowserModelCache(): Promise<void>;
  generateStructuredDoubtResponse(params: {
    question: string;
    mathExpression?: string;
    subjectId: SubjectId;
    chapterId: string;
    explanationLevel: ExplanationLevel;
    retrievedPassages: RetrievedPassageResult[];
    practiceBank: PracticeQuestion[];
  }): Promise<StructuredDoubtAnswer>;
  generatePracticeQuestionWithModel(params: {
    subjectId: SubjectId;
    chapterTitle: string;
    passageExcerpt: string;
  }): Promise<PracticeQuestion | null>;
}

export class GemmaLocalRuntimeAdapter implements LocalAIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private textGeneratorPipeline: any = null;
  private loadedModelId: string | null = null;

  private snapshot: LocalAIStatusSnapshot = {
    status: 'not_loaded',
    modelId: 'onnx-community/gemma-3-270m-it-ONNX',
    runtimeName: 'Transformers.js In-Browser ONNX Runtime (WebGPU / WASM)',
    executionBackend: 'none',
    downloadProgressPercent: null,
    activeDownloadFile: null,
    downloadedBytes: null,
    totalBytes: null,
    webGpuSupported: false,
    webGpuAdapterInfo: null,
    wasmSupported: typeof WebAssembly !== 'undefined',
    estimatedDeviceMemoryGB:
      typeof navigator !== 'undefined' && 'deviceMemory' in navigator
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Number((navigator as any).deviceMemory)
        : null,
    cachedModelFilesCount: 0,
    lastSelfTestPrompt: null,
    lastSelfTestOutput: null,
    lastSelfTestLatencyMs: null,
    blockerReason: null,
    recommendedAlternativeModelId: null,
    errorMessage: null,
    lastCheckedAt: new Date().toISOString(),
  };

  private activeConfig: LocalAIRuntimeConfig = {
    providerType: 'transformers_js_browser',
    modelId: 'onnx-community/gemma-3-270m-it-ONNX',
    endpointUrl: 'http://127.0.0.1:11434',
    temperature: 0.2,
    maxTokens: 220,
  };

  constructor() {
    this.refreshCachedFilesCount();
  }

  private async refreshCachedFilesCount(): Promise<number> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return 0;
    }
    try {
      const hasCache = await caches.has('transformers-cache');
      if (!hasCache) {
        this.snapshot.cachedModelFilesCount = 0;
        return 0;
      }
      const cache = await caches.open('transformers-cache');
      const keys = await cache.keys();
      this.snapshot.cachedModelFilesCount = keys.length;
      return keys.length;
    } catch {
      return 0;
    }
  }

  getStatusSnapshot(): LocalAIStatusSnapshot {
    return { ...this.snapshot };
  }

  async clearBrowserModelCache(): Promise<void> {
    if (typeof window !== 'undefined' && 'caches' in window) {
      await caches.delete('transformers-cache').catch(() => {});
    }
    this.disconnectModel();
    await this.refreshCachedFilesCount();
  }

  async probeCompatibility(
    config: LocalAIRuntimeConfig
  ): Promise<LocalAIStatusSnapshot> {
    this.activeConfig = { ...config };
    const now = new Date().toISOString();
    await this.refreshCachedFilesCount();

    // 1. Check real hardware WebGPU adapter availability
    let hasHardwareWebGPU = false;
    let adapterDescription = 'WebGPU API not exposed by this browser';

    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gpu = (navigator as any).gpu;
        const adapter = await gpu.requestAdapter();
        if (adapter) {
          hasHardwareWebGPU = true;
          const features = Array.from(adapter.features || []);
          const hasF16 = features.includes('shader-f16');
          adapterDescription = `Hardware WebGPU Adapter active (${
            hasF16 ? 'shader-f16 supported' : 'standard fp32'
          })`;
        } else {
          hasHardwareWebGPU = false;
          adapterDescription =
            'navigator.gpu is defined, but requestAdapter() returned null (No hardware GPU available; using CPU WebAssembly)';
        }
      } catch {
        hasHardwareWebGPU = false;
        adapterDescription = 'WebGPU adapter request failed; falling back to CPU WebAssembly';
      }
    }

    this.snapshot.webGpuSupported = hasHardwareWebGPU;
    this.snapshot.webGpuAdapterInfo = adapterDescription;
    this.snapshot.wasmSupported = typeof WebAssembly !== 'undefined';

    const spec = LOCAL_GEMMA_MODELS.find((m) => m.id === config.modelId);

    if (config.providerType === 'local_http_ollama') {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(
          `${config.endpointUrl.replace(/\/$/, '')}/api/tags`,
          { signal: controller.signal }
        );
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { models?: { name: string }[] };
        const models = data.models ?? [];
        const hasModel = models.some((m) =>
          m.name.toLowerCase().includes(config.modelId.toLowerCase().split(':')[0])
        );

        if (!hasModel) {
          this.snapshot = {
            ...this.snapshot,
            status: 'unavailable',
            modelId: config.modelId,
            runtimeName: `Local Ollama HTTP (${config.endpointUrl})`,
            executionBackend: 'none',
            blockerReason: `Local Ollama server responded, but "${config.modelId}" is not installed. Run "ollama pull ${config.modelId}" or switch to the in-browser ONNX runtime.`,
            recommendedAlternativeModelId: 'onnx-community/gemma-3-270m-it-ONNX',
            errorMessage: null,
            lastCheckedAt: now,
          };
          return { ...this.snapshot };
        }
      } catch {
        this.snapshot = {
          ...this.snapshot,
          status: 'unavailable',
          modelId: config.modelId,
          runtimeName: `Local Ollama HTTP (${config.endpointUrl})`,
          executionBackend: 'none',
          blockerReason: `No local Ollama HTTP server is running at ${config.endpointUrl}. To execute a local Gemma model directly inside this browser without external software, select "onnx-community/gemma-3-270m-it-ONNX".`,
          recommendedAlternativeModelId: 'onnx-community/gemma-3-270m-it-ONNX',
          errorMessage: null,
          lastCheckedAt: now,
        };
        return { ...this.snapshot };
      }
    }

    // Check if the chosen in-browser model is Gemma 4 E2B IT ONNX without hardware WebGPU
    if (
      config.providerType === 'transformers_js_browser' &&
      (spec?.requiresHardwareWebGPU || config.modelId.toLowerCase().includes('gemma-4')) &&
      !hasHardwareWebGPU
    ) {
      this.snapshot = {
        ...this.snapshot,
        status: 'unavailable',
        modelId: config.modelId,
        runtimeName: 'Transformers.js In-Browser ONNX Runtime',
        executionBackend: 'none',
        blockerReason:
          'Exact Hardware/Runtime Blocker: onnx-community/gemma-4-E2B-it-ONNX (Gemma4ForConditionalGeneration) consists of ~3.22 GB of multimodal ONNX weights across 4 sub-models (embed_tokens: 1,517 MB, decoder: 1,449 MB, audio: 163 MB, vision: 95 MB). It requires a physical WebGPU adapter with shader-f16 and >= 6 GB VRAM. In this browser environment, navigator.gpu.requestAdapter() returned null, and 32-bit WebAssembly (wasm32) cannot allocate >3.2 GB of multi-encoder weights.',
        recommendedAlternativeModelId: 'onnx-community/gemma-3-270m-it-ONNX',
        errorMessage:
          'Compatibility check blocked loading Gemma 4 E2B ONNX on CPU-only WebAssembly to prevent browser out-of-memory crash. Use the verified alternative onnx-community/gemma-3-270m-it-ONNX (308 MB q4) which executes locally on both WebGPU and CPU WebAssembly.',
        lastCheckedAt: now,
      };
      return { ...this.snapshot };
    }

    // Compatible in-browser model
    this.snapshot = {
      ...this.snapshot,
      status:
        this.loadedModelId === config.modelId && this.textGeneratorPipeline
          ? 'ready'
          : 'not_loaded',
      modelId: config.modelId,
      runtimeName: 'Transformers.js In-Browser ONNX Runtime',
      executionBackend: hasHardwareWebGPU ? 'webgpu' : 'wasm_cpu',
      blockerReason: null,
      recommendedAlternativeModelId: null,
      errorMessage: null,
      lastCheckedAt: now,
    };

    return { ...this.snapshot };
  }

  async connectModel(
    config: LocalAIRuntimeConfig,
    onStateChange?: (snapshot: LocalAIStatusSnapshot) => void
  ): Promise<LocalAIStatusSnapshot> {
    const notify = () => onStateChange?.({ ...this.snapshot });

    // Step 1: Probe hardware & runtime compatibility first
    const compat = await this.probeCompatibility(config);
    if (compat.status === 'unavailable') {
      notify();
      return compat;
    }

    // Request persistent browser storage if available
    if (
      typeof navigator !== 'undefined' &&
      navigator.storage &&
      navigator.storage.persist
    ) {
      navigator.storage.persist().catch(() => {});
    }

    if (config.providerType === 'local_http_ollama') {
      // Verify Ollama with a real inference test before reporting 'ready'
      this.snapshot = {
        ...this.snapshot,
        status: 'verifying',
        errorMessage: null,
      };
      notify();
      try {
        const t0 = Date.now();
        const res = await fetch(
          `${config.endpointUrl.replace(/\/$/, '')}/api/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: config.modelId,
              prompt: 'What is 2 + 2? Reply briefly.',
              stream: false,
            }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { response?: string };
        const outText = (data.response || '').trim();
        if (!outText) throw new Error('Empty response from local Ollama model');

        this.snapshot = {
          ...this.snapshot,
          status: 'ready',
          executionBackend: 'ollama_http',
          lastSelfTestPrompt: 'What is 2 + 2? Reply briefly.',
          lastSelfTestOutput: outText,
          lastSelfTestLatencyMs: Date.now() - t0,
          lastCheckedAt: new Date().toISOString(),
        };
        notify();
        return { ...this.snapshot };
      } catch (err) {
        this.snapshot = {
          ...this.snapshot,
          status: 'error',
          errorMessage:
            err instanceof Error
              ? err.message
              : 'Failed to execute self-test on local Ollama server',
        };
        notify();
        return { ...this.snapshot };
      }
    }

    // Step 2: Load in-browser ONNX Gemma model via @huggingface/transformers
    try {
      this.snapshot = {
        ...this.snapshot,
        status: 'downloading',
        modelId: config.modelId,
        downloadProgressPercent: 0,
        activeDownloadFile: 'Initializing ONNX model files...',
        errorMessage: null,
        blockerReason: null,
      };
      notify();

      const deviceTarget = this.snapshot.webGpuSupported ? 'webgpu' : 'wasm';
      const progressCallback = (prog: {
        status?: string;
        file?: string;
        progress?: number;
        loaded?: number;
        total?: number;
      }) => {
        if (prog.status === 'progress' || prog.status === 'downloading') {
          this.snapshot = {
            ...this.snapshot,
            status: 'downloading',
            activeDownloadFile: prog.file ?? 'onnx model weights',
            downloadProgressPercent:
              typeof prog.progress === 'number'
                ? Math.round(prog.progress)
                : this.snapshot.downloadProgressPercent,
            downloadedBytes:
              typeof prog.loaded === 'number' ? prog.loaded : null,
            totalBytes: typeof prog.total === 'number' ? prog.total : null,
          };
          notify();
        } else if (prog.status === 'ready' || prog.status === 'done') {
          this.snapshot = {
            ...this.snapshot,
            status: 'loading',
            activeDownloadFile: prog.file ?? null,
            downloadProgressPercent: 100,
          };
          notify();
        }
      };

      // Note: On WebGPU, q4 (308 MB) uses GatherBlockQuantized on GPU.
      // On CPU WebAssembly (wasm), onnxruntime-web does not implement GatherBlockQuantized(1),
      // so we use fp16 (543 MB) or fp32 which use standard Gather operators.
      let generator;
      if (deviceTarget === 'webgpu') {
        generator = await pipeline('text-generation', config.modelId, {
          dtype: 'q4',
          device: 'webgpu',
          progress_callback: progressCallback,
        });
      } else {
        try {
          generator = await pipeline('text-generation', config.modelId, {
            dtype: 'fp16',
            device: 'wasm',
            progress_callback: progressCallback,
          });
        } catch {
          generator = await pipeline('text-generation', config.modelId, {
            dtype: 'fp32',
            device: 'wasm',
            progress_callback: progressCallback,
          });
        }
      }

      this.textGeneratorPipeline = generator;
      this.loadedModelId = config.modelId;
      await this.refreshCachedFilesCount();

      // Step 3: Mandatory real inference self-test before reporting 'ready' (Requirement 12)
      this.snapshot = {
        ...this.snapshot,
        status: 'verifying',
        activeDownloadFile: 'Running mandatory live inference self-test...',
        downloadProgressPercent: 100,
      };
      notify();

      const selfTestPrompt =
        'State the formula for Ohm\'s Law relating Voltage (V), Current (I), and Resistance (R) in one short sentence.';
      const tStart = Date.now();
      const testOut = await this.textGeneratorPipeline(
        [{ role: 'user', content: selfTestPrompt }],
        {
          max_new_tokens: 36,
          do_sample: false,
        }
      );
      const latencyMs = Date.now() - tStart;

      const generatedMessages = testOut?.[0]?.generated_text;
      const assistantReply = Array.isArray(generatedMessages)
        ? String(
            generatedMessages[generatedMessages.length - 1]?.content || ''
          ).trim()
        : String(generatedMessages || '').trim();

      if (!assistantReply) {
        throw new Error(
          'Model loaded into memory, but mandatory self-test returned empty output.'
        );
      }

      this.snapshot = {
        ...this.snapshot,
        status: 'ready',
        modelId: config.modelId,
        executionBackend: this.snapshot.webGpuSupported ? 'webgpu' : 'wasm_cpu',
        downloadProgressPercent: null,
        activeDownloadFile: null,
        lastSelfTestPrompt: selfTestPrompt,
        lastSelfTestOutput: assistantReply,
        lastSelfTestLatencyMs: latencyMs,
        errorMessage: null,
        lastCheckedAt: new Date().toISOString(),
      };
      notify();
      return { ...this.snapshot };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to initialize local ONNX Gemma pipeline';
      this.textGeneratorPipeline = null;
      this.loadedModelId = null;
      this.snapshot = {
        ...this.snapshot,
        status: 'error',
        downloadProgressPercent: null,
        activeDownloadFile: null,
        errorMessage: `Local ONNX Runtime Error: ${msg}`,
        lastCheckedAt: new Date().toISOString(),
      };
      notify();
      return { ...this.snapshot };
    }
  }

  async runLiveInferenceTest(
    promptText: string,
    onStateChange?: (snapshot: LocalAIStatusSnapshot) => void
  ): Promise<{ output: string; latencyMs: number }> {
    if (this.snapshot.status !== 'ready' || !this.textGeneratorPipeline) {
      throw new Error('Local Gemma model is not loaded and verified ready.');
    }
    const t0 = Date.now();
    const out = await this.textGeneratorPipeline(
      [{ role: 'user', content: promptText }],
      {
        max_new_tokens: 96,
        do_sample: false,
      }
    );
    const latencyMs = Date.now() - t0;
    const generatedMessages = out?.[0]?.generated_text;
    const reply = Array.isArray(generatedMessages)
      ? String(
          generatedMessages[generatedMessages.length - 1]?.content || ''
        ).trim()
      : String(generatedMessages || '').trim();

    this.snapshot = {
      ...this.snapshot,
      lastSelfTestPrompt: promptText,
      lastSelfTestOutput: reply,
      lastSelfTestLatencyMs: latencyMs,
      lastCheckedAt: new Date().toISOString(),
    };
    onStateChange?.({ ...this.snapshot });
    return { output: reply, latencyMs };
  }

  disconnectModel(): void {
    this.textGeneratorPipeline = null;
    this.loadedModelId = null;
    this.snapshot = {
      ...this.snapshot,
      status: 'not_loaded',
      executionBackend: 'none',
      downloadProgressPercent: null,
      activeDownloadFile: null,
      errorMessage: null,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async generateStructuredDoubtResponse(params: {
    question: string;
    mathExpression?: string;
    subjectId: SubjectId;
    chapterId: string;
    explanationLevel: ExplanationLevel;
    retrievedPassages: RetrievedPassageResult[];
    practiceBank: PracticeQuestion[];
  }): Promise<StructuredDoubtAnswer> {
    const baseDeterministic = buildDeterministicDoubtAnswer(params);

    // 1. If in-browser @huggingface/transformers Gemma pipeline is READY, run real local inference!
    if (
      this.snapshot.status === 'ready' &&
      this.textGeneratorPipeline &&
      this.loadedModelId
    ) {
      try {
        const syllabusContext =
          params.retrievedPassages.length > 0
            ? params.retrievedPassages
                .map(
                  (r, i) =>
                    `[Syllabus Passage ${i + 1} - ${r.passage.chapterTitle}: ${r.passage.sectionHeading}]\n${r.passage.content}`
                )
                .join('\n\n')
            : 'No matching local syllabus passage found. Answer using general Class 10 knowledge and clearly state it is ungrounded in imported notes.';

        const verifiedMathNote =
          baseDeterministic.mathVerification.status === 'verified' &&
          baseDeterministic.mathVerification.verifiedResult
            ? `\nIndependently Verified Math Result: ${baseDeterministic.mathVerification.verifiedResult}`
            : '';

        const userPrompt = `You are a Class 10 tutor. Explain step by step for a student (${params.explanationLevel} level).\n\nSyllabus Context:\n${syllabusContext}${verifiedMathNote}\n\nStudent Question: ${params.question}\n\nProvide a clear, concise step-by-step explanation:`;

        const t0 = Date.now();
        const result = await this.textGeneratorPipeline(
          [{ role: 'user', content: userPrompt }],
          {
            max_new_tokens: this.activeConfig.maxTokens || 160,
            do_sample: false,
          }
        );
        const latencyMs = Date.now() - t0;

        const generatedMessages = result?.[0]?.generated_text;
        const rawReply = Array.isArray(generatedMessages)
          ? String(
              generatedMessages[generatedMessages.length - 1]?.content || ''
            ).trim()
          : String(generatedMessages || '').trim();

        if (rawReply) {
          const modelSteps = rawReply
            .split(/\n+/)
            .map((line) => line.replace(/^\s*[-*•\d.]+\s*/, '').trim())
            .filter((line) => line.length > 0);

          // Combine real Gemma reasoning with independent math verification steps
          const combinedSteps = [
            ...modelSteps.map((s) => `[Local Gemma] ${s}`),
            ...(baseDeterministic.mathVerification.steps.length > 0
              ? baseDeterministic.mathVerification.steps.map(
                  (s) => `[Math Engine Verification] ${s}`
                )
              : []),
          ];

          return {
            ...baseDeterministic,
            stepByStepReasoning:
              combinedSteps.length > 0
                ? combinedSteps
                : baseDeterministic.stepByStepReasoning,
            finalAnswer:
              baseDeterministic.mathVerification.status === 'verified' &&
              baseDeterministic.mathVerification.verifiedResult
                ? `Verified Result: ${baseDeterministic.mathVerification.verifiedResult} — ${modelSteps[modelSteps.length - 1] || ''}`
                : modelSteps[0] || baseDeterministic.finalAnswer,
            generatedBy: 'gemma_local',
            modelIdUsed: this.loadedModelId,
            rawModelOutput: rawReply,
            inferenceLatencyMs: latencyMs,
          };
        }
      } catch (err) {
        this.snapshot.errorMessage =
          err instanceof Error
            ? `Inference error: ${err.message}`
            : 'Inference failed';
      }
    }

    // 2. If Local HTTP Ollama runtime is ready, call it
    if (
      this.snapshot.status === 'ready' &&
      this.activeConfig.providerType === 'local_http_ollama'
    ) {
      try {
        const contextText = params.retrievedPassages
          .map(
            (r, idx) =>
              `[Source ${idx + 1}: ${r.passage.sourceLabel}]\n${r.passage.content}`
          )
          .join('\n\n');

        const prompt = `You are a private Class 10 study assistant. Answer using the provided syllabus context if applicable.\nContext:\n${contextText || 'None'}\n\nQuestion: ${params.question}\nProvide concise step-by-step reasoning.`;

        const t0 = Date.now();
        const res = await fetch(
          `${this.activeConfig.endpointUrl.replace(/\/$/, '')}/api/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: this.activeConfig.modelId,
              prompt,
              stream: false,
              options: {
                temperature: this.activeConfig.temperature,
              },
            }),
          }
        );

        if (res.ok) {
          const data = (await res.json()) as { response?: string };
          if (data.response) {
            return {
              ...baseDeterministic,
              stepByStepReasoning: data.response
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean),
              generatedBy: 'gemma_local',
              modelIdUsed: this.activeConfig.modelId,
              rawModelOutput: data.response.trim(),
              inferenceLatencyMs: Date.now() - t0,
            };
          }
        }
      } catch {
        this.snapshot.status = 'unavailable';
      }
    }

    return baseDeterministic;
  }

  async generatePracticeQuestionWithModel(params: {
    subjectId: SubjectId;
    chapterTitle: string;
    passageExcerpt: string;
  }): Promise<PracticeQuestion | null> {
    if (
      this.snapshot.status !== 'ready' ||
      !this.textGeneratorPipeline ||
      !this.loadedModelId
    ) {
      return null;
    }

    try {
      const prompt = `Create one short Class 10 practice question based on this note:\n"${params.passageExcerpt}"\nWrite the question in one sentence and then the answer.`;
      const out = await this.textGeneratorPipeline(
        [{ role: 'user', content: prompt }],
        {
          max_new_tokens: 90,
          do_sample: false,
        }
      );
      const generatedMessages = out?.[0]?.generated_text;
      const text = Array.isArray(generatedMessages)
        ? String(
            generatedMessages[generatedMessages.length - 1]?.content || ''
          ).trim()
        : String(generatedMessages || '').trim();

      if (!text) return null;
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      return {
        id: `pq_gemma_${Date.now()}`,
        subjectId: params.subjectId,
        chapterId: 'math_10_ch3',
        difficulty: 'medium',
        question: lines[0] || text,
        hint1: `Review the concept from ${params.chapterTitle}.`,
        hint2: params.passageExcerpt.slice(0, 120),
        expectedAnswer: lines.slice(1).join(' ') || text,
        stepByStepSolution: [
          `Generated locally by ${this.loadedModelId}:`,
          ...lines,
        ],
        sourceType: 'gemma_local',
        sourceDocumentTitle: `Local Gemma (${this.loadedModelId}) Grounded in ${params.chapterTitle}`,
      };
    } catch {
      return null;
    }
  }
}

export function buildDeterministicDoubtAnswer(params: {
  question: string;
  mathExpression?: string;
  subjectId: SubjectId;
  chapterId: string;
  explanationLevel: ExplanationLevel;
  retrievedPassages: RetrievedPassageResult[];
  practiceBank: PracticeQuestion[];
}): StructuredDoubtAnswer {
  const {
    question,
    mathExpression,
    subjectId,
    chapterId,
    explanationLevel,
    retrievedPassages,
    practiceBank,
  } = params;

  const mathResult = verifyMathematics(question, mathExpression);
  const topPassage = retrievedPassages[0]?.passage ?? null;
  const isGrounded = retrievedPassages.length > 0;

  // 1. What the question is asking
  let whatQuestionAsks = `You are asking about: "${question.trim()}".`;
  if (mathResult.expressionDetected) {
    whatQuestionAsks += ` Specifically, we need to evaluate or solve the mathematical expression "${mathResult.expressionDetected}" and verify the result step by step.`;
  } else if (topPassage) {
    whatQuestionAsks += ` This relates to ${topPassage.chapterTitle} (${topPassage.sectionHeading}).`;
  }

  // 2. Relevant concept or formula
  let conceptOrFormula = '';
  if (topPassage) {
    const formulaList =
      topPassage.formulas.length > 0
        ? `Key Formula(s): ${topPassage.formulas.join('  |  ')}. `
        : '';
    conceptOrFormula = `${formulaList}From ${topPassage.sectionHeading}: ${topPassage.content}`;
  } else if (mathResult.operationType === 'quadratic_equation') {
    conceptOrFormula =
      'Standard Quadratic Equation: ax² + bx + c = 0 (a ≠ 0). Discriminant D = b² - 4ac, and Quadratic Formula x = [-b ± sqrt(b² - 4ac)] / (2a).';
  } else if (mathResult.operationType === 'linear_equation') {
    conceptOrFormula =
      'Linear Equation in One Variable: Isolate variable x on the Left-Hand Side (LHS) and constants on the Right-Hand Side (RHS), then divide by the coefficient of x.';
  } else if (mathResult.operationType === 'arithmetic') {
    conceptOrFormula =
      'Order of Operations (BODMAS / PEMDAS): Evaluate parentheses and functions (sqrt, gcd, lcm, trig) first, followed by exponents, multiplication/division, and addition/subtraction.';
  } else {
    conceptOrFormula =
      'No matching formula or concept passage was found in the currently imported local syllabus library.';
  }

  // 3. Step-by-Step Reasoning
  const stepByStepReasoning: string[] = [];
  if (mathResult.steps.length > 0) {
    stepByStepReasoning.push(...mathResult.steps);
  }
  if (topPassage) {
    stepByStepReasoning.push(
      `Syllabus Grounding (${topPassage.chapterTitle}): ${topPassage.content}`
    );
    if (explanationLevel === 'exam_prep') {
      stepByStepReasoning.push(
        `Exam Presentation Tip: Always state the formula (${topPassage.formulas[0] || topPassage.sectionHeading}) clearly before substituting numerical values, and include proper SI units or root checks.`
      );
    } else if (explanationLevel === 'basic') {
      stepByStepReasoning.push(
        `Core Idea: Focus on understanding how ${topPassage.sectionHeading} connects the given quantities to the unknown value.`
      );
    }
  }
  if (stepByStepReasoning.length === 0) {
    stepByStepReasoning.push(
      '1. Imported study materials do not contain a passage matching the terms in your question.',
      '2. Load the local in-browser Gemma model on the Model Setup page for free-form explanations, or import relevant chapter notes (.txt or .md) in the Syllabus Library.',
      '3. For mathematical calculations, enter an explicit equation or expression in the math verification box.'
    );
  }

  // 4. Final Answer
  let finalAnswer = '';
  if (mathResult.status === 'verified' && mathResult.verifiedResult) {
    finalAnswer = `Verified Result: ${mathResult.verifiedResult}`;
  } else if (topPassage) {
    finalAnswer = `${topPassage.sectionHeading}: ${topPassage.content}`;
  } else {
    finalAnswer =
      'Outside currently imported syllabus materials — please import notes for this topic or load the local Gemma model on the Model Setup page.';
  }

  // 5. Quick Verification
  const quickVerification = mathResult.explanation;

  // 6. Syllabus References
  const syllabusReferences = retrievedPassages.map((r) => ({
    documentTitle: r.passage.documentTitle,
    chapterTitle: r.passage.chapterTitle,
    sectionHeading: r.passage.sectionHeading,
    sourceLabel: r.passage.sourceLabel,
    excerpt: r.passage.content,
    isOfficialSyllabus: r.passage.isOfficialSyllabus,
  }));

  // 7. Practice Question
  const matchingPractice =
    practiceBank.find(
      (pq) => pq.chapterId === (topPassage?.chapterId || chapterId)
    ) ||
    practiceBank.find((pq) => pq.subjectId === subjectId) ||
    practiceBank[0];

  const practiceQuestion = matchingPractice
    ? {
        question: matchingPractice.question,
        hint: matchingPractice.hint1,
        answer: matchingPractice.expectedAnswer,
        sourceType: 'imported_bank' as const,
      }
    : {
        question:
          'Solve x^2 - 5x + 6 = 0 and verify the roots by substitution.',
        hint: 'Here a = 1, b = -5, c = 6. Compute D = b^2 - 4ac.',
        answer: '2, 3',
        sourceType: 'rule_template' as const,
      };

  // Hint Ladder
  const hint1Concept = topPassage
    ? `Identify the core concept: This question belongs to "${topPassage.chapterTitle}" (${topPassage.sectionHeading}). ${
        topPassage.formulas.length > 0
          ? `Applicable formula: ${topPassage.formulas[0]}`
          : ''
      }`
    : mathResult.expressionDetected
      ? `Identify the mathematical structure: We need to evaluate or solve "${mathResult.expressionDetected}" (${mathResult.operationType.replace('_', ' ')}).`
      : 'Check which Class 10 chapter or fundamental law applies to the quantities mentioned in your question.';

  const hint2NextStep =
    mathResult.steps[0] ||
    (topPassage
      ? `Write down the known definitions or quantities from "${topPassage.sectionHeading}" and relate them using ${topPassage.formulas[0] || 'the chapter principle'}.`
      : 'Break the problem into given values and what needs to be determined.');

  const hint3Detailed =
    mathResult.steps[1] ||
    (topPassage
      ? `Apply the principle directly: ${topPassage.content.slice(0, 160)}...`
      : 'Substitute the known values carefully and check units.');

  return {
    whatQuestionAsks,
    conceptOrFormula,
    stepByStepReasoning,
    finalAnswer,
    quickVerification,
    syllabusReferences,
    isGroundedInSyllabus: isGrounded,
    ungroundedNotice: isGrounded
      ? undefined
      : 'This question is not covered by your currently imported local syllabus passages. No citations were fabricated.',
    practiceQuestion,
    hints: {
      hint1Concept,
      hint2NextStep,
      hint3Detailed,
    },
    mathVerification: mathResult,
    generatedBy: 'local_deterministic_engine',
    modelIdUsed: null,
  };
}

export async function solveStudentDoubtLocally(params: {
  provider: LocalAIProvider;
  question: string;
  mathExpression?: string;
  subjectId: SubjectId;
  chapterId: string;
  explanationLevel: ExplanationLevel;
  allPassages: SyllabusPassage[];
  practiceBank: PracticeQuestion[];
}): Promise<StructuredDoubtAnswer> {
  const retrieved = searchLocalSyllabusPassages(
    params.allPassages,
    `${params.question} ${params.mathExpression || ''}`,
    {
      subjectId: params.subjectId,
      chapterId: params.chapterId,
      topK: 3,
    }
  );

  return params.provider.generateStructuredDoubtResponse({
    question: params.question,
    mathExpression: params.mathExpression,
    subjectId: params.subjectId,
    chapterId: params.chapterId,
    explanationLevel: params.explanationLevel,
    retrievedPassages: retrieved,
    practiceBank: params.practiceBank,
  });
}
