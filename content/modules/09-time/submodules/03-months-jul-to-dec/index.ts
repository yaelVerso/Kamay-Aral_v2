import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'time-months-jul-dec',
  moduleId: 'time',
  title: 'Months: July to December',
  shortTitle: 'Jul–Dec',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'month-july', label: 'July', videoPath: videoUrl('/videos/time/july.mp4'), acceptedAnswers: ['july'] },
    { id: 'month-august', label: 'August', videoPath: videoUrl('/videos/time/august.mp4'), acceptedAnswers: ['august'] },
    { id: 'month-september', label: 'September', videoPath: videoUrl('/videos/time/september.mp4'), acceptedAnswers: ['september'] },
    { id: 'month-october', label: 'October', videoPath: videoUrl('/videos/time/october.mp4'), acceptedAnswers: ['october'] },
    { id: 'month-november', label: 'November', videoPath: videoUrl('/videos/time/november.mp4'), acceptedAnswers: ['november'] },
    { id: 'month-december', label: 'December', videoPath: videoUrl('/videos/time/december.mp4'), acceptedAnswers: ['december'] },
  ],
}

export default submodule
