import { useState } from 'react'
import DocumentPreviewModal from '../global/DocumentPreviewModal'
import { ScrollScene, ScrollSceneLayer, ScrollSceneViewport } from '../motion/ScrollScene'

const PORTRAIT_URL = new URL('../../../assets/images/portrait-pengyang.webp', import.meta.url).href
const RESUME_URL = new URL('../../../assets/images/简历.jpg', import.meta.url).href

// Keep each visual tier on the same scroll-linked reveal curve so the
// hierarchy stays coordinated while still reversing naturally on scroll-up.
const PRIMARY_OPACITY = Object.freeze([[0, 0], [0.05, 0], [0.18, 0.38], [0.35, 1], [1, 1]])
const SECONDARY_OPACITY = Object.freeze([[0, 0], [0.12, 0], [0.28, 0.42], [0.48, 1], [1, 1]])
const TERTIARY_OPACITY = Object.freeze([[0, 0], [0.22, 0], [0.39, 0.38], [0.58, 1], [1, 1]])
const PRIMARY_BLUR = Object.freeze([[0, 6], [0.35, 0], [1, 0]])
const SECONDARY_BLUR = Object.freeze([[0, 7], [0.48, 0], [1, 0]])
const TERTIARY_BLUR = Object.freeze([[0, 7], [0.58, 0], [1, 0]])

const DISCIPLINE_Y = Object.freeze([[0, 8], [0.42, 0], [0.72, 0], [1, -5]])
const DISCIPLINE_OPACITY = PRIMARY_OPACITY
const DISCIPLINE_BLUR = PRIMARY_BLUR
const PORTRAIT_Y = Object.freeze([[0, 12], [0.5, 0], [0.72, 0], [1, -4]])
const PORTRAIT_OPACITY = SECONDARY_OPACITY
const PORTRAIT_BLUR = SECONDARY_BLUR
const PORTRAIT_SCALE = Object.freeze([[0, 0.96], [0.5, 1], [1, 1.025]])
const NAME_Y = Object.freeze([[0, 18], [0.5, 0], [0.72, 0], [1, -4]])
const NAME_OPACITY = SECONDARY_OPACITY
const NAME_BLUR = SECONDARY_BLUR
const CONTACTS_Y = Object.freeze([[0, 22], [0.58, 0], [0.72, 0], [1, -4]])
const CONTACTS_OPACITY = TERTIARY_OPACITY
const CONTACTS_BLUR = TERTIARY_BLUR
const LABEL_Y = DISCIPLINE_Y
const LABEL_OPACITY = DISCIPLINE_OPACITY
const LABEL_BLUR = DISCIPLINE_BLUR
const MAIN_Y = Object.freeze([[0, 18], [0.5, 0], [0.72, 0], [1, -7]])
const MAIN_OPACITY = SECONDARY_OPACITY
const MAIN_BLUR = SECONDARY_BLUR
const SUPPORTING_Y = Object.freeze([[0, 22], [0.58, 0], [0.72, 0], [1, -8]])
const SUPPORTING_OPACITY = TERTIARY_OPACITY
const SUPPORTING_BLUR = TERTIARY_BLUR

function EmailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <rect x="2.5" y="4" width="15" height="12" rx="0.5" />
      <path d="m3.25 5 6.75 5.25L16.75 5" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M6.15 2.75 8.2 6.7 6.55 8.2c.82 1.9 2.36 3.45 4.25 4.28l1.52-1.68 3.93 2.08-.7 3.45c-.12.58-.63.99-1.22.97C7.98 17.07 2.93 12.02 2.7 5.67c-.02-.59.39-1.1.97-1.22l2.48-.5Z" />
    </svg>
  )
}

export default function AboutSection() {
  const [resumeOpen, setResumeOpen] = useState(false)

  return (
    <>
      <ScrollScene
        className="about-scroll-scene"
        heightVh={165}
        id="about"
        aria-label="个人介绍"
      >
        <ScrollSceneViewport className="about-sticky">
        <div className="about-profile">
          <ScrollSceneLayer
            as="p"
            blurStops={DISCIPLINE_BLUR}
            className="about-profile__discipline"
            opacityStops={DISCIPLINE_OPACITY}
            yStops={DISCIPLINE_Y}
          >
            UI / UX DESIGNER
          </ScrollSceneLayer>
          <ScrollSceneLayer
            blurStops={PORTRAIT_BLUR}
            className="about-profile__portrait-layer"
            opacityStops={PORTRAIT_OPACITY}
            scaleStops={PORTRAIT_SCALE}
            yStops={PORTRAIT_Y}
          >
            <img
              alt="彭阳个人头像"
              className="about-profile__portrait"
              decoding="async"
              height="400"
              loading="eager"
              src={PORTRAIT_URL}
              width="400"
            />
          </ScrollSceneLayer>
          <div className="about-profile__details">
            <ScrollSceneLayer
              as="h2"
              blurStops={NAME_BLUR}
              opacityStops={NAME_OPACITY}
              yStops={NAME_Y}
            >
              彭阳
            </ScrollSceneLayer>
            <ScrollSceneLayer
              blurStops={CONTACTS_BLUR}
              className="about-profile__contacts"
              opacityStops={CONTACTS_OPACITY}
              yStops={CONTACTS_Y}
            >
              <a className="about-profile__contact mono" href="mailto:1004926891@qq.com">
                <EmailIcon />
                <span>1004926891@qq.com</span>
              </a>
              <a className="about-profile__contact mono" href="tel:15218968442">
                <PhoneIcon />
                <span>152 1896 8442</span>
              </a>
            </ScrollSceneLayer>
          </div>
        </div>

        <div className="about-content">
          <ScrollSceneLayer
            as="h2"
            blurStops={LABEL_BLUR}
            className="about-content__label"
            opacityStops={LABEL_OPACITY}
            yStops={LABEL_Y}
          >
            ABOUT
          </ScrollSceneLayer>
          <ScrollSceneLayer
            as="p"
            blurStops={MAIN_BLUR}
            className="about-content__main"
            opacityStops={MAIN_OPACITY}
            yStops={MAIN_Y}
          >
            <span className="about-content__main-line">10年 UI 设计经验，</span>
            <span className="about-content__main-line">覆盖车载 HMI、AI 产品、</span>
            <span className="about-content__main-line">移动端、B端及品牌视觉等领域。</span>
          </ScrollSceneLayer>
          <ScrollSceneLayer
            as="p"
            blurStops={SUPPORTING_BLUR}
            className="about-content__supporting"
            opacityStops={SUPPORTING_OPACITY}
            yStops={SUPPORTING_Y}
          >
            <span>具备从需求分析、策略规划、方案设计</span>
            <span>到落地交付的完整项目经验，</span>
            <span>兼具项目管理与 AI 辅助设计能力。</span>
          </ScrollSceneLayer>
          <ScrollSceneLayer
            blurStops={SUPPORTING_BLUR}
            className="about-content__resume"
            opacityStops={SUPPORTING_OPACITY}
            yStops={SUPPORTING_Y}
          >
            <button onClick={() => setResumeOpen(true)} type="button">简历详情</button>
          </ScrollSceneLayer>
        </div>
        </ScrollSceneViewport>
      </ScrollScene>

      {resumeOpen ? (
        <DocumentPreviewModal onClose={() => setResumeOpen(false)} title="简历详情">
          <div className="document-preview-dialog__scroll" data-lenis-prevent data-lenis-prevent-wheel>
            <img alt="彭阳个人简历" height="1795" src={RESUME_URL} width="595" />
          </div>
        </DocumentPreviewModal>
      ) : null}
    </>
  )
}
