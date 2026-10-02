import { projectHref } from '../../lib/sitePaths'

export default function ProjectCard({ project, index, featured = false }) {
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
