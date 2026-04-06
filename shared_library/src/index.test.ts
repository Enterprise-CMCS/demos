import { describe, it, expect } from 'vitest'
import { greet } from './index'

describe('greet', () => {
  it('returns greeting with the provided name', () => {
    expect(greet('World')).toBe('Hello, World!')
  })
})
