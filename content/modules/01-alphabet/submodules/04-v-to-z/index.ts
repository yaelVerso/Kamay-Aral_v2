import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'alphabet-v-to-z',
  moduleId: 'alphabet',
  title: 'Letters V to Z',
  shortTitle: 'V–Z',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'letter-v', label: 'V', videoPath: videoUrl('/videos/alphabet/v.mp4'), acceptedAnswers: ['v'] },
    { id: 'letter-w', label: 'W', videoPath: videoUrl('/videos/alphabet/w.mp4'), acceptedAnswers: ['w'] },
    { id: 'letter-x', label: 'X', videoPath: videoUrl('/videos/alphabet/x.mp4'), acceptedAnswers: ['x'] },
    { id: 'letter-y', label: 'Y', videoPath: videoUrl('/videos/alphabet/y.mp4'), acceptedAnswers: ['y'] },
    { id: 'letter-z', label: 'Z', videoPath: videoUrl('/videos/alphabet/z.mp4'), acceptedAnswers: ['z'] },
  ],
}

export default submodule
