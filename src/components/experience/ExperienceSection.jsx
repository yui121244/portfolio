import { useCallback, useEffect, useRef, useState } from 'react'
import { scrollToPagePosition } from '../../lib/scrollCommands'
import { ScrollScene, ScrollSceneViewport } from '../motion/ScrollScene'

const EXPERIENCES = Object.freeze([
  {
    year: '2026',
    date: '2026.02 - 2026.07',
    company: '一曌科技',
    role: '资深UI设计师',
    description: ['AURORA AI平台 / AI产品设计 /', '高奢手机官网 / 移动端产品'],
    note: '外派：外企德科',
    logo: new URL('../../../assets/companylogo/dreame.webp', import.meta.url).href,
  },
  {
    year: '2022',
    date: '2022.11 - 2025.12',
    company: '自由职业',
    role: '独立产品设计师',
    description: ['AI文创产品设计 / 移动端APP /', 'UX&UI设计'],
    logo: new URL('../../../assets/companylogo/me.webp', import.meta.url).href,
  },
  {
    year: '2021',
    date: '2021.12 - 2022.10',
    company: '武汉路特斯汽车',
    role: '资深UI设计师',
    description: ['车载HMI / 智能座舱前瞻探索 /', 'B端产品 / 官网设计'],
    logo: new URL('../../../assets/companylogo/lotus.webp', import.meta.url).href,
  },
  {
    year: '2018',
    date: '2018.11 - 2021.08',
    company: '百度车联网',
    role: '资深UI设计师',
    description: ['车载HMI设计 / UI设计 / 林肯 /', '野马 / 福特'],
    note: '外派：软通动力',
    logo: new URL('../../../assets/companylogo/baidu.webp', import.meta.url).href,
  },
  {
    year: '2014',
    date: '2014.07 - 2017.10',
    company: '北京深度沟通',
    role: '高级UI设计师',
    description: ['Global Visa全球签证平台 /', 'ISOP售前作战平台 /', 'iSales销售管理平台 / 移动端'],
    logo: new URL('../../../assets/companylogo/deep.webp', import.meta.url).href,
  },
  {
    year: '2012',
    date: '2012.02 - 2014.05',
    company: '汕头永图',
    role: '视觉设计师',
    description: ['企业官网 / 电商平台 / 品牌视觉 /', '平面设计'],
    logo: new URL('../../../assets/companylogo/yongtu.webp', import.meta.url).href,
  },
])

const EXPERIENCE_PAIRS = Object.freeze([
  EXPERIENCES.slice(0, 2),
  EXPERIENCES.slice(2, 4),
  EXPERIENCES.slice(4, 6),
])

const NODE_PROGRESS = Object.freeze([0.04, 0.22, 0.42, 0.63, 0.83, 1])
function ExperienceItem({ experience, focused, itemIndex }) {
  return (
    <article className="experience-card" data-experience-card data-experience-card-index={itemIndex} data-focused={focused || undefined}>
      <div className="experience-card__text" data-experience-text>
        <div className="experience-card__year-block">
          <h3>{experience.year}</h3>
          <p className="experience-card__date mono">{experience.date}</p>
        </div>
        <div className="experience-card__details">
          <h4>{experience.company}</h4>
          <p className="experience-card__role">{experience.role}</p>
          <p className="experience-card__description">
            {experience.description.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
          {experience.note ? <p className="experience-card__note">{experience.note}</p> : null}
        </div>
      </div>
      <figure className="experience-card__visual" data-experience-visual>
        <img
          alt={`${experience.company}视觉标识`}
          decoding="async"
          height="372"
          loading="lazy"
          src={experience.logo}
          width="500"
        />
      </figure>
    </article>
  )
}

export default function ExperienceSection() {
  const sceneRef = useRef(null)
  const focusTimerRef = useRef(0)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [hoveredIndex, setHoveredIndex] = useState(-1)

  useEffect(() => () => {
    window.clearTimeout(focusTimerRef.current)
  }, [])

  const handleNodeClick = useCallback((index) => {
    const scene = sceneRef.current
    if (!scene) return

    const progress = NODE_PROGRESS[index]
    const scrollDistance = Math.max(scene.offsetHeight - window.innerHeight, 0)
    window.clearTimeout(focusTimerRef.current)
    setFocusedIndex(-1)
    scrollToPagePosition(scene.offsetTop + scrollDistance * progress, {
      onComplete: () => {
        setFocusedIndex(index)
        focusTimerRef.current = window.setTimeout(() => setFocusedIndex(-1), 600)
      },
    })
  }, [])

  return (
    <ScrollScene
      className="experience-scroll-scene"
      heightVh={300}
      id="work"
      progressMode="sticky"
      ref={sceneRef}
      aria-labelledby="experience-heading"
    >
      <ScrollSceneViewport className="experience-sticky">
        <h2 className="experience-heading" data-experience-heading id="experience-heading">
          <span>工作经历</span>
          <span className="experience-heading__secondary mono">/ EXPERIENCE</span>
        </h2>

        <nav className="experience-timeline" data-experience-timeline aria-label="按年份选择工作经历">
          <span className="experience-timeline__line" aria-hidden="true">
            <span className="experience-timeline__line-progress" />
          </span>
          <ol>
            {EXPERIENCES.map((experience, index) => (
              <li key={experience.year} style={{ '--node-threshold': index / (EXPERIENCES.length - 1) }}>
                <button
                  className="experience-timeline__node"
                  data-hovered={hoveredIndex === index || undefined}
                  onClick={() => handleNodeClick(index)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(-1)}
                  onPointerMove={() => setHoveredIndex(index)}
                  type="button"
                  aria-label={`查看 ${experience.year} 年 ${experience.company} 工作经历`}
                >
                  <span className="experience-timeline__year">
                    <span>{experience.year}</span>
                    <span className="experience-timeline__year-active" aria-hidden="true">{experience.year}</span>
                  </span>
                  <span className="experience-timeline__dot" aria-hidden="true">
                    <span />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="experience-content">
          <div className="experience-track">
            {EXPERIENCE_PAIRS.map((pair, stateIndex) => {
              const stateStartIndex = stateIndex * 2
              const focusActive = focusedIndex >= stateStartIndex && focusedIndex < stateStartIndex + 2

              return (
                <div
                  className="experience-state"
                  data-experience-state
                  data-experience-state-index={stateIndex}
                  data-focus-active={focusActive || undefined}
                  key={pair[0].year}
                >
                  {pair.map((experience, pairIndex) => {
                    const itemIndex = stateStartIndex + pairIndex
                    return (
                      <ExperienceItem
                        experience={experience}
                        focused={focusedIndex === itemIndex}
                        itemIndex={itemIndex}
                        key={experience.year}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </ScrollSceneViewport>
    </ScrollScene>
  )
}
