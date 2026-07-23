import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'questions-pronouns-demonstratives',
  moduleId: 'questions-pronouns',
  title: 'This, That, Here, There',
  shortTitle: 'Demonstratives',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'demonstrative-this', label: 'This', videoPath: videoUrl('/videos/questions-pronouns/this.mp4'), acceptedAnswers: ['this'] },
    { id: 'demonstrative-that', label: 'That', videoPath: videoUrl('/videos/questions-pronouns/that.mp4'), acceptedAnswers: ['that'] },
    { id: 'demonstrative-here', label: 'Here', videoPath: videoUrl('/videos/questions-pronouns/here.mp4'), acceptedAnswers: ['here'] },
    { id: 'demonstrative-there', label: 'There', videoPath: videoUrl('/videos/questions-pronouns/there.mp4'), acceptedAnswers: ['there'] },
  ],
}

export default submodule
