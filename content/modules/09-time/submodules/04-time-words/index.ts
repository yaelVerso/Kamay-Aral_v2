import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'time-time-words',
  moduleId: 'time',
  title: 'Time Words',
  shortTitle: 'Time',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'time-today', label: 'Today', videoPath: videoUrl('/videos/time/today.mp4'), acceptedAnswers: ['today'] },
    { id: 'time-tomorrow', label: 'Tomorrow', videoPath: videoUrl('/videos/time/tomorrow.mp4'), acceptedAnswers: ['tomorrow'] },
    { id: 'time-yesterday', label: 'Yesterday', videoPath: videoUrl('/videos/time/yesterday.mp4'), acceptedAnswers: ['yesterday'] },
    { id: 'time-morning', label: 'Morning', videoPath: videoUrl('/videos/time/morning.mp4'), acceptedAnswers: ['morning'] },
    { id: 'time-afternoon', label: 'Afternoon', videoPath: videoUrl('/videos/time/afternoon.mp4'), acceptedAnswers: ['afternoon'] },
    { id: 'time-evening', label: 'Evening', videoPath: videoUrl('/videos/time/evening.mp4'), acceptedAnswers: ['evening'] },
    { id: 'time-early', label: 'Early', videoPath: videoUrl('/videos/time/early.mp4'), acceptedAnswers: ['early'] },
    { id: 'time-late', label: 'Late', videoPath: videoUrl('/videos/time/late.mp4'), acceptedAnswers: ['late'] },
  ],
}

export default submodule
