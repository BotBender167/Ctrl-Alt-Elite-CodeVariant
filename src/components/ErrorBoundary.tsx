import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface State {
  failed: boolean
}

// Last line of defence: a rendering bug shows a calm message instead of a blank page.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center bg-ink px-5 text-center text-cream">
        <div className="max-w-md">
          <h1 className="text-[72px]">The trail went cold</h1>
          <p className="mt-3 text-mist">Something broke on our side. Reloading usually fixes it.</p>
          <button type="button" className="btn mt-6" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </div>
      </div>
    )
  }
}
