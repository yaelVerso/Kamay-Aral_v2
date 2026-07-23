import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'school-supplies',
  moduleId: 'school',
  title: 'School Supplies',
  shortTitle: 'Supplies',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'school-pencil', label: 'Pencil', videoPath: videoUrl('/videos/school/pencil.mp4'), acceptedAnswers: ['pencil'] },
    { id: 'school-pen', label: 'Pen', videoPath: videoUrl('/videos/school/pen.mp4'), acceptedAnswers: ['pen'] },
    { id: 'school-crayon', label: 'Crayon', videoPath: videoUrl('/videos/school/crayon.mp4'), acceptedAnswers: ['crayon'] },
    { id: 'school-paper', label: 'Paper', videoPath: videoUrl('/videos/school/paper.mp4'), acceptedAnswers: ['paper'] },
    { id: 'school-eraser', label: 'Eraser', videoPath: videoUrl('/videos/school/eraser.mp4'), acceptedAnswers: ['eraser'] },
    { id: 'school-ruler', label: 'Ruler', videoPath: videoUrl('/videos/school/ruler.mp4'), acceptedAnswers: ['ruler'] },
  ],
}

export default submodule
