import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'school-places',
  moduleId: 'school',
  title: 'Places in School',
  shortTitle: 'Places',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'school-place-school', label: 'School', videoPath: videoUrl('/videos/school/school.mp4'), acceptedAnswers: ['school'] },
    { id: 'school-place-classroom', label: 'Classroom', videoPath: videoUrl('/videos/school/classroom.mp4'), acceptedAnswers: ['classroom'] },
    { id: 'school-place-library', label: 'Library', videoPath: videoUrl('/videos/school/library.mp4'), acceptedAnswers: ['library'] },
    { id: 'school-place-canteen', label: 'Canteen', videoPath: videoUrl('/videos/school/canteen.mp4'), acceptedAnswers: ['canteen'] },
    { id: 'school-place-playground', label: 'Playground', videoPath: videoUrl('/videos/school/playground.mp4'), acceptedAnswers: ['playground'] },
    { id: 'school-place-office', label: 'Office', videoPath: videoUrl('/videos/school/office.mp4'), acceptedAnswers: ['office'] },
    { id: 'school-place-toilet', label: 'Toilet', videoPath: videoUrl('/videos/school/toilet.mp4'), acceptedAnswers: ['toilet'] },
  ],
}

export default submodule
