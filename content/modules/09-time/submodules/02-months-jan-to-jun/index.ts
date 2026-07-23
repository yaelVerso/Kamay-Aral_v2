import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'time-months-jan-jun',
  moduleId: 'time',
  title: 'Months: January to June',
  shortTitle: 'Jan–Jun',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'month-january', label: 'January', videoPath: videoUrl('/videos/time/january.mp4'), acceptedAnswers: ['january'] },
    { id: 'month-february', label: 'February', videoPath: videoUrl('/videos/time/february.mp4'), acceptedAnswers: ['february'] },
    { id: 'month-march', label: 'March', videoPath: videoUrl('/videos/time/march.mp4'), acceptedAnswers: ['march'] },
    { id: 'month-april', label: 'April', videoPath: videoUrl('/videos/time/april.mp4'), acceptedAnswers: ['april'] },
    { id: 'month-may', label: 'May', videoPath: videoUrl('/videos/time/may.mp4'), acceptedAnswers: ['may'] },
    { id: 'month-june', label: 'June', videoPath: videoUrl('/videos/time/june.mp4'), acceptedAnswers: ['june'] },
  ],
}

export default submodule
