import '@testing-library/jest-dom'
import { beforeEach, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// テスト後のクリーンアップを自動化
afterEach(() => {
  cleanup()
})

// 各テスト前の共通設定
beforeEach(() => {
  // モックのリセット
  vi.clearAllMocks()

  // console出力の制御（必要に応じてコメントアウト）
  // vi.spyOn(console, 'log').mockImplementation(() => {})
  // vi.spyOn(console, 'warn').mockImplementation(() => {})
  // vi.spyOn(console, 'error').mockImplementation(() => {})
})

// ブラウザロケールのデフォルトを日本語に固定（メッセージの初期レンダリングに合わせる）
Object.defineProperty(window.navigator, 'language', {
  value: 'ja-JP',
  configurable: true,
})
Object.defineProperty(window.navigator, 'languages', {
  value: ['ja-JP', 'ja'],
  configurable: true,
})

// グローバルなモック設定
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// IntersectionObserver のモック
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  })),
})

// ResizeObserver のモック
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  })),
})

// テスト環境の判定
globalThis.IS_REACT_ACT_ENVIRONMENT = true
