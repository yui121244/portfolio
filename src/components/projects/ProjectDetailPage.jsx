import { useEffect, useMemo, useRef, useState } from 'react'
import DocumentPreviewModal from '../global/DocumentPreviewModal'
import GlobalChrome from '../global/GlobalChrome'
import GlobalCursor from '../global/GlobalCursor'
import { ENTRANCE_PHASE } from '../../lib/entranceTimeline'
import { projectHref, SITE_BASE } from '../../lib/sitePaths'
import {
  PROJECT_DETAIL_NAVIGATION,
  PROJECT_PPT_DOCUMENTS,
  PROJECTS,
} from '../../data/projects'

const DETAIL_TABS = Object.freeze([
  '项目概览',
  '设计策略',
  '视觉系统',
  '交互体验',
  '成果展示',
])

function partitionMedia(media) {
  return DETAIL_TABS.map((label, groupIndex) => {
    const start = Math.round((media.length * groupIndex) / DETAIL_TABS.length)
    const end = Math.round((media.length * (groupIndex + 1)) / DETAIL_TABS.length)
    return {
      id: `project-section-${groupIndex + 1}`,
      label,
      media: media.slice(start, end),
    }
  })
}

function mediaMatchesAnchor(filename, anchor) {
  if (filename === anchor) return true
  return filename.replace(/\.[^.]+$/, '') === anchor.replace(/\.[^.]+$/, '')
}

function flattenAnchoredItems(items) {
  return items.flatMap((item) => {
    if (item.children) return flattenAnchoredItems(item.children)
    return item.start ? [item] : []
  })
}

function groupMediaByNavigation(media, navigation) {
  const anchoredItems = flattenAnchoredItems(navigation)
    .map((item) => ({
      ...item,
      startIndex: media.findIndex((mediaItem) => mediaMatchesAnchor(mediaItem.filename, item.start)),
    }))
    .filter((item) => item.startIndex >= 0)
    .sort((left, right) => left.startIndex - right.startIndex)

  const groups = anchoredItems.map((item, index) => ({
    id: item.id,
    label: item.label,
    media: media.slice(item.startIndex, anchoredItems[index + 1]?.startIndex ?? media.length),
  }))

  // Keep leading media even when the first sidebar anchor starts after the cover.
  const introEnd = anchoredItems[0]?.startIndex ?? media.length
  if (introEnd > 0) {
    groups.unshift({
      id: 'project-intro-media',
      label: '项目封面',
      isIntro: true,
      media: media.slice(0, introEnd),
    })
  }
  return groups
}

function createDetailModel(project) {
  const navigation = PROJECT_DETAIL_NAVIGATION[project.id]
  if (!navigation) {
    const groups = partitionMedia(project.media)
    return {
      groups,
      navigation: groups.map(({ id, label }) => ({ id, label })),
    }
  }

  return {
    groups: groupMediaByNavigation(project.media, navigation),
    navigation,
  }
}

function ProjectMedia({ item, index, projectId, projectName }) {
  if (item.type === 'video') {
    const mediaNumber = Number.parseInt(item.filename, 10)
    const isSilent = (
      // Muting allows project 01 demos to autoplay without a browser gesture.
      projectId === 1
      || (projectId === 3 && [2, 8, 9, 16, 17].includes(mediaNumber))
      || (projectId === 4 && mediaNumber === 11)
    )

    return (
      <figure className="project-detail-media project-detail-media--video" data-project-media={item.filename}>
        <video
          aria-label={`${projectName} 项目视频 ${index + 1}`}
          autoPlay={isSilent}
          controls
          loop
          muted={isSilent}
          playsInline
          preload="metadata"
          src={item.src}
        />
      </figure>
    )
  }

  return (
    <figure className="project-detail-media" data-project-media={item.filename}>
      <img
        alt={`${projectName} 项目展示 ${index + 1}`}
        decoding="async"
        fetchPriority={index === 0 ? 'high' : 'auto'}
        height="1080"
        loading={index === 0 ? 'eager' : 'lazy'}
        src={item.src}
        width="1920"
      />
    </figure>
  )
}

function ProjectDetailNavigation({ activeSection, items, onAnchor, onPresentation }) {
  const renderAnchor = (item, nested = false) => (
    <a
      aria-current={activeSection === item.id ? 'location' : undefined}
      className={nested ? 'project-detail-tab-link project-detail-tab-link--nested' : 'project-detail-tab-link'}
      href={`#${item.id}`}
      onClick={(event) => onAnchor(event, item.id)}
    >
      {nested ? null : <span className="project-detail-tab-dot" aria-hidden="true" />}
      <span>{item.label}</span>
    </a>
  )

  return (
    <ol>
      {items.map((item) => {
        const firstChild = item.children?.[0]
        const parentIsActive = item.children?.some((child) => child.id === activeSection)

        return (
          <li key={item.id}>
            {item.type === 'presentations' ? (
              <>
                <span className="project-detail-tab-label">
                  <span className="project-detail-tab-dot" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                <ol className="project-detail-tab-sublist project-detail-tab-sublist--documents">
                  {PROJECT_PPT_DOCUMENTS.map((document) => (
                    <li key={document.filename}>
                      <button type="button" onClick={() => onPresentation(document)}>
                        {document.filename}
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            ) : item.children ? (
              <>
                <a
                  aria-current={parentIsActive ? 'location' : undefined}
                  className="project-detail-tab-link"
                  href={`#${firstChild.id}`}
                  onClick={(event) => onAnchor(event, firstChild.id)}
                >
                  <span className="project-detail-tab-dot" aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
                <ol className="project-detail-tab-sublist">
                  {item.children.map((child) => (
                    <li key={child.id}>{renderAnchor(child, true)}</li>
                  ))}
                </ol>
              </>
            ) : renderAnchor(item)}
          </li>
        )
      })}
    </ol>
  )
}

function PresentationModal({ document, onClose }) {
  if (!document) return null

  return (
    <DocumentPreviewModal onClose={onClose} title={document.filename}>
      <iframe
        className="document-preview-dialog__pdf"
        src={`${document.src}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
        title={`${document.filename} 完整PDF预览`}
      />
    </DocumentPreviewModal>
  )
}

function ProjectSwitcher({ currentProjectId, placement }) {
  const isFooter = placement === 'footer'

  return (
    <nav
      className={`project-detail-projects project-detail-projects--${placement}`}
      aria-label={isFooter ? '页尾项目切换' : '项目切换'}
    >
      <ol>
        {PROJECTS.map((item) => (
          <li key={item.id}>
            <a
              aria-current={item.id === currentProjectId ? 'page' : undefined}
              href={projectHref(item.id)}
            >
              <span>{String(item.id).padStart(2, '0')}.</span>
              <span>{item.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default function ProjectDetailPage({ project }) {
  const [activeSection, setActiveSection] = useState('project-section-1')
  const [activePresentation, setActivePresentation] = useState(null)
  const cursorBackgroundRef = useRef(1)
  const detailModel = useMemo(() => createDetailModel(project), [project])
  const { groups, navigation } = detailModel

  useEffect(() => {
    document.title = `${project.name} — PENGYANG.DESIGN`
    setActiveSection(groups.find((group) => !group.isIntro)?.id ?? '')
    setActivePresentation(null)
    window.scrollTo(0, 0)

    const sections = [...document.querySelectorAll('[data-project-detail-section]')]
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)
      if (visible[0]) setActiveSection(visible[0].target.id)
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [groups, project])

  const handleAnchor = (event, sectionId) => {
    const target = document.getElementById(sectionId)
    if (!target) return
    event.preventDefault()
    setActiveSection(sectionId)
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${sectionId}`)
  }

  let mediaIndex = 0

  return (
    <div className="project-detail-shell">
      <GlobalChrome
        homeHref={SITE_BASE}
        phase={ENTRANCE_PHASE.READY}
        sectionHrefPrefix={SITE_BASE}
      />
      <GlobalCursor backgroundProgressRef={cursorBackgroundRef} visible />

      <main className="project-detail-main">
        <header className="project-detail-header">
          <ProjectSwitcher currentProjectId={project.id} placement="header" />
          <p className="project-detail-index">PROJECT {String(project.id).padStart(2, '0')}</p>
          <h1>{project.name}</h1>
          <p className="project-detail-year">{project.year}</p>
        </header>

        <div className="project-detail-layout">
          <aside className="project-detail-tabs" aria-label="项目内容导航">
            <ProjectDetailNavigation
              activeSection={activeSection}
              items={navigation}
              onAnchor={handleAnchor}
              onPresentation={setActivePresentation}
            />
          </aside>

          <div className="project-detail-content">
            {groups.map((group) => (
              <section
                className="project-detail-section"
                data-project-detail-section={group.isIntro ? undefined : true}
                id={group.id}
                key={group.id}
              >
                <h2 className="visually-hidden">{group.label}</h2>
                {group.media.map((item) => {
                  const currentIndex = mediaIndex
                  mediaIndex += 1
                  return (
                    <ProjectMedia
                      index={currentIndex}
                      item={item}
                      key={item.filename}
                      projectId={project.id}
                      projectName={project.name}
                    />
                  )
                })}
              </section>
            ))}
          </div>

          <footer className="project-detail-footer">
            <ProjectSwitcher currentProjectId={project.id} placement="footer" />
          </footer>
        </div>
      </main>

      <PresentationModal document={activePresentation} onClose={() => setActivePresentation(null)} />
    </div>
  )
}
