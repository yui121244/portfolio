import { ScrollScene, ScrollSceneViewport } from '../motion/ScrollScene'
import { PROJECTS } from '../../data/projects'
import ProjectViewCursor from './ProjectViewCursor'
import ProjectCard from './ProjectCard'
import { useMobileLayout } from '../../lib/useMobileLayout'

export default function ProjectsSection() {
  const isMobile = useMobileLayout()
  return (
    <ScrollScene
      className="projects-scroll-scene"
      heightVh={360}
      id="projects"
      progressMode="sticky"
      aria-labelledby="projects-heading"
    >
      <ScrollSceneViewport className="projects-sticky">
        <h2
          className="projects-heading"
          data-projects-heading
          id="projects-heading"
        >
          <span>项目经历</span>
          <span className="projects-heading__secondary mono">/ PROJECTS</span>
        </h2>

        <div className="projects-track" data-projects-track>
          <ProjectCard featured index={0} project={PROJECTS[0]} />
          <div className="projects-grid">
            {PROJECTS.slice(1).map((project, index) => (
              <ProjectCard index={index + 1} key={project.name} project={project} />
            ))}
          </div>
        </div>
      </ScrollSceneViewport>
      {isMobile ? null : <ProjectViewCursor />}
    </ScrollScene>
  )
}
