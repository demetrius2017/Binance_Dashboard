import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chart error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-400">Chart Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Failed to render chart. Please refresh the page.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-500 mt-2">
                {this.state.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
