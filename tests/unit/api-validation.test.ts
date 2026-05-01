import { describe, it, expect } from 'vitest'

/**
 * Validates that a project creation payload has the required fields.
 * Mirrors the validation logic expected in the API route.
 */
function validateCreateProjectPayload(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Body must be an object' }
  const b = body as Record<string, unknown>
  if (typeof b.name !== 'string' || b.name.trim() === '') {
    return { valid: false, error: 'name is required and must be a non-empty string' }
  }
  if (b.description !== undefined && typeof b.description !== 'string') {
    return { valid: false, error: 'description must be a string' }
  }
  if (b.estimatedHours !== undefined && b.estimatedHours !== null) {
    const h = Number(b.estimatedHours)
    if (isNaN(h) || h <= 0) {
      return { valid: false, error: 'estimatedHours must be a positive number' }
    }
  }
  return { valid: true }
}

/**
 * Validates a sub-feature time-log entry's timestamps.
 */
function validateTimestamps(startedAt: unknown, stoppedAt: unknown): { valid: boolean; error?: string } {
  if (typeof startedAt !== 'number' || typeof stoppedAt !== 'number') {
    return { valid: false, error: 'startedAt and stoppedAt must be numbers' }
  }
  if (stoppedAt <= startedAt) {
    return { valid: false, error: 'stoppedAt must be after startedAt' }
  }
  return { valid: true }
}

describe('validateCreateProjectPayload', () => {
  it('accepts a valid minimal payload', () => {
    expect(validateCreateProjectPayload({ name: 'My Project' })).toEqual({ valid: true })
  })

  it('accepts a full payload', () => {
    expect(validateCreateProjectPayload({
      name: 'Full Project',
      description: 'Desc',
      estimatedHours: 8,
    })).toEqual({ valid: true })
  })

  it('rejects missing name', () => {
    const result = validateCreateProjectPayload({ description: 'No name' })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/name/)
  })

  it('rejects empty name', () => {
    const result = validateCreateProjectPayload({ name: '   ' })
    expect(result.valid).toBe(false)
  })

  it('rejects non-object body', () => {
    expect(validateCreateProjectPayload(null)).toMatchObject({ valid: false })
    expect(validateCreateProjectPayload('string')).toMatchObject({ valid: false })
  })

  it('rejects non-string description', () => {
    const result = validateCreateProjectPayload({ name: 'P', description: 123 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/description/)
  })

  it('rejects zero or negative estimatedHours', () => {
    expect(validateCreateProjectPayload({ name: 'P', estimatedHours: 0 }).valid).toBe(false)
    expect(validateCreateProjectPayload({ name: 'P', estimatedHours: -5 }).valid).toBe(false)
  })

  it('allows null estimatedHours', () => {
    expect(validateCreateProjectPayload({ name: 'P', estimatedHours: null })).toEqual({ valid: true })
  })
})

describe('validateTimestamps', () => {
  it('accepts valid start and stop', () => {
    expect(validateTimestamps(1000, 5000)).toEqual({ valid: true })
  })

  it('rejects equal timestamps', () => {
    const result = validateTimestamps(5000, 5000)
    expect(result.valid).toBe(false)
  })

  it('rejects reversed timestamps', () => {
    const result = validateTimestamps(9000, 1000)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/after/)
  })

  it('rejects non-number types', () => {
    expect(validateTimestamps('2024', 5000).valid).toBe(false)
    expect(validateTimestamps(1000, null).valid).toBe(false)
  })
})
