import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'school-classroom-items',
  moduleId: 'school',
  title: 'Classroom Items',
  shortTitle: 'Classroom',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'school-book', label: 'Book', videoPath: videoUrl('/videos/school/book.mp4'), acceptedAnswers: ['book'] },
    { id: 'school-notebook', label: 'Notebook', videoPath: videoUrl('/videos/school/notebook.mp4'), acceptedAnswers: ['notebook'] },
    { id: 'school-bag', label: 'Bag', videoPath: videoUrl('/videos/school/bag.mp4'), acceptedAnswers: ['bag'] },
    { id: 'school-board', label: 'Board', videoPath: videoUrl('/videos/school/board.mp4'), acceptedAnswers: ['board'] },
    { id: 'school-chalk', label: 'Chalk', videoPath: videoUrl('/videos/school/chalk.mp4'), acceptedAnswers: ['chalk'] },
    { id: 'school-chair', label: 'Chair', videoPath: videoUrl('/videos/school/chair.mp4'), acceptedAnswers: ['chair'] },
  ],
}

export default submodule
