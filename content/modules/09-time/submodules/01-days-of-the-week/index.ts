import type { SubModule } from '@/content/types'
import { videoUrl, imageUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'time-days',
  moduleId: 'time',
  title: 'Days of the Week',
  shortTitle: 'Days',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'day-monday', label: 'Monday', videoPath: videoUrl('/videos/time/monday.mp4'), imagePath: imageUrl('/images/9 - time/9 - monday.png'),acceptedAnswers: ['monday'] },
    { id: 'day-tuesday', label: 'Tuesday', videoPath: videoUrl('/videos/time/tuesday.mp4'), imagePath: imageUrl('/images/9 - time/9 - tuesday.png'),acceptedAnswers: ['tuesday'] },
    { id: 'day-wednesday', label: 'Wednesday', videoPath: videoUrl('/videos/time/wednesday.mp4'), imagePath: imageUrl('/images/9 - time/9 - wednesday.png'),acceptedAnswers: ['wednesday'] },
    { id: 'day-thursday', label: 'Thursday', videoPath: videoUrl('/videos/time/thursday.mp4'), acceptedAnswers: ['thursday'] },
    { id: 'day-friday', label: 'Friday', videoPath: videoUrl('/videos/time/friday.mp4'), acceptedAnswers: ['friday'] },
    { id: 'day-saturday', label: 'Saturday', videoPath: videoUrl('/videos/time/saturday.mp4'), acceptedAnswers: ['saturday'] },
    { id: 'day-sunday', label: 'Sunday', videoPath: videoUrl('/videos/time/sunday.mp4'), acceptedAnswers: ['sunday'] },
  ],
}

export default submodule
