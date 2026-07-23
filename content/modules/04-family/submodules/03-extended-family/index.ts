import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'family-extended-family',
  moduleId: 'family',
  title: 'Extended Family',
  shortTitle: 'Extended',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'family-grandmother', label: 'Grandmother', labelFil: 'Lola', videoPath: videoUrl('/videos/family/grandmother.mp4'), acceptedAnswers: ['grandmother', 'lola'] },
    { id: 'family-grandfather', label: 'Grandfather', labelFil: 'Lolo', videoPath: videoUrl('/videos/family/grandfather.mp4'), acceptedAnswers: ['grandfather', 'lolo'] },
    { id: 'family-aunt', label: 'Aunt', labelFil: 'Tita', videoPath: videoUrl('/videos/family/aunt.mp4'), acceptedAnswers: ['aunt', 'tita'] },
    { id: 'family-uncle', label: 'Uncle', labelFil: 'Tito', videoPath: videoUrl('/videos/family/uncle.mp4'), acceptedAnswers: ['uncle', 'tito'] },
    { id: 'family-cousin', label: 'Cousin', labelFil: 'Pinsan', videoPath: videoUrl('/videos/family/cousin.mp4'), acceptedAnswers: ['cousin', 'pinsan'] },
  ],
}

export default submodule
