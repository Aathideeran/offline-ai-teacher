# Offline AI Doubt Solver

A private, offline-first educational web application built for Class 10 Mathematics and Science students (with English and Tamil interface localization). Designed to help students understand concepts, execute real on-device Gemma inference, verify mathematical calculations step by step, search locally imported syllabus passages, and review flashcards without requiring a continuous internet connection.

---

## 1. Architecture Overview

The application is organized into decoupled TypeScript modules under `src/`:

- **UI Components (`src/components/`)**:
  - `DoubtSolverWorkspace.tsx` — Step-by-step doubt-solving workspace featuring a 3-stage Progressive Hint Ladder, 7-part structured answers, grounded vs. ungrounded syllabus badges, raw on-device Gemma token output inspection, copy/save actions, and understanding self-ratings.
  - `SyllabusLibraryView.tsx` — Local document manager and passage search interface with binary/scanned PDF detection.
  - `RevisionAndWeakTopicsView.tsx` — Spaced-repetition flashcard review scheduler and chapter-level weak-topic progress estimator.
  - `PracticeAndModelSetupView.tsx` — Offline question bank with local Gemma practice question generation and the `LocalAIProvider` Gemma model setup, download progress, compatibility blocker diagnostics, and live prompt tester.
  - `SettingsAndStorageView.tsx` — English (`en`) and Tamil (`ta`) localization switcher, IndexedDB storage breakdown, JSON backup export, and user-consented deletion controls.
- **On-Device Gemma Inference Adapter (`src/modules/ai/localAIProvider.ts`)**:
  - Uses `@huggingface/transformers` (`v4.3.1`) with ONNX Runtime Web (`WebGPU` + `WASM` backends) and browser `Cache Storage` (`transformers-cache`) so model weights are never embedded in the JS bundle and never call a hosted Gemini API.
  - Enforces a mandatory live inference self-test (`status: 'verifying'`) before reporting `status: 'ready'`.
- **Mathematics Verification Engine (`src/modules/math/mathEngine.ts`)**:
  - Deterministic recursive-descent parser and evaluator for arithmetic, exponents, roots, trigonometric degree functions, and `gcd`/`hcf`/`lcm`.
  - Algebraic solver and plug-back root verifier for quadratic equations ($ax^2 + bx + c = 0$, discriminant $D = b^2 - 4ac$) and linear equations in one variable.

---

## 2. Gemma 4 vs. Gemma 3 Runtime Verification & Hardware Blocker

- **Gemma 4 E2B IT (`onnx-community/gemma-4-E2B-it-ONNX`)**:
  - Uses `Gemma4ForConditionalGeneration` (35 layers, 262,144 vocabulary, multimodal audio+vision+text) split across 4 ONNX sub-graphs (`embed_tokens_q4f16.onnx_data`: 1,517 MB, `decoder_model_merged_q4f16.onnx_data`: 1,449 MB, `audio_encoder_q4f16.onnx_data`: 163 MB, `vision_encoder_q4f16.onnx_data`: 95 MB) totaling **~3.22 GB**.
  - **Blocker on CPU-Only / Headless Browsers**: When `navigator.gpu.requestAdapter()` returns `null` (no physical WebGPU adapter), 32-bit browser WebAssembly (`wasm32`) cannot allocate >3.2 GB of multi-encoder weights due to its 4 GB address ceiling and ~2 GB per-ArrayBuffer limit.
- **Verified Working In-Browser Alternative (`onnx-community/gemma-3-270m-it-ONNX`)**:
  - Uses `Gemma3ForCausalLM` (`q4` quantization = **308 MB** total).
  - Executes locally inside the browser on both **WebGPU** and **CPU WebAssembly (`wasm`)** in ~3–5 seconds per prompt without requiring an external server or discrete GPU.

---

## 3. Offline vs. Online Operations Matrix

| Operation | Works Offline (Internet Disconnected)? | Storage / Runtime Mechanism |
| :--- | :--- | :--- |
| Loading Application Shell (HTML, CSS, JS, Icons) | **Yes** (after first visit) | PWA Service Worker (`public/sw.js`) |
| First-Time Download of ONNX Model Weights (~308 MB) | **No** (Requires internet once) | Fetched from Hugging Face CDN into `Cache Storage (transformers-cache)` |
| Subsequent Local Gemma Inference & Doubt Solving | **Yes** (once weights are cached) | `@huggingface/transformers` + Browser `Cache Storage` |
| Deterministic Math Solving & Verification | **Yes** (Always 100% offline) | `src/modules/math/mathEngine.ts` |
| Searching Class 10 Maths & Science Syllabus Passages | **Yes** (Always 100% offline) | `IndexedDB` (`OfflineAIDoubtSolverDB`) |
| Importing Local `.txt`, `.md`, `.json` Study Notes | **Yes** (Always 100% offline) | Browser `File.text()` + `IndexedDB` |
| Conversations, Hint Ladder & Spaced Repetition Cards | **Yes** (Always 100% offline) | `IndexedDB` (`OfflineAIDoubtSolverDB`) |
| English / Tamil Interface Localization & JSON Export | **Yes** (Always 100% offline) | Local dictionary + `Blob` download |

---

## 4. Setup, Testing & Deployment

```bash
# Run unit tests (Math, Syllabus Retrieval, Spaced Repetition, Compatibility Probing)
npx --yes tsx --test src/modules/coreLogic.test.ts

# Type-check and build for production
npm run lint
npm run build
```
