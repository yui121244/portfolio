import { ScrollScene, ScrollSceneViewport } from '../motion/ScrollScene'
import { PROJECTS } from '../../data/projects'
import ProjectViewCursor from './ProjectViewCursor'
import { projectHref } from '../../lib/sitePaths'

function ProjectCard({ project, index, featured = false }) {
  return (
    <article
      className={`project-card${featured ? ' project-card--featured' : ''}`}
      data-project-card
      data-project-index={index}
    >
      <a
        aria-label={`查看 ${project.name} 项目详情`}
        className="project-card__link"
        data-project-link
        href={projectHref(project.id)}
      >
        <figure className="project-card__image" data-project-hover-target>
          <img
            alt={`${project.name} 项目视觉`}
            decoding="async"
            height="941"
            loading="lazy"
            src={project.cover}
            width="1672"
          />
        </figure>
        <div className="project-card__metadata mono">
          <p className="project-card__name">
            <span>{String(index + 1).padStart(2, '0')}.</span>
            <span>{project.name}</span>
          </p>
          <p className="project-card__details">
            <span>{project.year}</span>
          </p>
        </div>
      </a>
    </article>
  )
}

export default function ProjectsSection() {
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
      <ProjectViewCursor />
    </ScrollScene>
  )
}
