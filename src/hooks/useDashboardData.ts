import { useEffect, useState } from 'react'
import type { DashboardData } from '../types'

type DataState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: DashboardData; error: null }
  | { status: 'error'; data: null; error: string }

export function useDashboardData(): DataState {
  const [state, setState] = useState<DataState>({
    status: 'loading',
    data: null,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    const dataUrl = `${import.meta.env.BASE_URL}data/dashboard.json`

    async function loadData() {
      try {
        const response = await fetch(dataUrl, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`The processed data returned ${response.status}.`)
        }
        const data = (await response.json()) as DashboardData
        setState({ status: 'ready', data, error: null })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'The processed data could not be loaded.',
        })
      }
    }

    void loadData()
    return () => controller.abort()
  }, [])

  return state
}
