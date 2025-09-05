import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HealthCheckButton } from '../HealthCheckButton'
import { getDetailedHealth } from '@/lib/api'
import type { DetailedHealthCheck } from '@template/api-contracts-ts'

// APIモジュールをモック
vi.mock('@/lib/api', () => ({
  getDetailedHealth: vi.fn(),
}))

const mockedGetDetailedHealth = vi.mocked(getDetailedHealth)

describe('HealthCheckButton', () => {
  const mockHealthyResponse: DetailedHealthCheck = {
    status: 'healthy',
    timestamp: '2025-09-05T13:00:00Z',
    uptime: 7200, // 2時間
    version: '1.0.0',
    environment: 'development',
    services: {
      api: {
        status: 'healthy',
        responseTime: 10,
      },
      database: {
        status: 'healthy',
        responseTime: 50,
      },
      redis: {
        status: 'healthy',
        responseTime: 25,
      },
    },
    system: {
      memory: {
        rss: 128,
        heapUsed: 256,
        heapTotal: 512,
      },
      cpu: {
        user: 1000,
        system: 500,
      },
    },
  }

  const mockUnhealthyResponse: DetailedHealthCheck = {
    ...mockHealthyResponse,
    status: 'unhealthy',
    services: {
      api: {
        status: 'unhealthy',
        responseTime: 5000,
      },
      database: {
        status: 'unhealthy',
        responseTime: 5000,
      },
      redis: {
        status: 'degraded',
        responseTime: 200,
      },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render initial state correctly', () => {
      render(<HealthCheckButton />)

      expect(screen.getByText('システムヘルスチェック')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'ヘルスチェック実行' })
      ).toBeInTheDocument()
      expect(screen.queryByText('最終確認:')).not.toBeInTheDocument()
      expect(screen.queryByText('エラー')).not.toBeInTheDocument()
    })

    it('should have correct button styling in initial state', () => {
      render(<HealthCheckButton />)

      const button = screen.getByRole('button', { name: 'ヘルスチェック実行' })
      expect(button).toHaveClass(
        'bg-blue-600',
        'text-white',
        'hover:bg-blue-700'
      )
      expect(button).not.toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('should show loading state during API call', async () => {
      // APIレスポンスを遅延させる
      let resolvePromise: (value: {
        success: boolean
        data: DetailedHealthCheck
        error: string | null
      }) => void
      const mockPromise = new Promise<{
        success: boolean
        data: DetailedHealthCheck
        error: string | null
      }>(resolve => {
        resolvePromise = resolve
      })
      mockedGetDetailedHealth.mockReturnValue(mockPromise)

      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      // ローディング状態の確認
      expect(screen.getByText('確認中...')).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button).toHaveClass(
        'bg-gray-400',
        'text-white',
        'cursor-not-allowed'
      )

      // API解決
      resolvePromise!({
        success: true,
        data: mockHealthyResponse,
        error: null,
      })

      // state更新を待つ
      await waitFor(
        () => {
          expect(screen.queryByText('確認中...')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })

    it('should disable button clicks during loading', async () => {
      mockedGetDetailedHealth.mockResolvedValue({
        success: true,
        data: mockHealthyResponse,
        error: null,
      })

      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      // ローディング中の追加クリックを無視することを確認
      fireEvent.click(button)
      fireEvent.click(button)

      expect(mockedGetDetailedHealth).toHaveBeenCalledTimes(1)

      await waitFor(
        () => {
          expect(screen.queryByText('確認中...')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('Successful Health Check', () => {
    beforeEach(() => {
      mockedGetDetailedHealth.mockResolvedValue({
        success: true,
        data: mockHealthyResponse,
        error: null,
      })
    })

    it('should display successful health check result', async () => {
      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.queryByText('エラー')).not.toBeInTheDocument()
        expect(screen.getByText(/最終確認:/)).toBeInTheDocument()
      })
    })

    it('should display last checked time in Japanese format', async () => {
      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(
          screen.getByText(/最終確認: \d{1,2}:\d{2}:\d{2}/)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Unhealthy System Status', () => {
    beforeEach(() => {
      mockedGetDetailedHealth.mockResolvedValue({
        success: false,
        data: mockUnhealthyResponse,
        error: 'サービスに問題が発生しています',
      })
    })

    it('should display error message when API returns success:false', async () => {
      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('エラー')).toBeInTheDocument()
      })

      expect(
        screen.getByText('サービスに問題が発生しています')
      ).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const errorMessage = 'Network error occurred'
      mockedGetDetailedHealth.mockRejectedValue(new Error(errorMessage))

      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('エラー')).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      expect(screen.queryByText(/システムステータス:/)).not.toBeInTheDocument()
    })

    it('should handle non-Error objects gracefully', async () => {
      mockedGetDetailedHealth.mockRejectedValue('String error')

      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Executions', () => {
    it('should update state correctly on multiple health checks', async () => {
      render(<HealthCheckButton />)

      // 最初は成功
      mockedGetDetailedHealth.mockResolvedValueOnce({
        success: true,
        data: mockHealthyResponse,
        error: null,
      })

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.queryByText('エラー')).not.toBeInTheDocument()
        expect(screen.getByText(/最終確認:/)).toBeInTheDocument()
      })

      // 2回目はエラー
      mockedGetDetailedHealth.mockResolvedValueOnce({
        success: false,
        data: mockUnhealthyResponse,
        error: 'Service unavailable',
      })

      fireEvent.click(button)

      await waitFor(() => {
        expect(
          screen.getByText('サービスに問題が発生しています')
        ).toBeInTheDocument()
      })
    })

    it('should clear previous error on new successful check', async () => {
      render(<HealthCheckButton />)

      // 最初はエラー
      mockedGetDetailedHealth.mockRejectedValueOnce(
        new Error('Connection failed')
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Connection failed')).toBeInTheDocument()
      })

      // 2回目は成功
      mockedGetDetailedHealth.mockResolvedValueOnce({
        success: true,
        data: mockHealthyResponse,
        error: null,
      })

      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.queryByText('エラー')).not.toBeInTheDocument()
        expect(screen.getByText(/最終確認:/)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA roles and labels', () => {
      render(<HealthCheckButton />)

      const button = screen.getByRole('button', { name: 'ヘルスチェック実行' })
      expect(button).toBeInTheDocument()

      const heading = screen.getByRole('heading', {
        name: 'システムヘルスチェック',
      })
      expect(heading).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      mockedGetDetailedHealth.mockResolvedValue({
        success: true,
        data: mockHealthyResponse,
        error: null,
      })

      render(<HealthCheckButton />)

      const button = screen.getByRole('button')

      // フォーカスしてクリックで実行（キーボードアクセシビリティの確認）
      button.focus()
      expect(button).toHaveFocus()

      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.queryByText('エラー')).not.toBeInTheDocument()
        expect(screen.getByText(/最終確認:/)).toBeInTheDocument()
      })
    })
  })
})
