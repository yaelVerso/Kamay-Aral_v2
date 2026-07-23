import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'questions-pronouns-pronouns',
  moduleId: 'questions-pronouns',
  title: 'Pronouns',
  shortTitle: 'Pronouns',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'pronoun-i', label: 'I', videoPath: videoUrl('/videos/questions-pronouns/i.mp4'), acceptedAnswers: ['i'] },
    { id: 'pronoun-you', label: 'You', videoPath: videoUrl('/videos/questions-pronouns/you.mp4'), acceptedAnswers: ['you'] },
    { id: 'pronoun-he', label: 'He', videoPath: videoUrl('/videos/questions-pronouns/he.mp4'), acceptedAnswers: ['he'] },
    { id: 'pronoun-she', label: 'She', videoPath: videoUrl('/videos/questions-pronouns/she.mp4'), acceptedAnswers: ['she'] },
    { id: 'pronoun-we', label: 'We', videoPath: videoUrl('/videos/questions-pronouns/we.mp4'), acceptedAnswers: ['we'] },
    { id: 'pronoun-they', label: 'They', videoPath: videoUrl('/videos/questions-pronouns/they.mp4'), acceptedAnswers: ['they'] },
  ],
}

export default submodule
