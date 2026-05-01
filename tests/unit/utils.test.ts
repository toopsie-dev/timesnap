import { describe, it, expect } from 'vitest'
import { cn } from '../../app/lib/utils'

describe('cn (class name utility)', () => {
  it('merges simple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles conditional falsy values', () => {
    expect(cn('base', false && 'never', undefined, null, 'end')).toBe('base end')
  })

  it('handles object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })

  it('handles array syntax', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })

  it('merges conflicting Tailwind padding classes', () => {
    expect(cn('p-4', 'py-2')).toBe('p-4 py-2')
    // py-2 overrides the y-axis padding set by p-4
    expect(cn('p-4 py-2', 'py-8')).toBe('p-4 py-8')
  })
})
