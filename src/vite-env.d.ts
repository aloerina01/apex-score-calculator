/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INVITE_CODE_HASH: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
