'use client'

import { useEffect, useRef, useCallback } from 'react'
import { track, getSession } from '@/lib/analytics'

export function useAnalytics() {
  const trackedSections = useRef<Set<string>>(new Set())
  const scrollMilestones = useRef<Set<number>>(new Set())

  useEffect(() => {
    track({ type: 'page_view', section: 'home', label: document.title })
  }, [])

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
          const id = entry.target.getAttribute('id')
          if (id && !trackedSections.current.has(id)) {
            trackedSections.current.add(id)
            track({ type: 'section_view', section: id })
          }
        }
      }
    }, { threshold: 0.3 })
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
      for (const m of [25, 50, 75, 100]) {
        if (pct >= m && !scrollMilestones.current.has(m)) {
          scrollMilestones.current.add(m)
          track({ type: 'scroll_depth', label: `${m}%`, value: m })
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-track]') as HTMLElement | null
      if (target) {
        track({
          type: target.getAttribute('data-track') || 'click',
          label: target.getAttribute('data-track-label') || target.textContent?.trim().substring(0, 50),
          section: target.getAttribute('data-track-section') || undefined,
        })
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const trackEvent = useCallback((event: { type: string; section?: string; label?: string; value?: number | string }) => {
    track(event)
  }, [])

  return { trackEvent, sessionId: getSession().id }
}
