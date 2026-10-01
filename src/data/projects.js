const coverAssets = {
  1: new URL('../../assets/images/01.webp', import.meta.url).href,
  2: new URL('../../assets/images/02.webp', import.meta.url).href,
  3: new URL('../../assets/images/03.webp', import.meta.url).href,
  4: new URL('../../assets/images/04.webp', import.meta.url).href,
  5: new URL('../../assets/images/05.webp', import.meta.url).href,
}

const mediaModules = import.meta.glob(
  '/assets/project/**/*.{jpg,jpeg,png,webp,gif,mp4,mov,m4v,webm}',
  { eager: true, import: 'default', query: '?url' },
)

const presentationModules = import.meta.glob(
  '/assets/ppt/*.pdf',
  { eager: true, import: 'default', query: '?url' },
)

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm'])
const PROJECT_MEDIA_PATTERN = /\/assets\/project\/(\d+)\/([^/]+)$/

function naturalOrder(left, right) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
}

function collectProjectMedia(projectId) {
  return Object.entries(mediaModules)
    .flatMap(([path, src]) => {
      const match = path.match(PROJECT_MEDIA_PATTERN)
      if (!match || Number(match[1]) !== projectId) return []
      const filename = match[2]
      const extension = filename.split('.').pop()?.toLowerCase() ?? ''
      return [{
        filename,
        src,
        type: VIDEO_EXTENSIONS.has(extension) ? 'video' : 'image',
      }]
    })
    .sort((left, right) => naturalOrder(left.filename, right.filename))
}

export const PROJECTS = Object.freeze([
  { id: 1, name: 'AURORA AI创意生产平台', year: '2026' },
  { id: 2, name: 'AURORA高奢手机官网', year: '2026' },
  { id: 3, name: '林肯冒险家 12.8寸屏HMI', year: '2018-2021' },
  { id: 4, name: '路特斯智能推荐探索Demo', year: '2022' },
  { id: 5, name: '设计成果与沉淀', year: '2018-2026' },
].map((project) => Object.freeze({
  ...project,
  cover: coverAssets[project.id],
  media: Object.freeze(collectProjectMedia(project.id)),
})))

export const PROJECT_DETAIL_NAVIGATION = Object.freeze({
  1: Object.freeze([
    { id: 'project-introduction', label: '项目介绍', start: '2.webp' },
    { id: 'brand-identity', label: '品牌标识', start: '3.webp' },
    { id: 'platform-showcase', label: '平台展示', start: '6.webp' },
    { id: 'design-strategy', label: '设计策略', start: '7.webp' },
    { id: 'ai-assistant', label: 'AI助手', start: '9.webp' },
    { id: 'visual-presentation', label: '视觉呈现', start: '11.webp' },
  ]),
  2: Object.freeze([
    { id: 'project-background', label: '项目背景', start: '1.webp' },
    { id: 'design-strategy', label: '设计策略', start: '3.webp' },
    { id: 'visual-language', label: '视觉语言', start: '4.webp' },
    { id: 'design-showcase', label: '设计展示', start: '5.webp' },
  ]),
  3: Object.freeze([
    { id: 'visual-presentation', label: '视觉呈现', start: '1.webp' },
    { id: 'theme-skins', label: '主题换肤', start: '10.webp' },
    { id: 'vehicle-controls', label: '车辆控制', start: '13.webp' },
    { id: 'usability-demo', label: '可用性测试Demo制作', start: '17' },
  ]),
  4: Object.freeze([
    { id: 'project-introduction', label: '项目介绍', start: '1.webp' },
    { id: 'design-strategy', label: '设计策略', start: '5.webp' },
    { id: 'design-showcase', label: '设计展示', start: '6.webp' },
    { id: 'demo-design', label: 'Demo设计', start: '14.webp' },
  ]),
  5: Object.freeze([
    { id: 'gui-patents', label: 'GUI外观专利', start: '1.webp' },
    { id: 'project-research', label: '项目沉淀', type: 'presentations' },
    {
      id: 'diverse-practice',
      label: '多元设计实践',
      children: Object.freeze([
        { id: 'hardware-ui', label: '电子烟智能硬件UI设计', start: '3.webp' },
        { id: 'cockpit-theme', label: '座舱主题探索', start: '5.webp' },
        { id: 'keyboard-skin', label: '输入法皮肤设计', start: '10.webp' },
        { id: 'ai-cultural-design', label: 'AI文创产品设计', start: '11.webp' },
      ]),
    },
  ]),
})

export const PROJECT_PPT_DOCUMENTS = Object.freeze(
  Object.entries(presentationModules)
    .map(([path, src]) => ({
      filename: path.split('/').pop(),
      src,
    }))
    .sort((left, right) => naturalOrder(left.filename, right.filename))
    .map((document) => Object.freeze(document)),
)

export function getProject(projectId) {
  return PROJECTS.find((project) => project.id === Number(projectId)) ?? null
}
