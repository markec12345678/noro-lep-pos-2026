'use client'

import { useEffect, useRef, useCallback } from 'react'
import { track, getSession } from '@/lib/analytics'

/**
 * useAnalytics — auto-tracks page views, section views, scroll depth
 * + provides manual track function
 * + global click delegation for [data-track] elements
 */
export function useAnalytics() {
  const trackedSections = useRef<Set<string>>(new Set())
  const scrollMilestones = useRef<Set<number>>(new Set())

  // Track page view on mount
  useEffect(() => {
    track({ type: 'page_view', section: 'home', label: document.title })
  }, [])

  // Track section views via IntersectionObserver
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            const id = entry.target.getAttribute('id')
            if (id && !trackedSections.current.has(id)) {
              trackedSections.current.add(id)
              track({ type: 'section_view', section: id })
            }
          }
        }
      },
      { threshold: 0.3 }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  // Track scroll depth milestones (25%, 50%, 75%, 100%)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0

      const milestones = [25, 50, 75, 100]
      for (const m of milestones) {
        if (pct >= m && !scrollMilestones.current.has(m)) {
          scrollMilestones.current.add(m)
          track({ type: 'scroll_depth', section: 'home', label: `${m}%`, value: m })
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Global click delegation — track elements with [data-track] attribute
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-track]') as HTMLElement | null
      if (target) {
        const trackType = target.getAttribute('data-track') || 'click'
        const trackLabel = target.getAttribute('data-track-label') || target.textContent?.trim().substring(0, 50)
        const trackSection = target.getAttribute('data-track-section')
        track({ type: trackType, label: trackLabel, section: trackSection || undefined })
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Manual track function
  const trackEvent = useCallback((event: {
    type: string
    section?: string
    label?: string
    value?: number | string
  }) => {
    track(event)
  }, [])

  return { trackEvent, sessionId: getSession().id }
}
