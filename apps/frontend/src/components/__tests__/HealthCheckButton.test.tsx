import type { DetailedHealthCheck } from '@template/api-contracts-ts'
import { getMessageSafe, type MessageKey } from '@template/shared'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getDetailedHealth } from '@/lib/api'

import { HealthCheckButton } from '../HealthCheckButton'

// APIモジュールをモック
vi.mock('@/lib/api', () => ({
  getDetailedHealth: vi.fn(),
}))

const mockedGetDetailedHealth = vi.mocked(getDetailedHealth)

type HealthResult = Awaited<ReturnType<typeof getDetailedHealth>>

const t = (key: MessageKey) => getMessageSafe(key, 'ja')

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

      expect(
        screen.getByText(t('ui.system_health_check_title'))
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: t('action.run_health_check') })
      ).toBeInTheDocument()
      expect(
        screen.queryByText(`${t('ui.last_checked')}:`)
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText(t('action.error_occurred'))
      ).not.toBeInTheDocument()
    })

    it('should have correct button styling in initial state', () => {
      render(<HealthCheckButton />)

      const button = screen.getByRole('button', {
        name: t('action.run_health_check'),
      })
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
      let resolvePromise: (value: HealthResult) => void
      const mockPromise = new Promise<HealthResult>(resolve => {
        resolvePromise = resolve
      })
      mockedGetDetailedHealth.mockReturnValue(mockPromise)

      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      // ローディング状態の確認
      expect(screen.getByText(t('ui.loading'))).toBeInTheDocument()
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
          expect(screen.queryByText(t('ui.loading'))).not.toBeInTheDocument()
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
          expect(screen.queryByText(t('ui.loading'))).not.toBeInTheDocument()
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
        expect(
          screen.queryByText(t('action.error_occurred'))
        ).not.toBeInTheDocument()
        const lastChecked = screen.getByText(content =>
          content.startsWith(`${t('ui.last_checked')}:`)
        )
        expect(lastChecked).toBeInTheDocument()
      })
    })

    it('should display last checked time in Japanese format', async () => {
      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        const lastChecked = screen.getByText(content =>
          content.startsWith(`${t('ui.last_checked')}:`)
        )
        expect(lastChecked.textContent ?? '').toMatch(/\d{1,2}:\d{2}:\d{2}$/)
      })
    })
  })

  describe('Unhealthy System Status', () => {
    beforeEach(() => {
      mockedGetDetailedHealth.mockResolvedValue({
        success: false,
        data: mockUnhealthyResponse,
        error: 'error.unknown_error',
      })
    })

    it('should display error message when API returns success:false', async () => {
      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(t('action.error_occurred'))).toBeInTheDocument()
      })

      expect(screen.getByText(t('error.unknown_error'))).toBeInTheDocument()
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
        expect(screen.getByText(t('action.error_occurred'))).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      expect(
        screen.queryByText(content =>
          content.startsWith(`${t('ui.system_status')}:`)
        )
      ).not.toBeInTheDocument()
    })

    it('should handle non-Error objects gracefully', async () => {
      mockedGetDetailedHealth.mockRejectedValue('String error')

      render(<HealthCheckButton />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(t('action.error_occurred'))).toBeInTheDocument()
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
        expect(
          screen.queryByText(t('action.error_occurred'))
        ).not.toBeInTheDocument()
        const lastChecked = screen.getByText(content =>
          content.startsWith(`${t('ui.last_checked')}:`)
        )
        expect(lastChecked).toBeInTheDocument()
      })

      // 2回目はエラー
      mockedGetDetailedHealth.mockResolvedValueOnce({
        success: false,
        data: mockUnhealthyResponse,
        error: 'error.unknown_error',
      })

      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(t('error.unknown_error'))).toBeInTheDocument()
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
        expect(
          screen.queryByText(t('action.error_occurred'))
        ).not.toBeInTheDocument()
        const lastChecked = screen.getByText(content =>
          content.startsWith(`${t('ui.last_checked')}:`)
        )
        expect(lastChecked).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA roles and labels', () => {
      render(<HealthCheckButton />)

      const button = screen.getByRole('button', {
        name: t('action.run_health_check'),
      })
      expect(button).toBeInTheDocument()

      const heading = screen.getByRole('heading', {
        name: t('ui.system_health_check_title'),
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
        expect(
          screen.queryByText(t('action.error_occurred'))
        ).not.toBeInTheDocument()
        const lastChecked = screen.getByText(content =>
          content.startsWith(`${t('ui.last_checked')}:`)
        )
        expect(lastChecked).toBeInTheDocument()
      })
    })
  })
})
