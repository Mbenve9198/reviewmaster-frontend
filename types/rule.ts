export interface Rule {
  _id: string
  name: string
  condition: {
    field: string
    operator: string
    value: string | string[] | number
  }
  response: {
    text: string
    settings: {
      style: 'professional' | 'friendly'
      length: 'short' | 'medium' | 'long'
    }
  }
  isActive: boolean
  priority: number
} 